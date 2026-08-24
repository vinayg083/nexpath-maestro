import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";
import type { Database } from "./types";

export type OnboardingCategory = Pick<
  Database["public"]["Tables"]["goal_categories"]["Row"],
  "icon_key" | "id" | "subtitle" | "title"
>;

const MAX_ONBOARDING_PRIORITIES = 3;
const MAX_ONBOARDING_PRIORITIES_MESSAGE = "You can select at most 3 onboarding priorities";

export async function getOnboardingCategories() {
  const { data, error } = await supabase
    .from("goal_categories")
    .select("id, title, subtitle, icon_key")
    .order("title")
    .returns<OnboardingCategory[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getUserOnboardingPriorityIds() {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { data, error } = await supabase
    .from("user_path_categories")
    .select("goal_category_id")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.goal_category_id);
}

export async function addOnboardingPriority(goalCategoryId: string) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { error } = await supabase.from("user_path_categories").insert({
    user_id: user.id,
    goal_category_id: goalCategoryId,
  });

  if (error) {
    if (error.code === "23505") {
      return;
    }

    throw error;
  }
}

export async function removeOnboardingPriority(goalCategoryId: string) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { error } = await supabase
    .from("user_path_categories")
    .delete()
    .eq("user_id", user.id)
    .eq("goal_category_id", goalCategoryId);

  if (error) {
    throw error;
  }
}

export async function saveOnboardingPriorities(goalCategoryIds: string[]) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const uniqueIds = [...new Set(goalCategoryIds)];

  if (uniqueIds.length > MAX_ONBOARDING_PRIORITIES) {
    throw new Error(MAX_ONBOARDING_PRIORITIES_MESSAGE);
  }

  const { data, error: existingError } = await supabase
    .from("user_path_categories")
    .select("goal_category_id")
    .eq("user_id", user.id);

  if (existingError) {
    throw existingError;
  }

  const existingIds = (data ?? []).map((row) => row.goal_category_id);
  const existingSet = new Set(existingIds);
  const nextSet = new Set(uniqueIds);
  const toRemove = existingIds.filter((id) => !nextSet.has(id));
  const toAdd = uniqueIds.filter((id) => !existingSet.has(id));

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("user_path_categories")
      .delete()
      .eq("user_id", user.id)
      .in("goal_category_id", toRemove);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase.from("user_path_categories").insert(
      toAdd.map((goalCategoryId) => ({
        goal_category_id: goalCategoryId,
        user_id: user.id,
      })),
    );

    if (insertError) {
      if (insertError.code === "23505") {
        return;
      }

      throw insertError;
    }
  }
}
