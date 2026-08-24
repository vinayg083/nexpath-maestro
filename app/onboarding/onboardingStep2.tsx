import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { OnboardingChoice } from "@/components/onboarding/OnboardingChoice";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { PRIORITIES_EVENTS, SCREENS, trackEvent, useScreenView } from "@/lib/analytics";
import { resolveCategoryIcon } from "@/lib/category-icon";
import { colors } from "@/lib/design-tokens";
import {
  getOnboardingCategories,
  getUserOnboardingPriorityIds,
  saveOnboardingPriorities,
  type OnboardingCategory,
} from "@/lib/supabase";

const MAX_PRIORITIES = 3;

export default function OnboardingStep2() {
  useScreenView(SCREENS.PRIORITIES);

  const [categories, setCategories] = React.useState<OnboardingCategory[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [selectionError, setSelectionError] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;

    async function loadCategoriesAndPriorities() {
      setIsLoading(true);
      setLoadError("");

      try {
        const [nextCategories, priorityIds] = await Promise.all([
          getOnboardingCategories(),
          getUserOnboardingPriorityIds(),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(nextCategories);
        setSelectedCategoryIds(priorityIds);
      } catch {
        if (!isMounted) {
          return;
        }

        setCategories([]);
        setSelectedCategoryIds([]);
        setLoadError("We couldn't load categories. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCategoriesAndPriorities();

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleCategory(categoryId: string) {
    if (isSaving) {
      return;
    }

    setSelectionError("");

    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds((current) => current.filter((id) => id !== categoryId));
      void trackEvent(PRIORITIES_EVENTS.PRIORITY_DESELECTED, {
        screen: SCREENS.PRIORITIES,
        target_type: "category",
        target_id: categoryId,
      });
      return;
    }

    if (selectedCategoryIds.length >= MAX_PRIORITIES) {
      setSelectionError("You can select at most 3 onboarding priorities");
      return;
    }

    setSelectedCategoryIds((current) => [...current, categoryId]);
    void trackEvent(PRIORITIES_EVENTS.PRIORITY_SELECTED, {
      screen: SCREENS.PRIORITIES,
      target_type: "category",
      target_id: categoryId,
    });
  }

  async function handleNext() {
    if (isSaving) {
      return;
    }

    if (selectedCategoryIds.length < 1) {
      setSelectionError("Select at least 1 area to continue.");
      return;
    }

    setSelectionError("");
    setIsSaving(true);

    try {
      await saveOnboardingPriorities(selectedCategoryIds);
      router.push("/onboarding/onboardingStep3");
    } catch (error) {
      setSelectionError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't save your selection. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <OnboardingFrame
      actionDisabled={isLoading || isSaving}
      actionLabel={isSaving ? "Saving" : "Next"}
      contentClassName="pt-4"
      errorMessage={loadError || selectionError || undefined}
      onAction={handleNext}
      stepLabel="Step 2 of 3"
      subtitle="It's OK to pick anything even if you are not sure if it applies to you. We'll help you figure that out later."
      subtitleClassName="text-lg leading-7"
      title="Get Started"
    >
      {isLoading ? (
        <View className="mt-6 items-center py-12">
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View className="mt-6 flex-row flex-wrap gap-4">
          {categories.map((category) => (
            <View className="basis-[47%]" key={category.id}>
              <OnboardingChoice
                icon={resolveCategoryIcon(category.icon_key)}
                label={category.title}
                onPress={() => {
                  toggleCategory(category.id);
                }}
                selected={selectedCategoryIds.includes(category.id)}
              />
            </View>
          ))}
        </View>
      )}
    </OnboardingFrame>
  );
}
