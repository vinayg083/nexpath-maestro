import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";

type SaveUserInfoProfileInput = {
  areaId: string | null;
  birthMonth: number;
  birthYear: number;
  communityDurationId: string | null;
  stateCode: string;
};

export async function saveUserInfoProfile({
  areaId,
  birthMonth,
  birthYear,
  communityDurationId,
  stateCode,
}: SaveUserInfoProfileInput) {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      area_id: areaId,
      birth_month: birthMonth,
      birth_year: birthYear,
      community_duration_id: communityDurationId,
      onboarding_step: 1,
      state_code: stateCode,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
}

function getLocalTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    return null;
  }
}

export async function updateProfileTimezone(timezone = getLocalTimezone()) {
  if (!timezone) {
    return;
  }

  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      timezone,
    })
    .eq("id", user.id);

  if (error) {
    throw error;
  }
}

export async function completeOnboarding() {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const response = await supabase.rpc("complete_onboarding");
  if (response.error) {
    throw response.error;
  }

  return response.data;
}

/** True when the signed-in user has a non-null profiles.onboarding_completed_at. */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.onboarding_completed_at != null;
}
