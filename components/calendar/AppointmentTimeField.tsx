import * as React from "react";
import { Modal, Pressable, View } from "react-native";
import DateTimePicker, { type DateType, useDefaultStyles } from "react-native-ui-datepicker";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function formatTimeKey(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function parseTimeKey(timeKey: string): { hours: number; minutes: number } | null {
  const match = timeKey.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return { hours, minutes };
}

function formatDisplayTime(timeKey: string) {
  const parts = parseTimeKey(timeKey);

  if (!parts) {
    return timeKey;
  }

  const date = new Date();
  date.setHours(parts.hours, parts.minutes, 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
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

  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  return null;
}

function timeKeyToDate(timeKey: string | null) {
  const date = new Date();
  const parts = timeKey ? parseTimeKey(timeKey) : null;

  if (parts) {
    date.setHours(parts.hours, parts.minutes, 0, 0);
  } else {
    date.setMinutes(0, 0, 0);
  }

  return date;
}

type AppointmentTimeFieldProps = {
  className?: string;
  onChange: (timeKey: string) => void;
  value: string;
};

export function AppointmentTimeField({ className, onChange, value }: AppointmentTimeFieldProps) {
  const defaultStyles = useDefaultStyles("light");
  const [open, setOpen] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState(() => timeKeyToDate(value || null));

  React.useEffect(() => {
    setDraftDate(timeKeyToDate(value || null));
  }, [value]);

  function openPicker() {
    setDraftDate(timeKeyToDate(value || null));
    setOpen(true);
  }

  function handleConfirm() {
    onChange(formatTimeKey(draftDate));
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Appointment time"
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
          {value ? formatDisplayTime(value) : "Time"}
        </Text>
      </Pressable>

      <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable accessibilityRole="button" className="flex-1" onPress={() => setOpen(false)} />
          <View className="rounded-t-xl bg-background px-4 pb-8 pt-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-base font-bold text-primary">Select time</Text>
              <Button className="h-auto px-0 py-1" variant="link" onPress={handleConfirm}>
                <Text className="text-sm font-medium text-primary">Done</Text>
              </Button>
            </View>

            <DateTimePicker
              date={draftDate}
              hideHeader
              initialView="time"
              mode="single"
              timePicker
              use12Hours
              onChange={({ date }) => {
                const next = toDate(date);

                if (!next) {
                  return;
                }

                setDraftDate(next);
              }}
              styles={{
                ...defaultStyles,
                selected: { backgroundColor: colors.primary },
                selected_label: { color: colors.primaryForeground },
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
