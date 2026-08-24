import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LucideIcon from "@/lib/icons/LucideIcon";
import { NEXPATH_TABS, type NexPathTabKey } from "@/lib/nexpath-tabs";
import { colors, typography } from "@/lib/design-tokens";

const TAB_ORDER: NexPathTabKey[] = ["myPathScreen", "resources", "calendar", "more"];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tabs
      initialRouteName="myPathScreen"
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelPosition: "below-icon",
        tabBarShowLabel: false,
        tabBarIconStyle: {
          height: 50,
          width: "100%",
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 66 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          ...(Platform.OS === "web"
            ? { boxShadow: "0 -10px 24px rgba(41, 56, 69, 0.08)" }
            : {
                shadowColor: "#293845",
                shadowOffset: { width: 0, height: -8 },
                shadowOpacity: Platform.OS === "ios" ? 0.06 : 0.1,
                shadowRadius: 18,
                elevation: 10,
              }),
        },
        tabBarItemStyle: {
          borderRadius: 16,
          flexDirection: "column",
          height: 56,
          justifyContent: "center",
          paddingBottom: 4,
          paddingTop: 5,
        },
      }}
    >
      {TAB_ORDER.map((key) => {
        const tab = NEXPATH_TABS[key];

        return (
          <Tabs.Screen
            key={tab.key}
            name={tab.key}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, focused }) => {
                const labelStyle = [
                  styles.tabLabel,
                  {
                    color,
                    fontFamily: focused
                      ? typography.h6.fontFamily
                      : typography.caption.fontFamily,
                  },
                ];

                return (
                  <View style={styles.tabIconContent}>
                    <LucideIcon
                      name={tab.icon}
                      color={color}
                      size={focused ? 23 : 22}
                      strokeWidth={focused ? 2.5 : 2}
                    />
                    <Text numberOfLines={1} style={labelStyle}>
                      {tab.title}
                    </Text>
                    <View
                      style={[
                        styles.tabIndicator,
                        { backgroundColor: focused ? colors.primary : "transparent" },
                      ]}
                    />
                  </View>
                );
              },
            }}
          />
        );
      })}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContent: {
    alignItems: "center",
    gap: 4,
    height: 50,
    justifyContent: "center",
    width: "100%",
  },
  tabLabel: {
    fontSize: 14,
    lineHeight: 16,
  },
  tabIndicator: {
    borderRadius: 999,
    height: 2,
    marginTop: 2,
    width: 40,
  },
});
