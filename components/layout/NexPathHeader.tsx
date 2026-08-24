import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import LucideIcon from "@/lib/icons/LucideIcon";
import { colors } from "@/lib/design-tokens";

type NexPathHeaderProps = {
  showBack?: boolean;
};

export function NexPathHeader({ showBack = false }: NexPathHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-primary"
      style={{
        paddingTop: insets.top,
      }}
    >
      <StatusBar backgroundColor={colors.primary} style="light" />
      <View className="flex-row items-center px-3 pb-5 pt-5">
        {showBack ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center active:opacity-70"
            onPress={() => router.back()}
          >
            <LucideIcon
              color={colors.primaryForeground}
              name="ArrowLeft"
              size={22}
              strokeWidth={2.25}
            />
          </Pressable>
        ) : (
          <View className="h-10 w-10" />
        )}

        <Text className="flex-1 text-center text-[24px] font-semibold leading-10 text-primary-foreground">
          Nexpath
        </Text>

        <View className="h-10 w-10" />
      </View>
    </View>
  );
}
