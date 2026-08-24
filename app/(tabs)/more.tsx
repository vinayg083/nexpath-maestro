import * as React from "react";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NexPathHeader } from "@/components/layout/NexPathHeader";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import LucideIcon from "@/lib/icons/LucideIcon";
import { deleteAccount } from "@/lib/supabase";

export default function MoreScreen() {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage("");

    try {
      await deleteAccount();
      setConfirmOpen(false);
      router.dismissAll();
      router.replace("/welcome");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("delete-account error", error);
      setErrorMessage("We couldn't delete your account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader />
      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="mt-5 border-b border-border">
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center justify-between px-6 py-4 active:opacity-80"
            disabled={isDeleting}
            onPress={() => {
              setErrorMessage("");
              setConfirmOpen(true);
            }}
          >
            <Text className="text-h6 leading-5 text-destructive">Delete account</Text>
            <LucideIcon
              color={colors.mutedForeground}
              name="ChevronRight"
              size={22}
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </SafeAreaView>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (isDeleting) {
            return;
          }

          setConfirmOpen(open);

          if (!open) {
            setErrorMessage("");
          }
        }}
      >
        <AlertDialogContent className="mx-[30px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6">
              Are you sure you want to delete your account? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {errorMessage ? (
            <Text className="text-base leading-6 text-destructive">{errorMessage}</Text>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <Button
              disabled={isDeleting}
              onPress={() => void handleConfirmDelete()}
              variant="destructive"
            >
              <Text>{isDeleting ? "Deleting…" : "Delete"}</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
