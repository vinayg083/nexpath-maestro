import * as React from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import { DirectoriesSection } from "@/components/resources/DirectoriesSection";
import { ResourceCategorySection } from "@/components/resources/ResourceCategorySection";
import { Text } from "@/components/ui/text";
import { SCREENS, useScreenView } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import { cacheResources } from "@/lib/resource-cache";
import {
  getDirectoriesForProfile,
  getResourceCarousels,
  type DirectoryItem,
  type ResourceCarousel,
} from "@/lib/supabase";

export default function ResourcesScreen() {
  useScreenView(SCREENS.RESOURCES);

  const [categories, setCategories] = React.useState<ResourceCarousel[]>([]);
  const [directories, setDirectories] = React.useState<DirectoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const loadResources = React.useCallback(async () => {
    setErrorMessage("");

    const nextCategories = await getResourceCarousels();
    const nextDirectories = await getDirectoriesForProfile().catch(() => []);

    setCategories(nextCategories);
    setDirectories(nextDirectories);
    // Detail opens straight from this data instead of refetching it.
    cacheResources(nextCategories.flatMap((category) => category.items));
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);

      try {
        const nextCategories = await getResourceCarousels();
        const nextDirectories = await getDirectoriesForProfile().catch(() => []);

        if (!isMounted) {
          return;
        }

        setCategories(nextCategories);
        setDirectories(nextDirectories);
        setErrorMessage("");
        cacheResources(nextCategories.flatMap((category) => category.items));
      } catch {
        if (isMounted) {
          setErrorMessage("We couldn't load resources. Please try again.");
        }
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
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await loadResources();
    } catch {
      setErrorMessage("We couldn't refresh resources. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const hasResources = categories.length > 0 || directories.length > 0;

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : errorMessage ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base leading-7 text-destructive">
              {errorMessage}
            </Text>
            <Pressable
              accessibilityLabel="Try loading resources again"
              accessibilityRole="button"
              className="mt-5 rounded-md bg-primary px-5 py-3 active:opacity-75"
              onPress={() => {
                setIsLoading(true);
                void loadResources()
                  .then(() => setErrorMessage(""))
                  .catch(() => setErrorMessage("We couldn't load resources. Please try again."))
                  .finally(() => setIsLoading(false));
              }}
            >
              <Text className="text-base font-semibold text-primary-foreground">Try again</Text>
            </Pressable>
          </View>
        ) : !hasResources ? (
          <FlatList
            contentContainerClassName="flex-grow items-center justify-center px-6"
            data={[]}
            keyExtractor={(_, index) => String(index)}
            ListEmptyComponent={
              <Text className="text-center text-xl font-bold text-foreground">
                No resources available yet.
              </Text>
            }
            refreshControl={
              <RefreshControl
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                tintColor={colors.primary}
              />
            }
            renderItem={() => null}
          />
        ) : (
          <FlatList
            contentContainerClassName="px-6 pb-8"
            data={categories}
            keyExtractor={(category) => category.id}
            ListFooterComponent={
              directories.length > 0 ? <DirectoriesSection directories={directories} /> : null
            }
            refreshControl={
              <RefreshControl
                onRefresh={handleRefresh}
                refreshing={isRefreshing}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => <ResourceCategorySection category={item} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
