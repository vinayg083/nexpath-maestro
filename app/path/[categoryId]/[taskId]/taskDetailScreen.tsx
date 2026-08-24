import * as React from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
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
import { MY_PATH_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import { colors } from "@/lib/design-tokens";
import { cacheTask, getCachedCategory, getCachedTask } from "@/lib/path-cache";
import {
  getExploreCategory,
  getPathTask,
  setPathTaskCompleted,
  type ExploreCategory,
  type PathTaskItem,
} from "@/lib/supabase";

export default function TaskDetailScreen() {
  const { categoryId, taskId } = useLocalSearchParams<{ categoryId: string; taskId: string }>();
  const id = typeof taskId === "string" ? taskId : "";
  const parentCategoryId = typeof categoryId === "string" ? categoryId : "";
  // Opened from the task list, both of these are already loaded — render them at once
  // and refresh in the background rather than blocking on a spinner every visit.
  const [category, setCategory] = React.useState<ExploreCategory | null>(() =>
    getCachedCategory(parentCategoryId),
  );
  const [task, setTask] = React.useState<PathTaskItem | null>(() => getCachedTask(id));
  const [isLoading, setIsLoading] = React.useState(() => !getCachedTask(id));
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [showIncompleteWarning, setShowIncompleteWarning] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!id) {
      setTask(null);
      setCategory(null);
      setIsLoading(false);
      return;
    }

    // Only show the spinner on a cold open (deep link / reload); a cached task
    // revalidates silently so the screen never flashes a loader.
    const hasCachedTask = getCachedTask(id) !== null;

    setIsLoading(!hasCachedTask);
    setErrorMessage("");

    try {
      const [nextTask, nextCategory] = await Promise.all([
        getPathTask(id),
        parentCategoryId ? getExploreCategory(parentCategoryId) : Promise.resolve(null),
      ]);

      setTask(nextTask);
      setCategory(nextCategory);

      if (nextTask) {
        cacheTask(nextTask);
      }
    } catch {
      if (!hasCachedTask) {
        setErrorMessage("We couldn't load this task. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, parentCategoryId]);

  useFocusEffect(
    React.useCallback(() => {
      void load();
    }, [load]),
  );

  async function updateTaskCompletion(nextCompleted: boolean) {
    if (!task || isSaving) {
      return false;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await setPathTaskCompleted(task.id, nextCompleted);
      const refreshedTask = await getPathTask(task.id);

      const nextTask = refreshedTask ?? {
        ...task,
        isCompleted: nextCompleted,
        completedAt: nextCompleted ? new Date().toISOString() : null,
      };

      setTask(nextTask);
      cacheTask(nextTask);

      if (nextCompleted) {
        void trackEvent(MY_PATH_EVENTS.TASK_COMPLETED, {
          category_id: parentCategoryId,
          category_name: category?.name,
          screen: SCREENS.MY_PATH,
          target_type: "task",
          target_id: task.id,
          task_id: task.id,
          task_title: task.title,
        });
        router.back();
      }

      return true;
    } catch {
      setErrorMessage("We couldn't update that task. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  function handleCompletePress() {
    if (!task || isSaving) {
      return;
    }

    if (task.isCompleted) {
      setShowIncompleteWarning(true);
      return;
    }

    void updateTaskCompletion(true);
  }

  async function handleMarkIncompleteConfirm() {
    const didUpdate = await updateTaskCompletion(false);

    if (didUpdate) {
      setShowIncompleteWarning(false);
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader showBack />
        <SafeAreaView
          className="flex-1 items-center justify-center"
          edges={["left", "right", "bottom"]}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 bg-background">
        <NexPathHeader showBack />
        <SafeAreaView className="flex-1 px-5 pt-6" edges={["left", "right", "bottom"]}>
          <Text className="text-base text-foreground">
            {errorMessage || "This task could not be found."}
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const actionLabel = task.isCompleted ? "Completed" : task.incomplete_label || "Mark complete";
  const completedButtonClassName = task.isCompleted ? "border-destructive" : "";
  const actionButtonClassName =
    `min-w-[220px] items-center justify-center rounded-md px-8 py-6 ${completedButtonClassName} ${
      isSaving ? "opacity-60" : ""
    }`.trim();
  const actionTextClassName = `text-base font-medium ${
    task.isCompleted ? "text-destructive" : "text-destructive-foreground"
  }`;

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader showBack />
      <SafeAreaView className="flex-1" edges={["left", "right", "bottom"]}>
        {/* Fixed: the category and task title stay put while the body scrolls. */}
        <View className="px-5 pt-8">
          {category?.name ? (
            <Text className="text-base italic leading-6 text-muted-foreground">
              {category.name}
            </Text>
          ) : null}

          <Text className="mt-3 text-[26px] font-bold leading-8 text-foreground">{task.title}</Text>
        </View>

        {/* Only this body scrolls, and only when its content outgrows the space —
            bouncing is off so a short task can't be dragged around. */}
        <ScrollView
          alwaysBounceVertical={false}
          bounces={false}
          className="flex-1"
          contentContainerClassName="px-5 pb-6 pt-5"
          overScrollMode="never"
          showsVerticalScrollIndicator={false}
        >
          {task.description ? (
            <Text className="text-base leading-7 text-foreground">{task.description}</Text>
          ) : task.subtext ? (
            <Text className="text-base leading-7 text-foreground">{task.subtext}</Text>
          ) : null}

          <Pressable
            accessibilityRole="link"
            className="mt-10 items-center active:opacity-70"
            onPress={() => router.push(`/path/${parentCategoryId}/${id}/taskResourcesScreen`)}
          >
            <Text className="text-base italic text-primary underline">Let's Go!</Text>
          </Pressable>

          {errorMessage ? (
            <Text className="mt-6 text-center text-sm leading-5 text-destructive">
              {errorMessage}
            </Text>
          ) : null}

        </ScrollView>

        {/* Pinned: the action never scrolls out of reach. */}
        <View className="items-center px-5 pb-4 pt-4">
          <Button
            className={actionButtonClassName}
            disabled={isSaving}
            onPress={handleCompletePress}
            variant={task.isCompleted ? "outline" : "destructive"}
          >
            {isSaving ? (
              <ActivityIndicator
                color={task.isCompleted ? colors.destructive : colors.destructiveForeground}
                size="small"
                style={{ marginRight: 8 }}
              />
            ) : null}
            <Text className={actionTextClassName}>{isSaving ? "Saving" : actionLabel}</Text>
          </Button>
        </View>
      </SafeAreaView>
      <AlertDialog
        open={showIncompleteWarning}
        onOpenChange={(open) => {
          if (!isSaving) {
            setShowIncompleteWarning(open);
          }
        }}
      >
        <AlertDialogContent className="mx-[30px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark task incomplete?</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6">
              This will remove this task from your completed progress.
            </AlertDialogDescription>
            {errorMessage ? (
              <Text className="text-sm leading-5 text-destructive">{errorMessage}</Text>
            ) : null}
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              <Text>Keep completed</Text>
            </AlertDialogCancel>
            <Button
              className={isSaving ? "opacity-60" : undefined}
              disabled={isSaving}
              onPress={handleMarkIncompleteConfirm}
              variant="destructive"
            >
              {isSaving ? (
                <ActivityIndicator
                  color={colors.destructiveForeground}
                  size="small"
                  style={{ marginRight: 8 }}
                />
              ) : null}
              <Text>Mark incomplete</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
