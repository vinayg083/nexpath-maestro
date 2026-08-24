import { supabase } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/types";

export type AnalyticsTargetType = "category" | "resource" | "directory" | "task";

export type AnalyticsProperties = {
  screen?: string;
  target_type?: AnalyticsTargetType;
  target_id?: string;
  [key: string]: Json | undefined;
};

/** A screen became focused / visible. */
export async function trackScreen(screen: string) {
  return insertEvent("screen_viewed", { screen });
}

/**
 * A named action happened.
 * @param name value from a *_EVENTS constant — never a raw string
 * @param properties screen?, target_type?, target_id?
 */
export async function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  return insertEvent(name, properties);
}

async function insertEvent(event_name: string, properties: AnalyticsProperties) {
  const { error } = await supabase.from("analytics_events").insert({
    event_name,
    properties: properties as Json,
  });

  // Analytics must never break a user flow — log and move on.
  if (error) {
    console.warn("analytics", event_name, error.message);
  }
}
