import * as React from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import { ExploreCategoryRow } from "@/components/myPath/ExploreCategoryRow";
import { Text } from "@/components/ui/text";
import { SCREENS, useScreenView } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import { getExploreCategories, type ExploreCategory } from "@/lib/supabase";

export default function ExploreScreen() {
  useScreenView(SCREENS.EXPLORE);

  const [categories, setCategories] = React.useState<ExploreCategory[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      async function load() {
        setIsLoading(true);
        setLoadError("");

        try {
          const options = await getExploreCategories();

          if (!isMounted) {
            return;
          }

          setCategories(options);
        } catch {
          if (!isMounted) {
            return;
          }

          setCategories([]);
          setLoadError("We couldn't load explore options. Please try again.");
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      }

      void load();

      return () => {
        isMounted = false;
      };
    }, []),
  );

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader showBack />
      <SafeAreaView className="flex-1" edges={["left", "right", "bottom"]}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            contentContainerClassName="pb-8"
            data={categories}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View className="px-5 pt-10">
                <Text className="text-center text-base leading-7 text-foreground">
                  {loadError || "There are no goal categories available yet."}
                </Text>
              </View>
            }
            ListFooterComponent={
              loadError && categories.length > 0 ? (
                <Text className="px-5 py-3 text-center text-sm leading-5 text-destructive">
                  {loadError}
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <ExploreCategoryRow
                category={item}
                onPress={() => router.push(`/explore/${item.id}`)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
