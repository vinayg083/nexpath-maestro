import * as React from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppointmentDateField, parseDateKey } from "@/components/calendar/AppointmentDateField";
import { AppointmentTimeField, parseTimeKey } from "@/components/calendar/AppointmentTimeField";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { CALENDAR_EVENTS, SCREENS, trackEvent, useScreenView } from "@/lib/analytics";
import LucideIcon from "@/lib/icons/LucideIcon";
import { colors } from "@/lib/design-tokens";
import {
  cancelAppointmentReminder,
  scheduleAppointmentReminder,
} from "@/lib/notifications/appointment-reminders";
import {
  createAppointment,
  deleteAppointment,
  getAppointments,
  getReminderDurations,
  type Appointment,
  type ReminderDurationOption,
} from "@/lib/supabase";

const EMPTY_FORM = {
  title: "",
  date: "",
  time: "",
  hasReminder: false,
  reminderDurationId: "",
};

const cardShadow =
  Platform.OS === "web"
    ? { boxShadow: "0 1px 4px rgba(41, 56, 69, 0.1)" }
    : {
        shadowColor: "#293845",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      };

function formatAppointmentDate(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return startsAt;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentTime(startsAt: string) {
  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isDateTodayOrFuture(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

function isFutureDateTime(date: Date) {
  return date.getTime() > Date.now();
}

function getAppointmentDateTime(dateInput: string, timeInput: string): Date | null {
  const date = parseDateKey(dateInput);
  const timeParts = parseTimeKey(timeInput);

  if (!date || !timeParts || !isDateTodayOrFuture(date)) {
    return null;
  }

  const startsAt = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    timeParts.hours,
    timeParts.minutes,
    0,
    0,
  );

  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  return startsAt;
}

function combineDateAndTime(dateInput: string, timeInput: string): string | null {
  const startsAt = getAppointmentDateTime(dateInput, timeInput);

  if (!startsAt || !isFutureDateTime(startsAt)) {
    return null;
  }

  return startsAt.toISOString();
}

function AppointmentCard({
  appointment,
  isDeleting,
  isDeleteDisabled,
  onDelete,
}: {
  appointment: Appointment;
  isDeleting: boolean;
  isDeleteDisabled: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <View
      className="relative flex-row items-center rounded-md bg-[#F2F5F7] px-5 py-4"
      style={cardShadow}
    >
      <View className="absolute bottom-4 left-5 top-4 w-0.5 rounded-full bg-primary" />

      <View className="min-w-0 flex-1 gap-1 pl-4">
        <Text className="text-[16px] font-semibold leading-6 text-primary">
          {appointment.title}
        </Text>
        <Text className="text-[16px] leading-6 text-muted-foreground">
          {formatAppointmentDate(appointment.starts_at)}
        </Text>
        <Text className="text-[16px] leading-6 text-muted-foreground">
          {formatAppointmentTime(appointment.starts_at)}
        </Text>
        {appointment.reminder_duration_id != null ? (
          <View className="flex-row items-center gap-1">
            <LucideIcon color={colors.success} name="Bell" size={24} strokeWidth={2} />
            {appointment.reminder_label ? (
              <Text className="text-[14px] leading-5 text-muted-foreground">
                {`${appointment.reminder_label} before`}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel={`Delete ${appointment.title}`}
        accessibilityRole="button"
        accessibilityState={{ busy: isDeleting, disabled: isDeleteDisabled }}
        className="h-9 w-9 items-center justify-center p-1.5 active:opacity-70"
        disabled={isDeleteDisabled}
        onPress={() => onDelete(appointment.id)}
      >
        {isDeleting ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <LucideIcon color={colors.primary} name="Trash2" size={24} strokeWidth={2} />
        )}
      </Pressable>
    </View>
  );
}

function CreateAppointmentForm({
  errorMessage,
  isSaving,
  reminderOptions,
  onCancel,
  onAdd,
}: {
  errorMessage: string;
  isSaving: boolean;
  reminderOptions: ReminderDurationOption[];
  onCancel: () => void;
  onAdd: (values: {
    title: string;
    date: string;
    time: string;
    reminderDurationId: string | null;
    reminderAmount: number | null;
    reminderUnit: string | null;
  }) => void;
}) {
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [triggerWidth, setTriggerWidth] = React.useState<number>();
  const selectedReminder = reminderOptions.find(
    (option) => option.value === form.reminderDurationId,
  );
  const [now, setNow] = React.useState(() => new Date());
  const appointmentDateTime = React.useMemo(
    () => getAppointmentDateTime(form.date, form.time),
    [form.date, form.time],
  );
  const isPastAppointmentTime =
    form.date.trim().length > 0 &&
    form.time.trim().length > 0 &&
    appointmentDateTime != null &&
    appointmentDateTime.getTime() <= now.getTime();

  React.useEffect(() => {
    if (form.date.trim().length === 0 || form.time.trim().length === 0) {
      return undefined;
    }

    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [form.date, form.time]);

  // When Reminder is on, a duration must be chosen (unless the options failed
  // to load, in which case we don't block saving the appointment itself).
  const needsReminderChoice =
    form.hasReminder && reminderOptions.length > 0 && !selectedReminder;

  const canSubmit =
    form.title.trim().length > 0 &&
    form.date.trim().length > 0 &&
    form.time.trim().length > 0 &&
    !isPastAppointmentTime &&
    !needsReminderChoice &&
    !isSaving;

  function handleAdd() {
    if (!canSubmit) {
      return;
    }

    onAdd({
      title: form.title.trim(),
      date: form.date.trim(),
      time: form.time.trim(),
      reminderDurationId: form.hasReminder ? (selectedReminder?.value ?? null) : null,
      reminderAmount: form.hasReminder ? (selectedReminder?.amount ?? null) : null,
      reminderUnit: form.hasReminder ? (selectedReminder?.unit ?? null) : null,
    });
  }

  return (
    <View className="gap-3 rounded-sm border-2 border-primary bg-tertiary px-8 py-6">
      <Text className="text-[18px] font-semibold leading-6 text-primary">Create Appointment</Text>

      <View className="gap-2.5">
        <Input
          className="h-11 border-[#9eadba] bg-background text-base"
          placeholder="Name"
          value={form.title}
          onChangeText={(title) => setForm((current) => ({ ...current, title }))}
        />
        <AppointmentDateField
          className="h-11 border-[#9eadba] bg-background"
          value={form.date}
          onChange={(date) => setForm((current) => ({ ...current, date }))}
        />
        <AppointmentTimeField
          className="h-11 border-[#9eadba] bg-background"
          value={form.time}
          onChange={(time) => {
            setNow(new Date());
            setForm((current) => ({ ...current, time }));
          }}
        />
        {isPastAppointmentTime ? (
          <Text className="-mt-1 text-sm leading-5 text-destructive">
            Please select a future date and time.
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.hasReminder }}
          className="flex-row items-center gap-2.5 active:opacity-70"
          onPress={() =>
            setForm((current) => {
              const hasReminder = !current.hasReminder;

              return {
                ...current,
                hasReminder,
                // Default to the first option when turning the reminder on so a
                // duration is always selected; clear it when turning off.
                reminderDurationId: hasReminder
                  ? current.reminderDurationId || (reminderOptions[0]?.value ?? "")
                  : "",
              };
            })
          }
        >
          <View pointerEvents="none">
            <Checkbox
              checked={form.hasReminder}
              className={
                form.hasReminder
                  ? "h-5 w-5 border-2 border-primary"
                  : "h-5 w-5 border-2 border-primary bg-background"
              }
              onCheckedChange={() => {}}
            />
          </View>
          <Text className="text-base font-normal text-foreground">Reminder</Text>
        </Pressable>

        {form.hasReminder ? (
          reminderOptions.length > 0 ? (
            <Select
              className="w-full"
              value={
                selectedReminder
                  ? { value: selectedReminder.value, label: selectedReminder.label }
                  : undefined
              }
              onValueChange={(option) => {
                if (!option?.value) {
                  return;
                }

                setForm((current) => ({ ...current, reminderDurationId: option.value }));
              }}
            >
              <SelectTrigger
                className="h-11 w-full rounded-md border-[#9eadba] bg-background px-3"
                onLayout={(event) => setTriggerWidth(event.nativeEvent.layout.width)}
                // Dismiss the Name field's keyboard before the dropdown opens, so
                // the option list isn't hidden behind it.
                onPress={() => Keyboard.dismiss()}
              >
                <SelectValue
                  className="text-base text-foreground"
                  placeholder="Remind me before"
                />
              </SelectTrigger>
              <SelectContent
                className="max-h-72"
                style={triggerWidth ? { width: triggerWidth } : undefined}
              >
                <SelectGroup>
                  {reminderOptions.map((option) => (
                    <SelectItem key={option.value} label={option.label} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <Text className="text-sm leading-5 text-muted-foreground">
              Reminder options are unavailable right now.
            </Text>
          )
        ) : null}
      </View>

      {errorMessage ? (
        <Text className="text-sm leading-5 text-destructive">{errorMessage}</Text>
      ) : null}

      <View className="flex-row items-center justify-between">
        <Button className="h-auto px-0 py-1" disabled={isSaving} variant="link" onPress={onCancel}>
          <Text className="border-b border-[#6558f5] text-sm text-[#6558f5]">Cancel</Text>
        </Button>

        <Button
          className="h-10 min-w-[72px] rounded-sm px-4"
          disabled={!canSubmit}
          onPress={handleAdd}
        >
          <Text className="text-sm font-medium text-primary-foreground">
            {isSaving ? "Adding…" : "Add"}
          </Text>
        </Button>
      </View>
    </View>
  );
}

export function CalendarScreen() {
  useScreenView(SCREENS.CALENDAR);

  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [loadError, setLoadError] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [actionError, setActionError] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [appointmentToDelete, setAppointmentToDelete] = React.useState<Appointment | null>(null);
  const [reminderOptions, setReminderOptions] = React.useState<ReminderDurationOption[]>([]);
  const hasLoadedRef = React.useRef(false);

  const loadAppointments = React.useCallback(async () => {
    const showSpinner = !hasLoadedRef.current;

    if (showSpinner) {
      setIsLoading(true);
    }

    setLoadError("");

    try {
      const [nextAppointments] = await Promise.all([
        getAppointments(),
        // Refetched on every focus so backend changes show up, and silently after the
        // first load: it shares the initial spinner, then updates in place.
        (async () => {
          try {
            const options = await getReminderDurations();
            setReminderOptions(options);
          } catch {
            // Non-fatal, and never destructive: a failed refresh keeps whatever
            // options are already on screen rather than emptying the dropdown.
          }
        })(),
      ]);
      setAppointments(nextAppointments);
      hasLoadedRef.current = true;
    } catch {
      setLoadError("We couldn't load your calendar. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadAppointments();
    }, [loadAppointments]),
  );

  async function handleAdd(values: {
    title: string;
    date: string;
    time: string;
    reminderDurationId: string | null;
    reminderAmount: number | null;
    reminderUnit: string | null;
  }) {
    const startsAt = combineDateAndTime(values.date, values.time);

    if (!startsAt) {
      setFormError("Please select a future date and time.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    setActionError("");

    try {
      const appointment = await createAppointment({
        title: values.title,
        startsAt,
        reminderDurationId: values.reminderDurationId,
      });

      if (appointment.reminder_duration_id != null) {
        trackEvent(CALENDAR_EVENTS.REMINDER_SET, {
          screen: SCREENS.CALENDAR,
          target_id: appointment.id,
        });

        // Schedule the on-device reminder (native only). Failures here must not
        // block saving the appointment itself. Prefer the values echoed back by
        // the insert, falling back to the form's selection.
        const reminderAmount = appointment.reminder_amount ?? values.reminderAmount;
        const reminderUnit = appointment.reminder_unit ?? values.reminderUnit;

        if (reminderAmount != null && reminderUnit != null) {
          void scheduleAppointmentReminder({
            id: appointment.id,
            title: appointment.title,
            startsAt: appointment.starts_at,
            reminderAmount,
            reminderUnit,
          });
        }
      }

      setAppointments((current) =>
        [...current, appointment].sort(
          (left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime(),
        ),
      );
      setFormOpen(false);
    } catch {
      setFormError("We couldn't save this appointment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) {
      return;
    }

    setActionError("");
    setDeletingId(id);

    try {
      await deleteAppointment(id);
      // Tear down the on-device reminder so it can't fire for a deleted
      // appointment (no-op when none was scheduled).
      void cancelAppointmentReminder(id);
      setAppointments((current) => current.filter((appointment) => appointment.id !== id));
      setAppointmentToDelete(null);
    } catch {
      setActionError("We couldn't delete that appointment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <NexPathHeader />

      <SafeAreaView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : formOpen ? (
            <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
              <View className="mx-6 mt-5 flex-1">
                <CreateAppointmentForm
                  errorMessage={formError}
                  isSaving={isSaving}
                  reminderOptions={reminderOptions}
                  onCancel={() => {
                    setFormOpen(false);
                    setFormError("");
                  }}
                  onAdd={handleAdd}
                />
              </View>
            </TouchableWithoutFeedback>
          ) : appointments.length === 0 ? (
            <View className="mt-10 items-center px-8">
              <Text className="max-w-[300px] text-center text-lg leading-7 text-muted-foreground">
                {loadError ||
                  "There is nothing on your calendar. Add important reminders and appointments here like probation meetings, court dates, etc.."}
              </Text>
            </View>
          ) : (
            <FlatList
              contentContainerClassName="mt-5 gap-5 px-5 pb-28"
              data={appointments}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                actionError || loadError ? (
                  <Text className="py-3 text-center text-sm leading-5 text-destructive">
                    {actionError || loadError}
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <AppointmentCard
                  appointment={item}
                  isDeleteDisabled={deletingId != null || appointmentToDelete != null}
                  isDeleting={deletingId === item.id}
                  onDelete={(id) => {
                    setActionError("");
                    setAppointmentToDelete(
                      appointments.find((appointment) => appointment.id === id) ?? null,
                    );
                  }}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}

          {!formOpen ? (
            <Pressable
              accessibilityLabel="Add appointment"
              accessibilityRole="button"
              accessibilityState={{ disabled: deletingId != null || appointmentToDelete != null }}
              className="absolute bottom-5 right-5 h-14 w-14 items-center justify-center rounded-full bg-destructive active:opacity-90"
              disabled={deletingId != null || appointmentToDelete != null}
              onPress={() => {
                setFormError("");
                setActionError("");
                setFormOpen(true);
              }}
              style={{
                opacity: deletingId != null || appointmentToDelete != null ? 0.5 : 1,
                shadowColor: "#293845",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.18,
                shadowRadius: 5,
                elevation: 5,
              }}
            >
              <LucideIcon
                color={colors.destructiveForeground}
                name="Plus"
                size={28}
                strokeWidth={2.5}
              />
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      <AlertDialog
        open={appointmentToDelete != null}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setAppointmentToDelete(null);
            setActionError("");
          }
        }}
      >
        <AlertDialogContent className="mx-[30px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-6">
              Are you sure you want to delete {appointmentToDelete?.title ?? "this reminder"}? This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {actionError ? (
            <Text className="text-base leading-6 text-destructive">{actionError}</Text>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId != null}>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <Button
              disabled={deletingId != null || appointmentToDelete == null}
              variant="destructive"
              onPress={() => {
                if (appointmentToDelete) {
                  void handleDelete(appointmentToDelete.id);
                }
              }}
            >
              <Text>{deletingId ? "Deleting…" : "Delete"}</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
