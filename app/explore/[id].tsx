import * as React from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { EXPLORE_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import {
  addCategoryToPath,
  getExploreCategory,
  getUserPathCategories,
  type ExploreCategory,
} from "@/lib/supabase";

export default function ExploreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = typeof id === "string" ? id : "";
  const [category, setCategory] = React.useState<ExploreCategory | null>(null);
  const [isInPath, setIsInPath] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const load = React.useCallback(async () => {
    if (!categoryId) {
      setCategory(null);
      setIsInPath(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [nextCategory, pathCategories] = await Promise.all([
        getExploreCategory(categoryId),
        getUserPathCategories(),
      ]);

      setCategory(nextCategory);
      setIsInPath(pathCategories.some((pathCategory) => pathCategory.id === categoryId));
    } catch {
      setCategory(null);
      setIsInPath(false);
      setErrorMessage("We couldn't load this category. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  async function handleAddToPath() {
    if (!category || isSaving || isInPath) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await addCategoryToPath(category.id);
      void trackEvent(EXPLORE_EVENTS.TASK_ADDED_FROM_EXPLORE, {
        category_id: category.id,
        category_name: category.name,
        screen: SCREENS.EXPLORE,
        target_type: "category",
        target_id: category.id,
      });
      setIsInPath(true);
    } catch {
      setErrorMessage("We couldn't add this to your path. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

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

  if (!category) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader showBack />
        <SafeAreaView className="flex-1 px-5 pt-6" edges={["left", "right", "bottom"]}>
          <Text className="text-base text-foreground">
            {errorMessage || "This roadmap item could not be found."}
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader showBack />
      <SafeAreaView className="flex-1" edges={["left", "right", "bottom"]}>
        {/* Fixed: the category name stays put while the body scrolls. */}
        <View className="px-5 pt-8">
          <Text className="text-[26px] font-bold leading-8 text-foreground">{category.name}</Text>
        </View>

        {/* Only this body scrolls, and only when its content outgrows the space —
            bouncing is off so a short category can't be dragged around. */}
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          className="flex-1"
          contentContainerClassName="px-5 pb-8 pt-5"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {category.long_description ? (
            <Text className="text-base leading-7 text-foreground">
              {category.long_description}
            </Text>
          ) : null}

          {errorMessage ? (
            <Text className="mt-4 text-sm leading-5 text-destructive">{errorMessage}</Text>
          ) : null}

          <View className="mt-10 items-end">
            <Button
              className="min-w-[160px] items-center justify-center rounded-md px-6 py-6"
              disabled={isSaving || isInPath}
              onPress={handleAddToPath}
              variant="destructive"
            >
              {isSaving ? (
                <ActivityIndicator
                  color={colors.destructiveForeground}
                  size="small"
                  style={{ marginRight: 8 }}
                />
              ) : null}
              <Text className="font-medium text-destructive-foreground">
                {isInPath ? "Added to My Path" : isSaving ? "Adding" : "Add to My Path"}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
