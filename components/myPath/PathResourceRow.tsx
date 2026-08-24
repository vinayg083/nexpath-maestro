import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { RESOURCES_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import { canOpenResource, openResource } from "@/lib/open-resource";
import type { PathTaskResource } from "@/lib/supabase";

type PathResourceRowProps = {
  resource: PathTaskResource;
};

export function PathResourceRow({ resource }: PathResourceRowProps) {
  const isInteractive = canOpenResource({
    type: resource.type,
    url: resource.url,
    phone: resource.phone,
    body: resource.body,
    title: resource.title,
  });

  async function handlePress() {
    trackEvent(RESOURCES_EVENTS.RESOURCE_OPENED, {
      screen: SCREENS.RESOURCE_DETAIL,
      target_type: "resource",
      target_id: resource.id,
    });

    await openResource({
      type: resource.type,
      url: resource.url,
      phone: resource.phone,
      body: resource.body,
      title: resource.title,
    });
  }

  return (
    <Pressable
      accessibilityRole={isInteractive ? "button" : undefined}
      className={`border-b border-border px-5 py-4 ${isInteractive ? "active:opacity-80" : ""}`}
      disabled={!isInteractive}
      onPress={isInteractive ? handlePress : undefined}
    >
      <View className="flex-row items-start gap-3">
        {resource.image_url ? (
          <Image
            accessibilityIgnoresInvertColors
            source={{ uri: resource.image_url }}
            style={{ width: 72, height: 72, borderRadius: 8 }}
          />
        ) : (
          <View className="h-[72px] w-[72px] rounded-lg bg-[#E5E7EB]" />
        )}

        <View className="min-w-0 flex-1">
          {resource.providerName ? (
            <Text className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {resource.providerName}
            </Text>
          ) : null}
          <Text className="mt-0.5 text-base font-medium text-primary">{resource.title}</Text>
          {resource.type ? (
            <Text className="mt-1 text-sm text-muted-foreground">{resource.type}</Text>
          ) : null}
          {resource.type === "text" && resource.body ? (
            <Text className="mt-2 text-sm leading-5 text-foreground" numberOfLines={3}>
              {resource.body}
            </Text>
          ) : null}
          {resource.type === "hotline" && resource.phone ? (
            <Text className="mt-2 text-sm font-medium text-foreground">{resource.phone}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
