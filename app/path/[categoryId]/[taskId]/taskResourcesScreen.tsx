import { StatusBar } from "expo-status-bar";
import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { VideoPlayer } from "@/components/resources/VideoPlayer";
import { Text } from "@/components/ui/text";
import {
  MY_PATH_EVENTS,
  RESOURCES_EVENTS,
  SCREENS,
  trackEvent,
  useScreenView,
} from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import { canOpenResource, openResource } from "@/lib/open-resource";
import {
  getPathTask,
  getPathTaskResources,
  type PathTaskItem,
  type PathTaskResource,
} from "@/lib/supabase";

type FeedEntry =
  | {
      kind: "resource";
      item: PathTaskResource;
    }
  | {
      kind: "end";
      id: "end";
    };

type NormalizedResourceKind = "video" | "website" | "hotline" | "text";
type TaskResourceAnalyticsAction = "viewed" | "opened" | "played";

function normalizeResourceKind(type: string | null): NormalizedResourceKind {
  switch (type?.toLowerCase()) {
    case "video":
      return "video";
    case "hotline":
      return "hotline";
    case "text":
      return "text";
    case "website":
    case "youtube":
    default:
      return "website";
  }
}

function trackTaskResourceViewed({
  action,
  categoryId,
  index,
  resource,
  task,
  total,
}: {
  action: TaskResourceAnalyticsAction;
  categoryId: string;
  index: number;
  resource: PathTaskResource;
  task: PathTaskItem | null;
  total: number;
}) {
  void trackEvent(MY_PATH_EVENTS.TASK_RESOURCE_VIEWED, {
    action,
    category_id: categoryId,
    resource_count: total,
    resource_id: resource.id,
    resource_index: index + 1,
    resource_title: resource.title,
    resource_type: resource.type,
    screen: SCREENS.RESOURCE_DETAIL,
    target_type: "resource",
    target_id: resource.id,
    task_id: task?.id,
    task_title: task?.title,
  });
}

function closeViewer() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace("/(tabs)/myPathScreen");
}

