import { Stack } from "expo-router/stack";
import { colors } from "@/lib/design-tokens";

export default function ResourceLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShown: false,
      }}
    />
  );
}
