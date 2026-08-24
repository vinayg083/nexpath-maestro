import * as React from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccessibleSelect } from "@/components/ui/accessible-select";
import { Label } from "@/components/ui/label";
import { type Option } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { BirthMonthYearFields } from "@/components/onboarding/BirthMonthYearFields";
import { OnboardingFrame } from "@/components/onboarding/OnboardingFrame";
import { ABOUT_YOU_EVENTS, SCREENS, trackEvent, useScreenView } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import {
  getAreas,
  getCommunityDurations,
  getStates,
  saveUserInfoProfile,
  type AreaOption,
  type CommunityDurationOption,
  type StateOption,
} from "@/lib/supabase";
import { cn } from "@/lib/utils";

type SelectOption = {
  label: string;
  value: string;
};

let cachedStates: StateOption[] | null = null;
let cachedCommunityDurations: CommunityDurationOption[] | null = null;
const cachedAreasByState: Record<string, AreaOption[]> = {};

type SelectFieldProps = {
  className?: string;
  containerClassName?: string;
  disabled?: boolean;
  label?: string;
  onValueChange: (option: Option) => void;
  options: SelectOption[];
  placeholder: string;
  value?: Option;
  // Stacking order so an open list draws above the fields below it (top field = highest).
  zIndex?: number;
  zIndexInverse?: number;
};

function SelectField({
  className,
  containerClassName,
  disabled,
  label,
  onValueChange,
  options,
  placeholder,
  value,
  zIndex,
  zIndexInverse,
}: SelectFieldProps) {
  return (
    <View className={cn(containerClassName, className)} style={zIndex != null ? { zIndex } : undefined}>
      {label ? (
        <Label className="mb-3 text-base font-semibold leading-6">{label}</Label>
      ) : null}
      <AccessibleSelect
        disabled={disabled}
        onValueChange={(option) => onValueChange({ label: option.label, value: option.value })}
        options={options}
        placeholder={placeholder}
        value={value?.value ? { label: value.label ?? placeholder, value: value.value } : undefined}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
      />
    </View>
  );
}

