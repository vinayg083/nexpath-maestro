import * as React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type OnboardingFrameProps = {
  actionAlign?: "center" | "end";
  actionDisabled?: boolean;
  actionLabel: string;
  children?: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
  dismissKeyboardOnTap?: boolean;
  errorMessage?: string;
  footerClassName?: string;
  footerMessage?: string;
  keyboardAware?: boolean;
  onAction: () => void;
  stepLabel?: string;
  subtitle?: string;
  subtitleClassName?: string;
  title: string;
  titleClassName?: string;
};

export function OnboardingFrame({
  actionAlign = "end",
  actionDisabled = false,
  actionLabel,
  children,
  containerClassName,
  contentClassName,
  dismissKeyboardOnTap = false,
  errorMessage,
  footerClassName,
  footerMessage,
  keyboardAware = false,
  onAction,
  stepLabel,
  subtitle,
  subtitleClassName,
  title,
  titleClassName,
}: OnboardingFrameProps) {
  const frameContent = (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom", "left", "right"]}>
      <View
        className={cn("w-full flex-1 pt-8", containerClassName)}
        style={{ paddingHorizontal: 40 }}
      >
        <View className="items-center">
          <Text
            className={cn(
              "text-center text-[26px] font-bold leading-9 text-foreground",
              titleClassName,
            )}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              className={cn(
                "mt-5 w-full text-center text-base leading-6 text-foreground",
                subtitleClassName,
              )}
            >
              {subtitle}
            </Text>
          ) : null}
          {errorMessage ? (
            <Text className="mt-3 w-full text-center text-sm leading-5 text-destructive">
              {errorMessage}
            </Text>
          ) : null}
        </View>

        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          className="flex-1"
          contentContainerClassName={cn("pb-12", contentClassName)}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View
          className={cn(
            "pb-4 pt-6",
            actionAlign === "center" ? "items-center" : "items-end",
            footerClassName,
          )}
        >
          <Button
            className="min-w-32 items-center justify-center rounded-md px-5 py-5"
            disabled={actionDisabled}
            onPress={onAction}
            size="default"
          >
            <Text
              className="text-center font-medium text-primary-foreground"
              style={{
                fontSize: 18,
                includeFontPadding: false,
                lineHeight: 22,
                textAlign: "center",
                textAlignVertical: "center",
              }}
            >
              {actionLabel}
            </Text>
          </Button>
          {stepLabel ? (
            <Text className="mt-2 text-center text-base leading-6 text-muted-foreground">
              {stepLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );

  const keyboardAdjustedContent = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      keyboardVerticalOffset={0}
    >
      {frameContent}
    </KeyboardAvoidingView>
  ) : (
    frameContent
  );

  if (!dismissKeyboardOnTap) {
    return keyboardAdjustedContent;
  }

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      {keyboardAdjustedContent}
    </TouchableWithoutFeedback>
  );
}
