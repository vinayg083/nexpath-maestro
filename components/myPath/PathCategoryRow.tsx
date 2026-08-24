import { Pressable, View } from "react-native";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { resolveCategoryIcon } from "@/lib/category-icon";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import type { PathCategoryStatus, PathCategorySummary } from "@/lib/supabase";

type PathCategoryRowProps = {
  category: PathCategorySummary;
  statusLabel: string;
  onPress: () => void;
};

export function PathCategoryRow({ category, statusLabel, onPress }: PathCategoryRowProps) {
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
        <Text className="text-[17px] font-medium leading-6 text-primary underline">{category.name}</Text>
        <Text
          className="mt-2.5 pt-0.5 text-[15px] italic leading-none text-muted-foreground"
          style={{ includeFontPadding: false }}
        >
          {statusLabel}
        </Text>
        <Progress
          className="mt-2.5 h-2.5 rounded-full bg-secondary"
          indicatorClassName="rounded-full bg-[#5BBF73]"
          value={category.progressPercent}
        />
      </View>

      <LucideIcon color={colors.mutedForeground} name="ChevronRight" size={22} strokeWidth={2} />
    </Pressable>
  );
}

export function defaultStatusLabel(status: PathCategoryStatus) {
  switch (status) {
    case "done":
      return "Completed";
    case "in_progress":
      return "Making progress";
    default:
      return "Getting going";
  }
}
