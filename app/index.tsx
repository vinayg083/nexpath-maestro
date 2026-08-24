import { Redirect } from "expo-router";
import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import { colors } from "@/lib/design-tokens";
import { ENTRY_RESOLUTION_TIMEOUT_MS } from "@/lib/splash";
import { hasCompletedOnboarding } from "@/lib/supabase";

type EntryHref = "/(tabs)/myPathScreen" | "/welcome";

export default function IndexScreen() {
  const [href, setHref] = React.useState<EntryHref | null>(null);
  const [hasOutlivedSplash, setHasOutlivedSplash] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    hasCompletedOnboarding()
      .then((completed) => {
        if (!isMounted) {
          return;
        }

        setHref(completed ? "/(tabs)/myPathScreen" : "/welcome");
      })
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.warn("Unable to resolve entry route from onboarding status", error);

        if (!isMounted) {
          return;
        }

        setHref("/welcome");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    const timeout = setTimeout(() => setHasOutlivedSplash(true), ENTRY_RESOLUTION_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, []);

  if (!href) {
    // Nothing to draw — the splash is still covering this screen while the entry
    // route resolves. Only if resolution outlives the splash backstop does this need
    // to show anything, and then a spinner beats a bare white screen.
    return hasOutlivedSplash ? (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    ) : null;
  }

  return <Redirect href={href} />;
}
