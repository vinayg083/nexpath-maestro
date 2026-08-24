import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { resolveCategoryIcon } from "@/lib/category-icon";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import type { ExploreCategory } from "@/lib/supabase";

type ExploreCategoryRowProps = {
  category: ExploreCategory;
  onPress: () => void;
};

export function ExploreCategoryRow({ category, onPress }: ExploreCategoryRowProps) {
  const icon = resolveCategoryIcon(category.icon_key) ?? "Folder";

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-center gap-3 px-6 py-3 active:opacity-80"
      onPress={onPress}
    >
      <View className="h-20 w-28 items-center justify-center rounded-md bg-muted">
        <LucideIcon color={colors.mutedForeground} name={icon} size={34} strokeWidth={2.25} />
      </View>

      <View className="min-w-0 flex-1 pr-1">
        <Text className="text-[17px] font-medium leading-6 text-primary underline">
          {category.name}
        </Text>
        {category.short_description ? (
          <Text
            className="mt-2.5 text-[15px] italic leading-5 text-muted-foreground"
            ellipsizeMode="tail"
            numberOfLines={2}
          >
            {category.short_description}
          </Text>
        ) : null}
      </View>

      <LucideIcon color={colors.mutedForeground} name="ChevronRight" size={22} strokeWidth={2} />
    </Pressable>
  );
}
