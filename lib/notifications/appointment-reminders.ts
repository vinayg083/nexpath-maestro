import { Platform } from "react-native";

/**
 * Local (on-device) appointment reminders built on expo-notifications.
 *
 * There is no remote push involved here: when an appointment is saved with a
 * reminder, we schedule a single OS-level local notification that fires a chosen
 * duration *before* the appointment. The scheduled notification survives app
 * restarts, so we never re-schedule on load — we only cancel it when the
 * appointment is deleted (or edited) using the appointment id as the
 * notification identifier.
 */

type NotificationsModule = typeof import("expo-notifications");

const ANDROID_CHANNEL_ID = "appointment-reminders";

// expo-notifications is a native module; a fresh native binary may predate this
// install, so we lazy-require it and degrade gracefully when it is unavailable.
let notificationsModule: NotificationsModule | null | undefined;
let handlerConfigured = false;
let androidChannelReady = false;
let permissionGranted: boolean | null = null;

const MS_PER_MINUTE = 60_000;

/** The reminder_durations.unit enum (see the DB reminder_duration_unit type). */
export type ReminderUnit = "minute" | "hour" | "day" | "week" | "month" | "year";

const REMINDER_UNITS: readonly ReminderUnit[] = [
  "minute",
  "hour",
  "day",
  "week",
  "month",
  "year",
];

// Fixed-length units are exact millisecond offsets. month/year are deliberately
// absent: their length varies, so they're handled on the calendar instead.
const FIXED_UNIT_MS: Record<"minute" | "hour" | "day" | "week", number> = {
  minute: MS_PER_MINUTE,
  hour: 60 * MS_PER_MINUTE,
  day: 24 * 60 * MS_PER_MINUTE,
  week: 7 * 24 * 60 * MS_PER_MINUTE,
};

/** Narrows a raw DB string to a ReminderUnit; unknown values are rejected. */
export function isReminderUnit(value: string): value is ReminderUnit {
  return (REMINDER_UNITS as readonly string[]).includes(value);
}

/**
 * Subtracts a whole number of calendar months (years = amount × 12) from a date,
 * clamping the day so overflow can't leak into the next month. JS's own
 * `setMonth` rolls Mar 31 − 1 month forward to Mar 3; we clamp it back to the
 * last valid day (Feb 28/29). Time-of-day is preserved untouched.
 */
function subtractCalendar(date: Date, amount: number, unit: "month" | "year"): Date {
  const months = unit === "year" ? amount * 12 : amount;
  const result = new Date(date.getTime());
  const targetDay = result.getDate();

  // Move to the 1st before shifting the month so the day can't overflow.
  result.setDate(1);
  result.setMonth(result.getMonth() - months);

  // Clamp the original day to the target month's last day.
  const lastDayOfTargetMonth = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(targetDay, lastDayOfTargetMonth));

  return result;
}

/**
 * Computes the moment a reminder should fire: `amount` × `unit` before
 * `startsAt`. Fixed units (minute/hour/day/week) subtract an exact millisecond
 * offset; calendar units (month/year) subtract on the date itself so lead times
 * track real months rather than a fixed 30-day approximation.
 */
export function computeReminderFireDate(
  startsAt: Date,
  amount: number,
  unit: ReminderUnit,
): Date {
  if (unit === "month" || unit === "year") {
    return subtractCalendar(startsAt, amount, unit);
  }

  return new Date(startsAt.getTime() - amount * FIXED_UNIT_MS[unit]);
}

function loadNotifications(): NotificationsModule | null {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    notificationsModule = require("expo-notifications") as NotificationsModule;
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    console.warn("expo-notifications unavailable", error);
    notificationsModule = null;
  }

  return notificationsModule;
}

function configureHandler(Notifications: NotificationsModule) {
  if (handlerConfigured) {
    return;
  }

  // Present the reminder even when the app is foregrounded.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  handlerConfigured = true;
}

async function ensureAndroidChannel(Notifications: NotificationsModule) {
  if (Platform.OS !== "android" || androidChannelReady) {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Appointment reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
  });

  androidChannelReady = true;
}

async function ensurePermissions(Notifications: NotificationsModule): Promise<boolean> {
  if (permissionGranted === true) {
    return true;
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted && existing.canAskAgain) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }

  permissionGranted = granted;
  return granted;
}

// Notification copy is built from the structured amount + unit, not the display
// label — so retitling an option ("An hour before") never garbles the body.
function buildReminderBody(title: string, amount: number, unit: ReminderUnit): string {
  const leadTime = `${amount} ${unit}${amount === 1 ? "" : "s"}`;
  return `${title} is coming up in ${leadTime}.`;
}

export type ScheduleAppointmentReminderInput = {
  id: string;
  title: string;
  /** Appointment start time as an ISO string. */
  startsAt: string;
  /** reminder_durations.amount, e.g. 1, 30. */
  reminderAmount: number;
  /** reminder_durations.unit, e.g. "hour" (validated against the enum). */
  reminderUnit: string;
};

/**
 * Schedules a local notification for an appointment. Uses the appointment id as
 * the notification identifier so it can be cancelled later. Returns true when a
 * notification was actually scheduled (false on web, when the reminder time is
 * already in the past, when permission is denied, or when the native module is
 * unavailable).
 */
export async function scheduleAppointmentReminder(
  input: ScheduleAppointmentReminderInput,
): Promise<boolean> {
  // Local scheduling is unreliable on web; keep reminders native-only.
  if (Platform.OS === "web") {
    return false;
  }

  const Notifications = loadNotifications();

  if (!Notifications) {
    return false;
  }

  const startsAt = new Date(input.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return false;
  }

  // Defensive: bad amount/unit should skip scheduling rather than fire at the
  // appointment time. The enum + NOT NULL columns make this near-impossible, but
  // the data still crosses the network as loosely-typed JSON. Narrow on a local
  // const so `unit` stays typed as ReminderUnit through the rest of the function.
  const { reminderAmount, reminderUnit } = input;

  if (!isReminderUnit(reminderUnit) || !Number.isFinite(reminderAmount) || reminderAmount <= 0) {
    // eslint-disable-next-line no-console
    console.warn(`Skipping reminder: invalid duration ${reminderAmount} ${reminderUnit}.`);
    return false;
  }

  const fireDate = computeReminderFireDate(startsAt, reminderAmount, reminderUnit);

  // The reminder moment has already passed — nothing worth scheduling.
  if (fireDate.getTime() <= Date.now()) {
    return false;
  }

  configureHandler(Notifications);

  const granted = await ensurePermissions(Notifications);

  if (!granted) {
    return false;
  }

  await ensureAndroidChannel(Notifications);

  // Clear any stale reminder for this appointment before (re)scheduling.
  await Notifications.cancelScheduledNotificationAsync(input.id).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: input.id,
    content: {
      title: "Upcoming appointment",
      body: buildReminderBody(input.title, reminderAmount, reminderUnit),
      sound: "default",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
    },
  });

  return true;
}

/**
 * Cancels the local reminder for an appointment. Safe to call for appointments
 * that never had a reminder — cancelling an unknown identifier is a no-op.
 */
export async function cancelAppointmentReminder(id: string): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const Notifications = loadNotifications();

  if (!Notifications) {
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

/**
 * Cancels every scheduled local reminder on this device. Used when the user
 * deletes their account or otherwise signs out, so no reminder can fire for
 * appointments that no longer belong to anyone on this device.
 */
export async function cancelAllAppointmentReminders(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const Notifications = loadNotifications();

  if (!Notifications) {
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}
