import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import { RESOURCES_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import type { ResourceCarouselItem } from "@/lib/supabase";

type ResourceLinkCardProps = {
  item: ResourceCarouselItem;
  width: number;
};

export function ResourceLinkCard({ item, width }: ResourceLinkCardProps) {
  // Every card opens the in-app detail screen, which renders the layout for the
  // resource's type and owns the actual open/call action.
  function handlePress() {
    void trackEvent(RESOURCES_EVENTS.RESOURCE_OPENED, {
      screen: SCREENS.RESOURCES,
      target_type: "resource",
      target_id: item.id,
    });

    router.push(`/resource/${item.id}`);
  }

  return (
    <Pressable
      accessibilityLabel={`Open ${item.label}`}
      accessibilityRole="button"
      className="active:opacity-70"
      onPress={handlePress}
      style={{ width }}
    >
      {item.image_url ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: item.image_url }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 2 }}
        />
      ) : (
        <View className="aspect-[4/3] w-full rounded-sm bg-[#E5E7EB]" />
      )}
      <Text
        className="mt-2 text-sm leading-5 text-primary underline"
        ellipsizeMode="tail"
        numberOfLines={2}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}
