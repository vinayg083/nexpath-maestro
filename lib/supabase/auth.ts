import type { User } from "@supabase/supabase-js";

import { supabase } from "./client";

let anonymousSessionPromise: Promise<User | null> | null = null;

const ensureProfile = async (user: User | null) => {
  if (!user?.id) {
    return;
  }

  // Prefer select-then-insert. A plain upsert still evaluates INSERT RLS even when
  // the row already exists (e.g. created by an auth.users trigger), which fails
  // when clients only have SELECT/UPDATE policies on profiles.
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (existing) {
    return;
  }

  const { error: insertError } = await supabase
    .from("profiles")
    .insert({ id: user.id });

  if (insertError) {
    throw insertError;
  }
};

export const ensureAnonymousSupabaseSession = async () => {
  if (anonymousSessionPromise) {
    return anonymousSessionPromise;
  }

  anonymousSessionPromise = (async () => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      const { error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        throw signInError;
      }
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    await ensureProfile(user);

    return user;
  })();

  try {
    return await anonymousSessionPromise;
  } finally {
    anonymousSessionPromise = null;
  }
};
