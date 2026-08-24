import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import LucideIcon from "@/lib/icons/LucideIcon";
import type { IconName } from "@/lib/icons/LucideIcon";

type OnboardingChoiceProps = {
  icon?: IconName;
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function OnboardingChoice({ icon, label, onPress, selected }: OnboardingChoiceProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        "h-[124px] items-center justify-center gap-2 rounded-none border-2 bg-secondary px-3 py-[15px] active:opacity-80",
        selected ? "border-primary" : "border-border",
      )}
      onPress={onPress}
    >
      {icon ? (
        <View className="h-9 w-9 items-center justify-center">
          <LucideIcon name={icon} className="h-8 w-8 text-muted-foreground" strokeWidth={1.8} />
        </View>
      ) : null}
      <Text className="text-center text-base font-medium leading-6 text-foreground">{label}</Text>
    </Pressable>
  );
}
