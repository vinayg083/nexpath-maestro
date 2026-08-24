import * as React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import { cacheCategoryTasks } from "@/lib/path-cache";
import { PathTaskRow } from "@/components/myPath/PathTaskRow";
import { Text } from "@/components/ui/text";
import { MY_PATH_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import {
  getExploreCategory,
  getPathTasksForCategory,
  type ExploreCategory,
  type PathTaskItem,
} from "@/lib/supabase";

export default function TasksScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const id = typeof categoryId === "string" ? categoryId : "";
  const [category, setCategory] = React.useState<ExploreCategory | null>(null);
  const [tasks, setTasks] = React.useState<PathTaskItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  const load = React.useCallback(async () => {
    if (!id) {
      setCategory(null);
      setTasks([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextCategory, nextTasks] = await Promise.all([
        getExploreCategory(id),
        getPathTasksForCategory(id),
      ]);

      if (!nextCategory) {
        setCategory(null);
        setTasks([]);
        setErrorMessage("We couldn't load this category. Please try again.");
        return;
      }

      setCategory(nextCategory);
      setTasks(nextTasks);
      // Detail opens straight from this data instead of refetching it.
      cacheCategoryTasks(nextCategory, nextTasks);
    } catch {
      setCategory(null);
      setTasks([]);
      setErrorMessage("We couldn't load tasks for this category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader showBack />
        <SafeAreaView
          className="flex-1 items-center justify-center"
          edges={["left", "right", "bottom"]}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader showBack />
      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {/* Fixed, like the task detail screen's header — only the list below scrolls. */}
        {category?.name ? (
          <View className="bg-background px-5 pb-4 pt-8">
            <Text className="text-[26px] font-bold leading-8 text-foreground">
              {category.name}
            </Text>
          </View>
        ) : null}

        <FlatList
          contentContainerClassName="pb-[50px]"
          data={tasks}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="px-5 pt-10">
              <Text className="text-center text-base leading-7 text-foreground">
                {errorMessage || "There are no tasks for this category yet."}
              </Text>
            </View>
          }
          ListFooterComponent={
            errorMessage && tasks.length > 0 ? (
              <Text className="px-5 pt-4 text-center text-sm leading-5 text-destructive">
                {errorMessage}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <PathTaskRow
              onPress={() => {
                trackEvent(MY_PATH_EVENTS.TASK_OPENED, {
                  screen: SCREENS.MY_PATH,
                  target_type: "task",
                  target_id: item.id,
                });
                router.push(`/path/${id}/${item.id}/taskDetailScreen`);
              }}
              task={item}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}
