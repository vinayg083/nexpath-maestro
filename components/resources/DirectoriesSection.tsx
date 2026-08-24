import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { RESOURCES_EVENTS, SCREENS, trackEvent } from "@/lib/analytics";
import { openResource } from "@/lib/open-resource";
import type { DirectoryItem } from "@/lib/supabase";

type DirectoriesSectionProps = {
  directories: DirectoryItem[];
};

export function DirectoriesSection({ directories }: DirectoriesSectionProps) {
  return (
    <View className="py-4">
      <Text className="mb-3 text-lg font-bold text-primary">Local directories</Text>

      <View className="gap-3">
        {directories.map((directory) => (
          <Pressable
            accessibilityLabel={`Open ${directory.name}`}
            accessibilityRole="link"
            className="rounded-md border border-border bg-background px-4 py-3 active:opacity-70"
            key={directory.id}
            onPress={() => {
              trackEvent(RESOURCES_EVENTS.RESOURCE_OPENED, {
                screen: SCREENS.RESOURCES,
                target_type: "directory",
                target_id: directory.id,
              });

              void openResource({
                body: null,
                phone: null,
                title: directory.name,
                type: "website",
                url: directory.external_url,
              });
            }}
          >
            <Text className="text-base font-semibold leading-6 text-foreground">
              {directory.name}
            </Text>
            {directory.description ? (
              <Text className="mt-1 text-sm leading-5 text-muted-foreground">
                {directory.description}
              </Text>
            ) : null}
            <Text className="mt-2 text-sm leading-5 text-primary underline">Open directory</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
