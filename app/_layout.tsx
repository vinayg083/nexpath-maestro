import "@/global.css";

import { usePathname } from "expo-router";
import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import * as React from "react";
import { Platform, View } from "react-native";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { PortalHost } from "@rn-primitives/portal";
import { WebPortalContext } from "@/components/WebPortalContext";
import { initializeAppSession } from "@/lib/app-session";
import { ENTRY_RESOLUTION_TIMEOUT_MS, hideSplash } from "@/lib/splash";
import { colors, typography } from "@/lib/design-tokens";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

function RootContent() {
  const hasMounted = React.useRef(false);
  const [portalContainer, setPortalContainer] = React.useState<View | null>(null);
  const [isRootReady, setIsRootReady] = React.useState(false);
  const pathname = usePathname();

  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  const isLoadingFonts = !fontsLoaded && !fontError;

  React.useEffect(() => {
    if (hasMounted.current) {
      return;
    }

    if (Platform.OS === "web" && typeof document !== "undefined") {
      // eslint-disable-next-line no-undef
      document.documentElement.style.backgroundColor = colors.background;
      // eslint-disable-next-line no-undef
      document.body.style.backgroundColor = colors.background;
    }
    setIsRootReady(true);
    hasMounted.current = true;
  }, []);

  // The splash is the app's loading screen: it stays up until a real screen is on
  // display, so no blank frame is ever visible and the design lives in exactly one
  // place (app.config.js). "/" is the entry route still deciding where to send the
  // user — every other path means actual UI has mounted.
  React.useEffect(() => {
    if (isLoadingFonts) {
      return;
    }

    if (pathname !== "/") {
      hideSplash();
      return;
    }

    const timeout = setTimeout(hideSplash, ENTRY_RESOLUTION_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [isLoadingFonts, pathname]);

  React.useEffect(() => {
    let isMounted = true;

    // Don't block the UI — user session and device registration run in the background.
    initializeAppSession()
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        // eslint-disable-next-line no-console
        console.warn("Unable to initialize app session", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isRootReady || isLoadingFonts) {
    return null;
  }

  return (
    <WebPortalContext.Provider
      value={{ container: portalContainer as unknown as HTMLElement | null }}
    >
      <StatusBar backgroundColor={colors.background} style="dark" />
      <Stack
        screenOptions={() => ({
          contentStyle: {
            backgroundColor: colors.background,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleAlign: "center",
          headerTitleStyle: {
            fontFamily: typography.h1.fontFamily,
          },
        })}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="welcome"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/onboardingStep1"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/onboardingStep2"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/onboardingStep3"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="explore"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="path"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="resource"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      {
        // View used as a portal container on web
        <View
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
          }}
          ref={setPortalContainer}
        />
      }
      {
        // PortalHost used as a portal container on native
        <PortalHost />
      }
    </WebPortalContext.Provider>
  );
}

export default function RootLayout() {
  return <RootContent />;
}
