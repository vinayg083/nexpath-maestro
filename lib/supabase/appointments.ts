import { isReminderUnit, type ReminderUnit } from "../notifications/appointment-reminders";
import { ensureAnonymousSupabaseSession } from "./auth";
import { supabase } from "./client";

export type Appointment = {
  id: string;
  title: string;
  starts_at: string;
  /** FK to reminder_durations; null means no reminder is set. */
  reminder_duration_id: string | null;
  /** Embedded reminder_durations.label, e.g. "1 hour" — display only (null when no reminder). */
  reminder_label: string | null;
  /** Embedded reminder_durations.amount — the machine lead time (null when no reminder). */
  reminder_amount: number | null;
  /** Embedded reminder_durations.unit — the machine lead time (null when no reminder). */
  reminder_unit: ReminderUnit | null;
};

export type CreateAppointmentInput = {
  /** reminder_durations id, or null for no reminder. */
  reminderDurationId: string | null;
  startsAt: string;
  title: string;
};

// Shape of the appointments row with the reminder_durations embed. PostgREST
// returns the embed as a single object for a to-one FK, but keep the array case
// covered so type inference never breaks.
type ReminderDurationEmbed = { label: string; amount: number; unit: string };

type AppointmentRow = {
  id: string;
  title: string;
  starts_at: string;
  reminder_duration_id: string | null;
  reminder_durations: ReminderDurationEmbed | ReminderDurationEmbed[] | null;
};

const APPOINTMENT_SELECT =
  "id, title, starts_at, reminder_duration_id, reminder_durations ( label, amount, unit )";

function mapAppointment(row: AppointmentRow): Appointment {
  const embed = row.reminder_durations;
  // PostgREST returns a to-one FK embed as a single object, but keep the array
  // case covered so type inference never breaks.
  const reminder = Array.isArray(embed) ? (embed[0] ?? null) : embed;
  const unit = reminder != null && isReminderUnit(reminder.unit) ? reminder.unit : null;

  return {
    id: row.id,
    title: row.title,
    starts_at: row.starts_at,
    reminder_duration_id: row.reminder_duration_id,
    reminder_label: reminder?.label ?? null,
    reminder_amount: reminder?.amount ?? null,
    reminder_unit: unit,
  };
}

export type ReminderDurationOption = {
  value: string;
  label: string;
  amount: number;
  unit: string;
};

export async function getReminderDurations(): Promise<ReminderDurationOption[]> {
  const { data, error } = await supabase
    .from("reminder_durations")
    .select("value:id, label, amount, unit")
    .eq("is_active", true)
    .order("sort_order")
    .returns<ReminderDurationOption[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(APPOINTMENT_SELECT)
    .order("starts_at")
    .returns<AppointmentRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapAppointment);
}

export async function createAppointment({
  reminderDurationId,
  startsAt,
  title,
}: CreateAppointmentInput): Promise<Appointment> {
  const user = await ensureAnonymousSupabaseSession();

  if (!user?.id) {
    throw new Error("No signed-in user is available.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      user_id: user.id,
      title,
      starts_at: startsAt,
      reminder_duration_id: reminderDurationId,
    })
    .select(APPOINTMENT_SELECT)
    .single<AppointmentRow>();

  if (error) {
    throw error;
  }

  return mapAppointment(data);
}

export async function deleteAppointment(appointmentId: string) {
  const { error } = await supabase.from("appointments").delete().eq("id", appointmentId);

  if (error) {
    throw error;
  }
}
