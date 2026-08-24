import * as SplashScreen from "expo-splash-screen";

/**
 * How long the entry route may spend resolving before the splash is revealed anyway.
 * Resolving needs two network round-trips (anonymous sign-in, then the profile read),
 * so a stalled connection must not leave the app sitting on the splash forever.
 */
export const ENTRY_RESOLUTION_TIMEOUT_MS = 8000;

let isHidden = false;

/** Idempotent — the route watcher and the timeout backstop both call this. */
export function hideSplash() {
  if (isHidden) {
    return;
  }

  isHidden = true;
  void SplashScreen.hideAsync().catch(() => {
    // Already hidden (or never shown); nothing to do.
  });
}
