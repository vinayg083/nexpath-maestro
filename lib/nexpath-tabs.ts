import type { IconName } from "@/lib/icons/LucideIcon";

export type NexPathTabKey = "myPathScreen" | "resources" | "calendar" | "more";

export type NexPathTab = {
  key: NexPathTabKey;
  title: string;
  subtitle: string;
  icon: IconName;
  eyebrow: string;
};

export const NEXPATH_TABS: Record<NexPathTabKey, NexPathTab> = {
  myPathScreen: {
    key: "myPathScreen",
    title: "MyPath",
    subtitle: "Your personal roadmap will live here, organized into simple next steps.",
    icon: "Route",
    eyebrow: "Start here",
  },
  resources: {
    key: "resources",
    title: "Resources",
    subtitle: "Helpful guides, saved links, and recommended materials will be collected here.",
    icon: "BookOpen",
    eyebrow: "Reference",
  },
  calendar: {
    key: "calendar",
    title: "Calendar",
    subtitle: "Upcoming tasks, appointments, and planning moments will appear in one view.",
    icon: "CalendarDays",
    eyebrow: "Schedule",
  },
  more: {
    key: "more",
    title: "More",
    subtitle: "Account settings, preferences, and supporting app tools will be grouped here.",
    icon: "CircleEllipsis",
    eyebrow: "Settings",
  },
};
