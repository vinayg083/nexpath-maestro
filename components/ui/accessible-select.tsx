import * as React from "react";
import { StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import LucideIcon from "@/lib/icons/LucideIcon";
import { colors, typography } from "@/lib/design-tokens";

export type SelectOption = { label: string; value: string };

type AccessibleSelectProps = {
  disabled?: boolean;
  onValueChange: (option: SelectOption) => void;
  options: SelectOption[];
  placeholder: string;
  value?: SelectOption;
  // Stacking order so an open list draws above the fields below it (top field = highest).
  zIndex?: number;
  zIndexInverse?: number;
};

/**
 * Dropdown built on react-native-dropdown-picker. Its inline list renders every option as its
 * own accessibility element on BOTH iOS and Android, so each is selectable by name (VoiceOver,
 * and Maestro `tapOn`). This replaces @rn-primitives/select, whose options were not exposed to
 * iOS accessibility. Styling matches the onboarding text fields (56px height, 2px #c5ced6
 * border, small radius, Poppins).
 *
 * Known caveat (Android automation only): a scroll gesture can't be routed into this inline list
 * while it's nested in the screen's ScrollView, so Maestro can't auto-scroll to an option that
 * starts off-screen. Options visible in the open window select fine, and real users can scroll
 * normally.
 */
export function AccessibleSelect({
  disabled,
  onValueChange,
  options,
  placeholder,
  value,
  zIndex,
  zIndexInverse,
}: AccessibleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(value?.value ?? null);
  const [items, setItems] = React.useState(
    options.map((option) => ({ label: option.label, value: option.value }))
  );

  // Keep the list in sync when options load asynchronously (e.g. areas for a state).
  React.useEffect(() => {
    setItems(options.map((option) => ({ label: option.label, value: option.value })));
  }, [options]);

  // Mirror the parent-controlled value.
  React.useEffect(() => {
    setSelected(value?.value ?? null);
  }, [value?.value]);

  return (
    <DropDownPicker
      ArrowDownIconComponent={() => (
        <LucideIcon name="ChevronDown" size={20} className="text-[#9aa5b1]" />
      )}
      ArrowUpIconComponent={() => (
        <LucideIcon name="ChevronUp" size={20} className="text-[#9aa5b1]" />
      )}
      TickIconComponent={() => <LucideIcon name="Check" size={18} className="text-foreground" />}
      disabled={disabled}
      dropDownContainerStyle={styles.list}
      // Always open directly below the trigger (like the old RN-primitives select). AUTO let
      // Android flip the list far up/down when nested in the onboarding ScrollView.
      dropDownDirection="BOTTOM"
      items={items}
      listItemContainerStyle={styles.item}
      listItemLabelStyle={styles.itemText}
      listMode="SCROLLVIEW"
      maxHeight={320}
      onSelectItem={(item) => {
        if (item?.value == null) {
          return;
        }
        onValueChange({ label: String(item.label), value: String(item.value) });
      }}
      open={open}
      placeholder={placeholder}
      placeholderStyle={styles.placeholder}
      // paddingVertical gives the first/last rows breathing room so the bottom items aren't
      // flush against the list edge (and stay fully scrollable into view).
      scrollViewProps={{ nestedScrollEnabled: true, contentContainerStyle: { paddingVertical: 6 } }}
      selectedItemLabelStyle={styles.selectedItemText}
      setItems={setItems}
      setOpen={setOpen}
      setValue={setSelected}
      style={[styles.trigger, disabled ? styles.triggerDisabled : null]}
      testID={placeholder}
      textStyle={styles.text}
      value={selected}
      zIndex={zIndex}
      zIndexInverse={zIndexInverse}
    />
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 56,
    borderWidth: 2,
    borderColor: "#c5ced6",
    borderRadius: 2,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.foreground,
    fontFamily: typography.body.fontFamily,
  },
  placeholder: {
    color: "rgba(101, 120, 137, 0.6)", // muted-foreground at 60%, matches the Month/Year fields
  },
  list: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: colors.popover,
  },
  item: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  itemText: {
    // Match the trigger text exactly (18/28 Poppins); the line height also keeps the
    // ascenders from clipping.
    fontSize: 18,
    lineHeight: 28,
    color: colors.foreground,
    fontFamily: typography.body.fontFamily,
  },
  selectedItemText: {
    color: colors.primary,
    fontFamily: typography.body.fontFamily,
  },
});