function ViewerChrome({
  current,
  isVideo = false,
  onClose,
  taskTitle,
  total,
}: {
  current?: number;
  isVideo?: boolean;
  onClose?: () => void;
  taskTitle?: string;
  total: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-5 pt-2"
      pointerEvents="box-none"
      style={[styles.viewerChrome, { top: insets.top }]}
    >
      <View className="h-11 w-11" />

      <View className="mx-3 min-w-0 flex-1 items-center">
        {taskTitle ? (
          <Text
            className={
              isVideo
                ? "text-center text-xs font-medium text-white/80"
                : "text-center text-xs font-medium text-muted-foreground"
            }
            numberOfLines={1}
          >
            {taskTitle}
          </Text>
        ) : null}
        {current ? (
          <Text
            className={
              isVideo
                ? "mt-0.5 text-xs font-medium text-white"
                : "mt-0.5 text-xs font-medium text-primary"
            }
          >
            {current} / {total}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Close resource viewer"
        accessibilityRole="button"
        className="h-11 w-11 items-center justify-center rounded-full active:opacity-75"
        onPress={onClose ?? closeViewer}
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

function TaskVideoPage({
  index,
  isActive,
  onClose,
  resource,
  taskTitle,
  total,
}: {
  index: number;
  isActive: boolean;
  onClose: () => void;
  resource: PathTaskResource;
  taskTitle?: string;
  total: number;
}) {
  return (
    <View className="flex-1 bg-black" style={styles.page}>
      <VideoPlayer
        caption={<VideoMetadataOverlay resource={resource} />}
        isActive={isActive}
        video_url={resource.url}
      />

      {/* Everything above the player must stay pointer-transparent outside its own
          controls: on web, any element capturing clicks here blocks the YouTube iframe. */}
      <SafeAreaView
        className="flex-1 justify-end"
        edges={["top", "left", "right", "bottom"]}
        pointerEvents="box-none"
      >
        <ViewerChrome
          current={index + 1}
          isVideo
          onClose={onClose}
          taskTitle={taskTitle}
          total={total}
        />
      </SafeAreaView>
    </View>
  );
}

function VideoMetadataOverlay({ resource }: { resource: PathTaskResource }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const description = resource.body?.trim();

  return (
    // Rendered inside VideoPlayer's caption slot, which owns the 16px gap above the controls.
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

function TaskResourcePage({
  categoryId,
  index,
  isActive,
  resource,
  task,
  total,
}: {
  categoryId: string;
  index: number;
  isActive: boolean;
  resource: PathTaskResource;
  task: PathTaskItem | null;
  total: number;
}) {
  const hasTrackedView = React.useRef(false);
  const kind = normalizeResourceKind(resource.type);
  const taskTitle = task?.title;

  const canAct = kind !== "text" && kind !== "video" && canOpenResource(resource);
  const description = resource.body?.trim();
  const buttonLabel =
    kind === "hotline"
      ? resource.phone
        ? `Call ${resource.phone}`
        : "Phone unavailable"
      : "Open Website";

  React.useEffect(() => {
    if (!isActive || hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackTaskResourceViewed({
      action: "viewed",
      categoryId,
      index,
      resource,
      task,
      total,
    });
  }, [categoryId, index, isActive, resource, task, total]);

  if (kind === "video") {
    return (
      <TaskVideoPage
        index={index}
        isActive={isActive}
        onClose={closeViewer}
        resource={resource}
        taskTitle={taskTitle}
        total={total}
      />
    );
  }

  async function handleAction() {
    if (!canAct) {
      return;
    }

    void trackEvent(RESOURCES_EVENTS.RESOURCE_OPENED, {
      screen: SCREENS.RESOURCE_DETAIL,
      target_type: "resource",
      target_id: resource.id,
    });
    trackTaskResourceViewed({
      action: "opened",
      categoryId,
      index,
      resource,
      task,
      total,
    });

    await openResource(resource);
  }

  return (
    <View className="flex-1 bg-background" style={styles.page}>
      <SafeAreaView className="flex-1" edges={["top", "left", "right", "bottom"]}>
        <ViewerChrome current={index + 1} onClose={closeViewer} taskTitle={taskTitle} total={total} />

        {/* Fixed, alongside the chrome above it. */}
        <View className="px-6 pt-16">
          <Text className="mt-3 text-[30px] font-bold leading-10 text-foreground">
            {resource.title}
          </Text>
        </View>

        {/* Only the description scrolls, and only when it outgrows the page. Bouncing
            is off so a short resource never steals the feed's paging gesture. */}
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

function EndPage({ taskTitle }: { taskTitle?: string }) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <ViewerChrome onClose={closeViewer} taskTitle={taskTitle} total={0} />

      <View className="flex-1 items-center justify-center px-8">
        <View style={styles.endIcon}>
          <LucideIcon color={colors.primary} name="Check" size={58} strokeWidth={1.7} />
        </View>
        <Text className="mt-8 text-center text-[30px] font-bold leading-10 text-foreground">
          You've reached the end of this task.
        </Text>
        <Text className="mt-3 text-center text-base leading-7 text-muted-foreground">
          No more resources available.
        </Text>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          className="mt-7 rounded-md bg-primary px-8 py-4 active:opacity-75"
          onPress={closeViewer}
        >
          <Text className="text-base font-semibold text-primary-foreground">Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function TaskResourcesScreen() {
  useScreenView(SCREENS.RESOURCE_DETAIL);

  const { categoryId, taskId } = useLocalSearchParams<{ categoryId: string; taskId: string }>();
  const parentCategoryId = typeof categoryId === "string" ? categoryId : "";
  const id = typeof taskId === "string" ? taskId : "";
  const listRef = React.useRef<FlatList<FeedEntry>>(null);
  const insets = useSafeAreaInsets();
  const [task, setTask] = React.useState<PathTaskItem | null>(null);
  const [entries, setEntries] = React.useState<FeedEntry[]>([]);
  const [viewerHeight, setViewerHeight] = React.useState(0);
  const [resourceCount, setResourceCount] = React.useState(0);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");
  const pageHeight = Math.max(viewerHeight, 360);
  const taskTitle = task?.title;
  const activeEntry = entries[activeIndex];
  const isActiveVideoPage =
    activeEntry?.kind === "resource" &&
    normalizeResourceKind(activeEntry.item.type) === "video";
  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 70,
    minimumViewTime: 80,
  }).current;
  const onViewableItemsChanged = React.useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ index: number | null }>;
    }) => {
      const nextIndex = viewableItems.find((item) => item.index != null)?.index;
      if (typeof nextIndex === "number") {
        setActiveIndex(nextIndex);
      }
    },
  ).current;

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [nextTask, nextResources] = await Promise.all([
          getPathTask(id),
          getPathTaskResources(id),
        ]);

        if (!isMounted) {
          return;
        }

        setTask(nextTask);

        if (!nextTask) {
          setEntries([]);
          setResourceCount(0);
          setErrorMessage("We couldn't load this task. Please try again.");
          return;
        }

        setResourceCount(nextResources.length);
        setEntries([
          ...nextResources.map((item) => ({ kind: "resource" as const, item })),
          { kind: "end", id: "end" },
        ]);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage("We couldn't load resources. Please try again.");
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

  function updateActiveIndexFromOffset(offsetY: number) {
    if (pageHeight <= 0) {
      return;
    }

    const nextIndex = Math.round(offsetY / pageHeight);
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  }

  function handleMomentumEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    updateActiveIndexFromOffset(event.nativeEvent.contentOffset.y);
  }

  function handleScrollEndDrag(event: NativeSyntheticEvent<NativeScrollEvent>) {
    updateActiveIndexFromOffset(event.nativeEvent.contentOffset.y);
  }

  const renderItem = React.useCallback<ListRenderItem<FeedEntry>>(
    ({ index, item }) => (
      <View style={{ height: pageHeight }}>
        {item.kind === "resource" ? (
          <TaskResourcePage
            categoryId={parentCategoryId}
            index={index}
            isActive={activeIndex === index}
            resource={item.item}
            task={task}
            total={resourceCount}
          />
        ) : (
          <EndPage taskTitle={taskTitle} />
        )}
      </View>
    ),
    [activeIndex, pageHeight, parentCategoryId, resourceCount, task, taskTitle],
  );

  return (
    <View
      className="flex-1 bg-background"
      onLayout={(event) => setViewerHeight(event.nativeEvent.layout.height)}
    >
      <StatusBar
        backgroundColor={isActiveVideoPage ? colors.overlay : colors.background}
        style={isActiveVideoPage ? "light" : "dark"}
      />
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : errorMessage ? (
        <SafeAreaView
          className="flex-1 items-center justify-center px-6"
          edges={["top", "left", "right", "bottom"]}
        >
          <Text className="text-center text-base leading-7 text-destructive">{errorMessage}</Text>
          <Pressable
            accessibilityLabel="Close resource viewer"
            accessibilityRole="button"
            className="mt-6 rounded-md bg-primary px-6 py-4 active:opacity-75"
            onPress={closeViewer}
          >
            <Text className="text-base font-semibold text-primary-foreground">Close</Text>
          </Pressable>
        </SafeAreaView>
      ) : resourceCount === 0 ? (
        <SafeAreaView
          className="flex-1 items-center justify-center px-6"
          edges={["top", "left", "right", "bottom"]}
        >
          <Text className="text-center text-xl font-bold text-foreground">
            No resources linked to this task yet.
          </Text>
          <Pressable
            accessibilityLabel="Close resource viewer"
            accessibilityRole="button"
            className="mt-6 rounded-md bg-primary px-6 py-4 active:opacity-75"
            onPress={closeViewer}
          >
            <Text className="text-base font-semibold text-primary-foreground">Close</Text>
          </Pressable>
        </SafeAreaView>
      ) : (
        <FlatList
          ref={listRef}
          data={entries}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            index,
            length: pageHeight,
            offset: pageHeight * index,
          })}
          initialNumToRender={2}
          keyExtractor={(item) => (item.kind === "resource" ? item.item.id : item.id)}
          maxToRenderPerBatch={3}
          onMomentumScrollEnd={handleMomentumEnd}
          onScrollEndDrag={handleScrollEndDrag}
          onViewableItemsChanged={onViewableItemsChanged}
          pagingEnabled
          removeClippedSubviews={Platform.OS !== "web"}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={Platform.OS === "web" ? pageHeight : undefined}
          style={{ height: pageHeight, paddingBottom: insets.bottom ? 0 : undefined }}
          viewabilityConfig={viewabilityConfig}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: "center",
    backgroundColor: colors.primary,
    maxWidth: 360,
    width: "100%",
  },
  actionButtonDisabled: {
    backgroundColor: colors.mutedForeground,
  },
  endIcon: {
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 999,
    height: 116,
    justifyContent: "center",
    width: 116,
  },
  lightIconButton: {
    backgroundColor: colors.secondary,
  },
  page: {
    overflow: "hidden",
  },
  viewerChrome: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
  videoIconButton: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
});
