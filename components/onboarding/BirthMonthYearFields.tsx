import * as React from "react";
import {
  Modal,
  Pressable,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { colors } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = 1900;
const DEFAULT_YEAR = Math.min(CURRENT_YEAR - 18, CURRENT_YEAR);
const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const SHEET_HEIGHT = 280;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const YEARS = Array.from(
  { length: CURRENT_YEAR - MIN_BIRTH_YEAR + 1 },
  (_, index) => MIN_BIRTH_YEAR + index
);

type BirthMonthYearFieldsProps = {
  month?: number;
  onChange: (next: { month?: number; year?: number }) => void;
  year?: number;
};

function FieldButton({
  className,
  label,
  onPress,
  placeholder,
}: {
  className?: string;
  label?: string;
  onPress: () => void;
  placeholder: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "h-14 justify-center rounded-sm border-2 border-[#c5ced6] bg-background px-4 active:opacity-80",
        className
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          "text-lg leading-7",
          label ? "text-foreground" : "text-muted-foreground/60"
        )}
        numberOfLines={1}
      >
        {label ?? placeholder}
      </Text>
    </Pressable>
  );
}

function WheelItem({
  index,
  label,
  scrollY,
}: {
  index: number;
  label: string;
  scrollY: SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / ITEM_HEIGHT - index);

    return {
      opacity: interpolate(
        distance,
        [0, 0.55, 1.2, 2],
        [1, 0.55, 0.3, 0.15],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          scale: interpolate(
            distance,
            [0, 0.55, 1.2],
            [1.18, 0.96, 0.88],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <View style={{ height: ITEM_HEIGHT, justifyContent: "center" }}>
      <Animated.Text
        numberOfLines={1}
        style={[
          {
            color: colors.foreground,
            fontFamily: "Poppins_700Bold",
            fontSize: 22,
            textAlign: "center",
          },
          animatedStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </View>
  );
}

function ScrollWheel<T extends string | number>({
  data,
  onChange,
  value,
}: {
  data: readonly T[];
  onChange: (value: T) => void;
  value: T;
}) {
  const listRef = React.useRef<Animated.FlatList<T>>(null);
  const selectedIndex = Math.max(0, data.indexOf(value as T));
  const scrollY = useSharedValue(selectedIndex * ITEM_HEIGHT);
  const pad = (LIST_HEIGHT - ITEM_HEIGHT) / 2;
  const selectedIndexRef = React.useRef(selectedIndex);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const scrollTo = React.useCallback((index: number, animated: boolean) => {
    const offset = Math.max(0, index) * ITEM_HEIGHT;

    // Keep the label animation driven by the actual list position while an
    // animated scroll is in progress. Updating it up front causes a visible
    // jump before the wheel finishes moving.
    if (!animated) {
      scrollY.value = offset;
    }

    listRef.current?.scrollToOffset({ animated, offset });
  }, [scrollY]);

  function selectFromOffset(offsetY: number) {
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round(offsetY / ITEM_HEIGHT))
    );
    const next = data[index];
    selectedIndexRef.current = index;

    if (next != null && next !== value) {
      onChange(next);
    }
  }

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    selectFromOffset(event.nativeEvent.contentOffset.y);
  }

  React.useEffect(() => {
    // Synchronize changes originating outside the wheel (such as reopening
    // the picker) without interrupting the animated user selection.
    if (selectedIndex !== selectedIndexRef.current) {
      selectedIndexRef.current = selectedIndex;
      scrollTo(selectedIndex, false);
    }
  }, [scrollTo, selectedIndex]);

  return (
    <Animated.FlatList
      ref={listRef}
      data={data as T[]}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        index,
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
      })}
      keyExtractor={(item) => String(item)}
      onLayout={() => scrollTo(selectedIndex, false)}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      onScroll={scrollHandler}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => {
            selectedIndexRef.current = index;
            scrollTo(index, true);
            onChange(item);
          }}
        >
          <WheelItem index={index} label={String(item)} scrollY={scrollY} />
        </Pressable>
      )}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={ITEM_HEIGHT}
      contentContainerStyle={{ paddingVertical: pad }}
      style={{ flex: 1, height: LIST_HEIGHT }}
    />
  );
}

export function BirthMonthYearFields({
  month,
  onChange,
  year,
}: BirthMonthYearFieldsProps) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = React.useState(false);
  const [wheelKey, setWheelKey] = React.useState(0);
  const [draftMonth, setDraftMonth] = React.useState(month ?? 1);
  const [draftYear, setDraftYear] = React.useState(year ?? DEFAULT_YEAR);
  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdrop = useSharedValue(0);

  const monthLabel = month != null ? MONTHS[month - 1] : undefined;

  const closePicker = React.useCallback(() => {
    translateY.value = withTiming(SHEET_HEIGHT, {
      duration: 240,
      easing: Easing.in(Easing.cubic),
    });
    backdrop.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setVisible)(false);
      }
    });
  }, [backdrop, translateY]);

  function openPicker() {
    const nextMonth = month ?? 1;
    const nextYear = year ?? DEFAULT_YEAR;
    setDraftMonth(nextMonth);
    setDraftYear(nextYear);
    setWheelKey((current) => current + 1);
    setVisible(true);
    translateY.value = SHEET_HEIGHT;
    backdrop.value = 0;
    translateY.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    backdrop.value = withTiming(1, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
  }

  function handleDone() {
    onChange({ month: draftMonth, year: draftYear });
    closePicker();
  }

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * 0.35,
  }));

  return (
    <>
      <View className="flex-row gap-3">
        <FieldButton
          className="w-1/2"
          label={monthLabel}
          onPress={openPicker}
          placeholder="Month"
        />
        <FieldButton
          className="w-[30%]"
          label={year != null ? String(year) : undefined}
          onPress={openPicker}
          placeholder="Year"
        />
      </View>

      <Modal
        animationType="none"
        onRequestClose={closePicker}
        transparent
        visible={visible}
      >
        <View className="flex-1 justify-end">
          <Pressable
            accessibilityLabel="Dismiss birthdate picker"
            accessibilityRole="button"
            className="absolute inset-0"
            onPress={closePicker}
          >
            <Animated.View
              className="absolute inset-0 bg-black"
              style={backdropStyle}
            />
          </Pressable>

          <Animated.View
            className="rounded-t-2xl bg-background"
            style={[
              { paddingBottom: Math.max(insets.bottom, 12) },
              sheetStyle,
            ]}
          >
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <Pressable onPress={closePicker} hitSlop={8}>
                <Text className="text-base text-muted-foreground">Cancel</Text>
              </Pressable>
              <Text className="text-base font-semibold text-foreground">
                Birthdate
              </Text>
              <Pressable onPress={handleDone} hitSlop={8}>
                <Text className="text-base font-semibold text-primary">Done</Text>
              </Pressable>
            </View>

            <View className="mx-4 my-3 flex-row" style={{ height: LIST_HEIGHT }}>
              <ScrollWheel
                key={`month-${wheelKey}`}
                data={MONTHS}
                onChange={(label) => setDraftMonth(MONTHS.indexOf(label) + 1)}
                value={MONTHS[draftMonth - 1] ?? MONTHS[0]}
              />
              <ScrollWheel
                key={`year-${wheelKey}`}
                data={YEARS}
                onChange={setDraftYear}
                value={draftYear}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}
