import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import LucideIcon from "@/lib/icons/LucideIcon";
import { PATH_PROGRESS_GREEN } from "@/lib/path-ui";
import type { PathTaskItem } from "@/lib/supabase";

type PathTaskRowProps = {
  task: PathTaskItem;
  onPress: () => void;
};

export function PathTaskRow({ task, onPress }: PathTaskRowProps) {
  return (
    <View className="px-5 py-2">
      <Pressable
        accessibilityRole="button"
        className="min-h-[52px] flex-row items-center gap-3 rounded-full border-2 border-[#788896] bg-background px-5 py-3.5"
        onPress={onPress}
      >
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] leading-5 text-foreground">{task.title}</Text>
          {task.subtext ? (
            <Text
              className="mt-1 text-sm italic leading-5 text-muted-foreground"
              ellipsizeMode="tail"
              numberOfLines={2}
            >
              {task.subtext}
            </Text>
          ) : null}
        </View>

        {task.isCompleted ? (
          <View
            className="h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[#5BBF73] bg-transparent"
            pointerEvents="none"
          >
            <LucideIcon color={PATH_PROGRESS_GREEN} name="Check" size={15} strokeWidth={2.75} />
          </View>
        ) : (
          <View className="shrink-0" pointerEvents="none">
            <LucideIcon color="#788896" name="CircleCheck" size={28} strokeWidth={2.25} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
