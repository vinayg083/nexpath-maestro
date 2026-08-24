import { FlatList, useWindowDimensions, View } from "react-native";
import { ResourceLinkCard } from "@/components/resources/ResourceLinkCard";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import type { ResourceCarousel } from "@/lib/supabase";

type ResourceCategorySectionProps = {
  category: ResourceCarousel;
};

const HORIZONTAL_PADDING = 24;
const CARD_GAP = 16;

export function ResourceCategorySection({ category }: ResourceCategorySectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

  return (
    <View className="py-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-lg font-bold text-foreground">{category.name}</Text>
        <LucideIcon color={colors.mutedForeground} name="ChevronRight" size={24} strokeWidth={2} />
      </View>

      <FlatList
        horizontal
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        contentContainerStyle={{ paddingRight: HORIZONTAL_PADDING }}
        data={category.items}
        decelerationRate="fast"
        keyExtractor={(item) => item.id}
        nestedScrollEnabled
        renderItem={({ item }) => <ResourceLinkCard item={item} width={cardWidth} />}
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
