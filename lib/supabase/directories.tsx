import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";
import type { Database } from "./types";

export type DirectoryItem = Pick<
  Database["public"]["Tables"]["directories"]["Row"],
  "area_id" | "description" | "external_url" | "id" | "name" | "state_code"
>;

/**
 * Location-scoped directories for the signed-in user's onboarding state/area.
 * Statewide rows (area_id null) always match; area rows only when area_id matches.
 */
export async function getDirectoriesForProfile(): Promise<DirectoryItem[]> {
  await ensureAnonymousSupabaseSession();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("state_code, area_id")
    .single();

  if (profileError) {
    throw profileError;
  }

  if (!profile?.state_code) {
    return [];
  }

  let query = supabase
    .from("directories")
    .select("id, name, description, external_url, state_code, area_id")
    .eq("state_code", profile.state_code)
    .order("name");

  if (profile.area_id) {
    query = query.or(`area_id.is.null,area_id.eq.${profile.area_id}`);
  } else {
    query = query.is("area_id", null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}
