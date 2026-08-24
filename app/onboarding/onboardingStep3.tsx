import * as React from "react";
import { CommonActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { Text } from "@/components/ui/text";
import { IMMEDIATE_HELP_EVENTS, SCREENS, trackEvent, useScreenView } from "@/lib/analytics";
import { completeOnboarding } from "@/lib/supabase";

export default function OnboardingStep3() {
  const navigation = useNavigation();

  useScreenView(SCREENS.IMMEDIATE_HELP);

  const [isCompleting, setIsCompleting] = React.useState(false);
  const [completeError, setCompleteError] = React.useState("");

  async function handleFinish() {
    if (isCompleting) {
      return;
    }

    setIsCompleting(true);
    setCompleteError("");

    try {
      await completeOnboarding();
      void trackEvent(IMMEDIATE_HELP_EVENTS.ONBOARDING_FINISHED, {
        screen: SCREENS.IMMEDIATE_HELP,
      });

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: "(tabs)",
              params: {
                screen: "myPathScreen",
              },
            },
          ],
        })
      );
    } catch {
      setCompleteError("We couldn't finish onboarding. Please try again.");
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <OnboardingFrame
      actionDisabled={isCompleting}
      actionLabel={isCompleting ? "Finishing" : "Finish"}
      contentClassName="pt-4"
      footerClassName="mb-2"
      onAction={handleFinish}
      subtitle="If you need immediate help finding food, housing, health, or other emergency assistance, local support resources can help."
      subtitleClassName="mt-[50px] text-lg leading-7"
      title="Need immediate help?"
    >
      {completeError ? (
        <Text className="mt-6 text-center text-sm leading-5 text-destructive">{completeError}</Text>
      ) : null}
    </OnboardingFrame>
  );
}
