import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoPlayer } from "@/components/resources/VideoPlayer";
import { Text } from "@/components/ui/text";
import { RESOURCES_EVENTS, SCREENS, trackEvent, useScreenView } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import { canOpenResource, openResource } from "@/lib/open-resource";
import { cacheResources, getCachedResource } from "@/lib/resource-cache";
import { getResourceById, type ResourceCarouselItem } from "@/lib/supabase";

type ResourceKind = "video" | "website" | "hotline" | "text";

/** Backend `type` values map onto the four detail layouts this screen renders. */
function normalizeResourceKind(type: string | null): ResourceKind {
  switch (type?.toLowerCase()) {
    case "video":
    case "youtube":
      return "video";
    case "hotline":
      return "hotline";
    case "text":
      return "text";
    case "website":
    default:
      return "website";
  }
}

function closeDetail() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/resources");
}

function DetailChrome({ isVideo = false, title }: { isVideo?: boolean; title?: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-5 pt-2"
      pointerEvents="box-none"
      style={[styles.chrome, { top: insets.top }]}
    >
      <View className="h-11 w-11" />

      <View className="mx-3 min-w-0 flex-1 items-center">
        {title ? (
          <Text
            className={
              isVideo
                ? "text-center text-xs font-medium text-white/80"
                : "text-center text-xs font-medium text-muted-foreground"
            }
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Close resource"
        accessibilityRole="button"
        className="h-11 w-11 items-center justify-center rounded-full active:opacity-75"
        onPress={closeDetail}
        style={isVideo ? styles.videoIconButton : styles.lightIconButton}
      >
        <LucideIcon
          color={isVideo ? colors.primaryForeground : colors.foreground}
          name="X"
          size={22}
        />
      </Pressable>
    </View>
  );
}

/** Title/description shown in the player's caption slot, directly above the controls. */
function VideoCaption({ resource }: { resource: ResourceCarouselItem }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const description = resource.body?.trim();

  return (
    <View className="items-start px-5" pointerEvents="box-none">
      <Pressable
        accessibilityLabel={description ? "Expand video description" : undefined}
        accessibilityRole={description ? "button" : undefined}
        className="max-w-[88%] items-start"
        disabled={!description}
        onPress={() => setIsExpanded((current) => !current)}
      >
        <Text className="text-[18px] font-bold leading-6 text-white">{resource.title}</Text>
        {description ? (
          <Text
            className="mt-1 text-left text-[14px] leading-5 text-white"
            numberOfLines={isExpanded ? undefined : 3}
          >
            {description}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

/** Video resources fill the screen with the player; the caption sits in its caption slot. */
function VideoResourceDetail({ resource }: { resource: ResourceCarouselItem }) {
  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <VideoPlayer caption={<VideoCaption resource={resource} />} video_url={resource.url} />

      {/* Everything above the player stays pointer-transparent outside its own controls
          so taps meant for the player's slider and buttons are never intercepted. */}
      <SafeAreaView
        className="flex-1 justify-end"
        edges={["top", "left", "right", "bottom"]}
        pointerEvents="box-none"
      >
        <DetailChrome isVideo title={resource.provider || undefined} />
      </SafeAreaView>
    </View>
  );
}

/** Website, hotline and text resources share a title/description page; only the action differs. */
function StandardResourceDetail({
  kind,
  resource,
}: {
  kind: Exclude<ResourceKind, "video">;
  resource: ResourceCarouselItem;
}) {
  const description = resource.body?.trim();
  const canAct = kind !== "text" && canOpenResource(resource);
  const buttonLabel =
    kind === "hotline"
      ? resource.phone
        ? `Call ${resource.phone}`
        : "Phone unavailable"
      : "Open Website";

  async function handleAction() {
    if (!canAct) {
      return;
    }

    void trackEvent(RESOURCES_EVENTS.RESOURCE_OPENED, {
      screen: SCREENS.RESOURCE_DETAIL,
      target_type: "resource",
      target_id: resource.id,
    });

    await openResource(resource);
  }

  return (
    <View className="flex-1 bg-background">
      {/* The video page sets a light status bar, so the light pages must set it back. */}
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "left", "right", "bottom"]}>
        <DetailChrome title={resource.provider || undefined} />

        {/* Fixed, alongside the chrome above it. */}
        <View className="px-6 pt-16">
          <Text className="mt-3 text-[30px] font-bold leading-10 text-foreground">
            {resource.title}
          </Text>
        </View>

        {/* Only the description scrolls, and only when it outgrows the space —
            without this a long body was simply clipped. */}
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          className="flex-1"
          contentContainerClassName="px-6 pb-6 pt-4"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {description ? (
            <Text className="text-base leading-7 text-foreground">{description}</Text>
          ) : null}
        </ScrollView>

        {/* Pinned: the action never scrolls out of reach. */}
        {kind !== "text" ? (
          <View className="w-full items-center px-6 pb-4 pt-4">
            <Pressable
              accessibilityLabel={buttonLabel}
              accessibilityRole="button"
              className="w-full flex-row items-center justify-center rounded-md px-5 py-4 active:opacity-75"
              disabled={!canAct}
              onPress={handleAction}
              style={[styles.actionButton, !canAct ? styles.actionButtonDisabled : undefined]}
            >
              <Text className="text-base font-semibold text-primary-foreground">{buttonLabel}</Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

function DetailMessage({ message }: { message: string }) {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "left", "right", "bottom"]}>
        <DetailChrome />

        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base leading-7 text-muted-foreground">{message}</Text>
          <Pressable
            accessibilityLabel="Back"
            accessibilityRole="button"
            className="mt-7 rounded-md bg-primary px-8 py-4 active:opacity-75"
            onPress={closeDetail}
          >
            <Text className="text-base font-semibold text-primary-foreground">Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function ResourceDetailScreen() {
  useScreenView(SCREENS.RESOURCE_DETAIL);

  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  const id = typeof resourceId === "string" ? resourceId : "";
  // Opened from the Resources tab, this is already loaded — render it at once and
  // refresh in the background instead of blocking on a spinner.
  const [resource, setResource] = React.useState<ResourceCarouselItem | null>(() =>
    getCachedResource(id),
  );
  const [isLoading, setIsLoading] = React.useState(() => getCachedResource(id) === null);
  const [errorMessage, setErrorMessage] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      // Only a cold open (deep link / reload) has nothing to show yet.
      const hasCachedResource = getCachedResource(id) !== null;

      setIsLoading(!hasCachedResource);

      try {
        const nextResource = await getResourceById(id);

        if (!isMounted) {
          return;
        }

        if (nextResource) {
          cacheResources([nextResource]);
        }

        setResource(nextResource);
        setErrorMessage(nextResource ? "" : "This resource is no longer available.");
      } catch {
        if (isMounted && !hasCachedResource) {
          setErrorMessage("We couldn't load this resource. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!resource) {
    return <DetailMessage message={errorMessage || "This resource is no longer available."} />;
  }

  const kind = normalizeResourceKind(resource.type);

  if (kind === "video") {
    return <VideoResourceDetail resource={resource} />;
  }

  return <StandardResourceDetail kind={kind} resource={resource} />;
}

const styles = StyleSheet.create({
  actionButton: {
    backgroundColor: colors.primary,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  chrome: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  lightIconButton: {
    backgroundColor: colors.secondary,
  },
  videoIconButton: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
});
