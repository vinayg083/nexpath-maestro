import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SCREENS, trackEvent, useScreenView, WELCOME_EVENTS } from "@/lib/analytics";

export default function WelcomeScreen() {
  useScreenView(SCREENS.WELCOME);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom", "left", "right"]}>
      <View className="mx-auto w-full max-w-sm flex-1 px-8 pb-10 pt-8">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-[28px] font-bold leading-9 text-foreground">
            Reentry Roadmap
          </Text>

          <Button
            className="mt-20 py-5 w-32 items-center justify-center rounded-md"
            onPress={() => {
              trackEvent(WELCOME_EVENTS.LETS_GO_TAPPED, { screen: SCREENS.WELCOME });
              router.push("/onboarding/onboardingStep1");
            }}
            size="default"
          >
            <Text
              className="w-full text-center font-medium text-primary-foreground"
              style={{
                fontSize: 18,
                includeFontPadding: false,
                lineHeight: 22,
                textAlign: "center",
              }}
            >
              Let's Go!
            </Text>
          </Button>

          <Text className="mx-auto mt-24 max-w-[310px] text-center text-xl leading-8 text-foreground">
            "Explain what the app is, who it is for, and anything else up front that we want to
            tell them."
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
