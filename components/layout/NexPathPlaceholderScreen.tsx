import * as React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LucideIcon from "@/lib/icons/LucideIcon";
import { Text } from "@/components/ui/text";
import type { NexPathTab } from "@/lib/nexpath-tabs";

type NexPathPlaceholderScreenProps = {
  children?: React.ReactNode;
  tab: NexPathTab;
};

export function NexPathPlaceholderScreen({ children, tab }: NexPathPlaceholderScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <View className="flex-1 px-6 pb-8 pt-8">
        <View className="mx-auto w-full max-w-xl flex-1 justify-center">
          <View className="mb-8 flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
              <LucideIcon name={tab.icon} className="h-5 w-5 text-primary" strokeWidth={2.25} />
            </View>
            <View className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1">
              <Text className="text-caption font-medium uppercase text-primary">{tab.eyebrow}</Text>
            </View>
          </View>

          <Text className="text-h1 mb-4 text-foreground">{tab.title}</Text>
          <Text className="text-lg leading-8 text-muted-foreground">{tab.subtitle}</Text>

          {children ? <View className="mt-6 items-start">{children}</View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
