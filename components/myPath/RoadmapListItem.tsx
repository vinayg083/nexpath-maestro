import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { resolveCategoryIcon } from "@/lib/category-icon";
import LucideIcon from "@/lib/icons/LucideIcon";
import { colors } from "@/lib/design-tokens";

export type RoadmapListItemData = {
  id: string;
  name: string;
  short_description: string | null;
  icon_key: string | null;
};

type RoadmapListItemProps = {
  item: RoadmapListItemData;
  onPress: () => void;
};

export function RoadmapListItem({ item, onPress }: RoadmapListItemProps) {
  const icon = resolveCategoryIcon(item.icon_key) ?? "Folder";

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 border-b border-border px-5 py-4 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-[68px] w-[68px] items-center justify-center rounded-md bg-muted">
        <LucideIcon color={colors.mutedForeground} name={icon} size={24} strokeWidth={2} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-base font-medium text-primary underline">{item.name}</Text>
        {item.short_description ? (
          <Text
            className="mt-1 text-sm leading-5 text-muted-foreground"
            ellipsizeMode="tail"
            numberOfLines={2}
          >
            {item.short_description}
          </Text>
        ) : null}
      </View>

      <LucideIcon color={colors.mutedForeground} name="ChevronRight" size={20} strokeWidth={2} />
    </Pressable>
  );
}