export default function OnboardingStep1() {
  useScreenView(SCREENS.ABOUT_YOU);

  const [birthMonth, setBirthMonth] = React.useState<number>();
  const [birthYear, setBirthYear] = React.useState<number>();
  const [birthdateError, setBirthdateError] = React.useState("");
  const [states, setStates] = React.useState<StateOption[]>(() => cachedStates ?? []);
  const [areas, setAreas] = React.useState<AreaOption[]>([]);
  const [communityDurations, setCommunityDurations] = React.useState<
    CommunityDurationOption[]
  >(() => cachedCommunityDurations ?? []);
  const [state, setState] = React.useState<Option>();
  const [selectedStateCode, setSelectedStateCode] = React.useState<string | null>(null);
  const [area, setArea] = React.useState<Option>();
  const [communityLength, setCommunityLength] = React.useState<Option>();
  const [isInitialLoading, setIsInitialLoading] = React.useState(
    () => cachedStates === null || cachedCommunityDurations === null
  );
  const [isFetchingAreas, setIsFetchingAreas] = React.useState(false);
  const [locationError, setLocationError] = React.useState("");
  const [locationValidationError, setLocationValidationError] = React.useState("");
  const [durationError, setDurationError] = React.useState("");
  const [communityValidationError, setCommunityValidationError] = React.useState("");
  const [profileSaveError, setProfileSaveError] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);

  const selectedState = React.useMemo(() => {
    if (!selectedStateCode) {
      return undefined;
    }

    return states.find((option) => option.value === selectedStateCode);
  }, [selectedStateCode, states]);
  const showAreaDropdown = selectedState?.has_local_areas === true;
  const backendError = [locationError, durationError, profileSaveError]
    .filter(Boolean)
    .join(" ");

  React.useEffect(() => {
    let isMounted = true;
    const hasCache = cachedStates !== null && cachedCommunityDurations !== null;

    async function loadInitialOptions() {
      if (!hasCache) {
        setIsInitialLoading(true);
      }

      setLocationError("");
      setDurationError("");

      try {
        const [nextStates, nextDurations] = await Promise.all([
          getStates(),
          getCommunityDurations(),
        ]);

        if (!isMounted) {
          return;
        }

        cachedStates = nextStates;
        cachedCommunityDurations = nextDurations;
        setStates(nextStates);
        setCommunityDurations(nextDurations);
      } catch {
        if (!isMounted) {
          return;
        }

        if (!hasCache) {
          setLocationError("We couldn't load options. Please try again in a moment.");
          setDurationError("");
        }
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    loadInitialOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    if (!selectedStateCode) {
      return;
    }

    if (!showAreaDropdown) {
      setArea(undefined);
      setAreas([]);
      setIsFetchingAreas(false);
      return;
    }

    const cachedAreas = cachedAreasByState[selectedStateCode];
    const hasCachedAreas = cachedAreas !== undefined;

    if (hasCachedAreas) {
      setAreas(cachedAreas);
    } else {
      setArea(undefined);
      setAreas([]);
    }

    async function loadAreas(stateCode: string) {
      if (!hasCachedAreas) {
        setIsFetchingAreas(true);
      }

      setLocationError("");

      try {
        const nextAreas = await getAreas(stateCode);

        if (!isMounted) {
          return;
        }

        cachedAreasByState[stateCode] = nextAreas;
        setAreas(nextAreas);
      } catch {
        if (!isMounted) {
          return;
        }

        if (!hasCachedAreas) {
          setAreas([]);
          setLocationError("We couldn't load areas for that state. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsFetchingAreas(false);
        }
      }
    }

    loadAreas(selectedStateCode);

    return () => {
      isMounted = false;
    };
  }, [selectedStateCode, showAreaDropdown]);

  function handleBirthdateChange(next: { month?: number; year?: number }) {
    setBirthMonth(next.month);
    setBirthYear(next.year);
    setBirthdateError("");
    setProfileSaveError("");
  }

  function handleStateChange(option: Option) {
    if (!option?.value) {
      return;
    }

    const nextState = states.find((entry) => entry.value === option.value);

    setSelectedStateCode(option.value);
    setState(option);
    // Always clear a previous area pick when the state changes. If the new
    // state has no local areas, also clear the options so the field hides.
    setArea(undefined);
    if (nextState?.has_local_areas !== true) {
      setAreas([]);
      setIsFetchingAreas(false);
    }
    setLocationValidationError("");
    setProfileSaveError("");
  }

  function handleAreaChange(option: Option) {
    setArea(option);
    setLocationValidationError("");
    setProfileSaveError("");
  }

  function handleCommunityLengthChange(option: Option) {
    setCommunityLength(option);
    setCommunityValidationError("");
    setProfileSaveError("");
  }

  async function handleNext() {
    if (isSavingProfile) {
      return;
    }

    setProfileSaveError("");
    setCommunityValidationError("");

    if (!birthMonth) {
      setBirthdateError("Select your birth month.");
      return;
    }

    if (!birthYear) {
      setBirthdateError("Select your birth year.");
      return;
    }

    if (!state?.value) {
      setLocationValidationError("Select the state where you will be living.");
      return;
    }

    if (showAreaDropdown && isFetchingAreas && areas.length === 0) {
      setLocationValidationError("Wait for areas to finish loading, then select one.");
      return;
    }

    if (showAreaDropdown && !area?.value) {
      setLocationValidationError("Select the area where you will be living.");
      return;
    }

    if (!communityLength?.value) {
      setCommunityValidationError("Select how long you've been in the community.");
      return;
    }

    setIsSavingProfile(true);

    try {
      await saveUserInfoProfile({
        areaId: showAreaDropdown ? area?.value ?? null : null,
        birthMonth,
        birthYear,
        communityDurationId: communityLength.value,
        stateCode: state.value,
      });

      trackEvent(ABOUT_YOU_EVENTS.CONTINUED, { screen: SCREENS.ABOUT_YOU });
      router.push("/onboarding/onboardingStep2");
    } catch {
      setProfileSaveError("We couldn't save your answers. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  if (isInitialLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <OnboardingFrame
      actionDisabled={isSavingProfile}
      actionLabel={isSavingProfile ? "Saving" : "Next"}
      // pb-56 gives the scroll view room so the last field's dropdown (community, opens
      // downward) can be scrolled fully into view instead of running off the screen bottom.
      contentClassName="pt-4 pb-56"
      onAction={handleNext}
      subtitle="We'll make sure to give you resources based on this information."
      subtitleClassName="mt-6 text-lg leading-7"
      title="Tell us about yourself"
    >
      <View className="mt-6 gap-4">
        <View>
          <Label className="mb-3 text-base font-semibold leading-6">When were you born</Label>
          <BirthMonthYearFields
            month={birthMonth}
            onChange={handleBirthdateChange}
            year={birthYear}
          />
          {birthdateError ? (
            <Text className="mt-2 text-sm leading-5 text-destructive">{birthdateError}</Text>
          ) : null}
        </View>

        <SelectField
          className="w-[70%]"
          disabled={states.length === 0}
          label="What state will you be living in?"
          onValueChange={handleStateChange}
          options={states}
          placeholder="Select a state"
          value={state}
          zIndex={3000}
          zIndexInverse={1000}
        />

        {showAreaDropdown ? (
          <SelectField
            className="w-[70%]"
            disabled={areas.length === 0}
            label="Will you be living in or near one of these areas?"
            onValueChange={handleAreaChange}
            options={areas}
            placeholder="Select an area"
            value={area}
            zIndex={2000}
            zIndexInverse={2000}
          />
        ) : null}

        {locationValidationError ? (
          <Text className="text-sm leading-5 text-destructive">
            {locationValidationError}
          </Text>
        ) : null}

        <SelectField
          disabled={communityDurations.length === 0}
          label="How long have you been in the community?"
          onValueChange={handleCommunityLengthChange}
          options={communityDurations}
          placeholder=""
          value={communityLength}
          zIndex={1000}
          zIndexInverse={3000}
        />
        {communityValidationError ? (
          <Text className="text-sm leading-5 text-destructive">
            {communityValidationError}
          </Text>
        ) : null}
        {backendError ? (
          <Text className="text-sm leading-5 text-destructive">{backendError}</Text>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}
