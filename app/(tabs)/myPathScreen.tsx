import * as React from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import { defaultStatusLabel, PathCategoryRow } from "@/components/myPath/PathCategoryRow";
import { Text } from "@/components/ui/text";
import { SCREENS, useScreenView } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import {
  getPathProgressLabels,
  getUserPathCategories,
  updateProfileTimezone,
  type PathCategoryStatus,
  type PathCategorySummary,
} from "@/lib/supabase";

/** Poppins sits optically high in fixed-height buttons — nudge content down slightly. */
const EXPLORE_LABEL_OPTICAL_OFFSET = Platform.OS === "android" ? 1 : 2;

export default function MyPathScreen() {
  useScreenView(SCREENS.MY_PATH);

  const [categories, setCategories] = React.useState<PathCategorySummary[]>([]);
  const [statusLabels, setStatusLabels] = React.useState<Record<PathCategoryStatus, string>>({
    not_started: defaultStatusLabel("not_started"),
    in_progress: defaultStatusLabel("in_progress"),
    done: defaultStatusLabel("done"),
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState("");
  const hasLoadedRef = React.useRef(false);

  const loadPath = React.useCallback(async () => {
    const showSpinner = !hasLoadedRef.current;

    if (showSpinner) {
      setIsLoading(true);
    }

    setLoadError("");

    try {
      const [[nextCategories, nextLabels]] = await Promise.all([
        Promise.all([getUserPathCategories(), getPathProgressLabels()]),
        updateProfileTimezone().catch(() => undefined),
      ]);

      setCategories(nextCategories);
      setStatusLabels(nextLabels);
      hasLoadedRef.current = true;
    } catch {
      setLoadError("We couldn't load your path. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadPath();
    }, [loadPath]),
  );

  function renderExploreButton(label: "Explore" | "Explore More", isFloating = false) {
    return (
      <View
        className="items-end px-6 pb-5 pt-2"
        pointerEvents="box-none"
        style={isFloating ? styles.floatingExplore : undefined}
      >
        <Pressable
          accessibilityRole="button"
          className="min-w-[200px] rounded-full bg-destructive active:opacity-90"
          onPress={() => router.push("/explore")}
          style={{
            alignItems: "center",
            height: 50,
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              gap: 10,
              transform: [{ translateY: EXPLORE_LABEL_OPTICAL_OFFSET }],
            }}
          >
            <Text
              className="font-medium text-destructive-foreground"
              style={{
                fontSize: 18,
                includeFontPadding: false,
                lineHeight: 22,
                textAlignVertical: "center",
              }}
            >
              {label}
            </Text>
            <LucideIcon
              color={colors.destructiveForeground}
              name="MoveRight"
              size={20}
              strokeWidth={3}
            />
          </View>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader />
        <SafeAreaView className="flex-1 items-center justify-center" edges={["left", "right"]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader />
        <SafeAreaView className="flex-1" edges={["left", "right"]}>
          <View className="flex-1 px-6">
            <View className="mt-5 items-center px-2">
              <Text className="max-w-[300px] text-center text-lg leading-7 text-foreground">
                There is nothing on your roadmap. Explore your options to get started.
              </Text>
              {loadError ? (
                <Text className="mt-4 text-center text-sm leading-5 text-destructive">
                  {loadError}
                </Text>
              ) : null}
            </View>
            <View className="flex-1" />
            {renderExploreButton("Explore")}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader />
      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <FlatList
          contentContainerClassName="pb-24"
          data={categories}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            loadError ? (
              <Text className="px-6 py-3 text-center text-sm leading-5 text-destructive">
                {loadError}
              </Text>
            ) : null
          }
          ListHeaderComponent={
            // bg-background matters: rows scroll underneath this, so it must be opaque.
            <View className="bg-background">
              <Text className="mt-5 px-6 pb-3 text-[24px] font-semibold leading-8 text-foreground">
                My Path
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <PathCategoryRow
              category={item}
              onPress={() => router.push(`/path/${item.id}/tasksScreen`)}
              statusLabel={statusLabels[item.status] ?? defaultStatusLabel(item.status)}
            />
          )}
          showsVerticalScrollIndicator={false}
          // Pins "My Path" so the categories scroll beneath it.
          stickyHeaderIndices={[0]}
        />
        {renderExploreButton("Explore More", true)}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Floats over the list rather than taking layout space beneath it; box-none on the
  // wrapper keeps the rows behind it tappable everywhere except the button itself.
  floatingExplore: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 10,
  },
});
