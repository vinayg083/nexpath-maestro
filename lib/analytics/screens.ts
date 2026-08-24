export const SCREENS = {
  WELCOME: "welcome",
  ABOUT_YOU: "about_you",
  PRIORITIES: "priorities",
  IMMEDIATE_HELP: "immediate_help",
  MY_PATH: "my_path",
  EXPLORE: "explore",
  RESOURCES: "resources",
  RESOURCE_DETAIL: "resource_detail",
  CALENDAR: "calendar",
} as const;

export type ScreenId = (typeof SCREENS)[keyof typeof SCREENS];
