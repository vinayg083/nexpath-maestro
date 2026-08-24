import { registerDevice } from "@/lib/register-device";
import { ensureAnonymousSupabaseSession } from "@/lib/supabase/auth";

/**
 * Mirrors the user-specific work performed when the app first launches.
 * Calling this after account deletion provisions an entirely new anonymous user.
 */
export async function initializeAppSession() {
  await ensureAnonymousSupabaseSession();
  await registerDevice();
}
