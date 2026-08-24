export const ABOUT_YOU_EVENTS = {
  CONTINUED: "about_you_continued",
} as const;

export const CALENDAR_EVENTS = {
  REMINDER_SET: "reminder_set",
} as const;

export const EXPLORE_EVENTS = {
  CATEGORY_ADDED_TO_PATH: "category_added_to_path",
  TASK_ADDED_FROM_EXPLORE: "task_added_from_explore",
} as const;

export const IMMEDIATE_HELP_EVENTS = {
  HELPLINE_CALLED: "helpline_called",
  ONBOARDING_FINISHED: "onboarding_finished",
} as const;

export const MY_PATH_EVENTS = {
  TASK_OPENED: "task_opened",
  TASK_COMPLETED: "task_completed",
  TASK_RESOURCE_VIEWED: "task_resource_viewed",
} as const;

export const PRIORITIES_EVENTS = {
  PRIORITY_SELECTED: "priority_selected",
  PRIORITY_DESELECTED: "priority_deselected",
} as const;

export const RESOURCES_EVENTS = {
  RESOURCE_OPENED: "resource_opened",
  RESOURCE_SAVED: "resource_saved",
  DIRECTORY_OPENED: "directory_opened",
} as const;

export const WELCOME_EVENTS = {
  LETS_GO_TAPPED: "lets_go_tapped",
} as const;
