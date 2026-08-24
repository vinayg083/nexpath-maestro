import * as React from "react";
import { Modal, Pressable, View } from "react-native";
import DateTimePicker, { type DateType, useDefaultStyles } from "react-native-ui-datepicker";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string) {
  const match = dateKey.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDisplayDate(dateKey: string) {
  const date = parseDateKey(dateKey);

  if (!date) {
    return dateKey;
  }

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function clampToMinimumDate(date: Date, minimumDate: Date) {
  return date.getTime() < minimumDate.getTime() ? minimumDate : date;
}

function toDate(value: DateType): Date | null {
  if (value == null) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // dayjs-like objects from the picker
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  return null;
}

type AppointmentDateFieldProps = {
  className?: string;
  onChange: (dateKey: string) => void;
  value: string;
};

export function AppointmentDateField({ className, onChange, value }: AppointmentDateFieldProps) {
  const defaultStyles = useDefaultStyles("light");
  const minimumDate = React.useMemo(() => startOfToday(), []);
  const [open, setOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState<Date>(minimumDate);

  const selectedDate = React.useMemo(() => {
    const parsed = value ? parseDateKey(value) : null;
    return clampToMinimumDate(parsed ?? minimumDate, minimumDate);
  }, [minimumDate, value]);

  function openPicker() {
    setDraftDate(selectedDate);
    setOpen(true);
  }

  function handleConfirm() {
    const next = clampToMinimumDate(draftDate, startOfToday());
    onChange(formatDateKey(next));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Appointment date"
        accessibilityRole="button"
        className={cn(
          "h-11 justify-center rounded-md border border-input bg-background px-3 active:opacity-80",
          className,
        )}
        onPress={openPicker}
      >
        <Text
          className={cn(
            "text-base leading-[1.25]",
            value ? "text-foreground" : "text-muted-foreground",
          )}
          numberOfLines={1}
        >
          {value ? formatDisplayDate(value) : "Date"}
        </Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable accessibilityRole="button" className="flex-1" onPress={() => setOpen(false)} />
          <View className="rounded-t-xl bg-background px-4 pb-8 pt-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-bold text-primary">Select date</Text>
              <Button className="h-auto px-0 py-1" variant="link" onPress={handleConfirm}>
                <Text className="text-sm font-medium text-primary">Done</Text>
              </Button>
            </View>

            <DateTimePicker
              date={draftDate}
              minDate={minimumDate}
              mode="single"
              onChange={({ date }) => {
                const next = toDate(date);

                if (!next) {
                  return;
                }

                setDraftDate(clampToMinimumDate(next, startOfToday()));
              }}
              styles={{
                ...defaultStyles,
                selected: { backgroundColor: colors.primary },
                selected_label: { color: colors.primaryForeground },
                today: { borderColor: colors.primary, borderWidth: 1 },
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
