# Handoff: swap the onboarding dropdowns to react-native-dropdown-picker

Purpose: port this change into a freshly downloaded (zip) copy of the project that is not a
git repo. Everything needed to re-apply the change by hand is below, file by file. There is
also a fast option at the end (folder diff) once you have the new project on disk.

## Why this change

The onboarding dropdowns used `@rn-primitives/select`. Its option list is **not exposed to
iOS accessibility**, so options could not be selected by name by VoiceOver or by our Maestro
tests (iOS collapsed all options into a single element). We replaced it with
**react-native-dropdown-picker**, whose inline list exposes each option as its own
accessibility element on **both iOS and Android**, so every option is selectable by name.

Known caveat (Android automation only): a scroll gesture can't be routed into the inline list
while it sits inside the screen's ScrollView, so Maestro can't auto-scroll to an option that
starts **off-screen** at the bottom of a long list. Options visible in the open window select
fine, and real users can scroll normally. This affects only the state dropdown (56 items) when
the target is far down the list (about 1–2 test cases). Area and community are short lists and
are unaffected.

## Files changed (3) + Maestro follow-up

1. `package.json` — add one dependency
2. `components/ui/accessible-select.tsx` — NEW file (the dropdown component)
3. `app/onboarding/onboardingStep1.tsx` — use the new component + add z-index
4. `.maestro/…` flows/helpers — switch state/community selection from coordinate taps to by-name (follow-up, see last section)

Note: `components/ui/select.tsx` is unchanged and still used by the calendar screen. Do not
delete it.

---

## 1) package.json

Add this dependency (version we validated):

```json
"react-native-dropdown-picker": "^5.4.6",
```

Then `yarn install`. It is a **pure-JS** library — no pod install or native rebuild needed
just for the dependency (a normal Release build picks it up).

(Ignore any references to `react-native-element-dropdown`, `react-native-select-dropdown`, or
`@react-native-picker/picker` — those were experiments and are not used. If the fresh zip does
not have them, add nothing.)

---

## 2) NEW file: components/ui/accessible-select.tsx

Create this file exactly as below. It is self-contained; you can copy it verbatim.

```tsx
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
      dropDownDirection="AUTO"
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
      scrollViewProps={{ nestedScrollEnabled: true }}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 17,
    color: colors.foreground,
    fontFamily: typography.body.fontFamily,
  },
  selectedItemText: {
    color: colors.primary,
    fontFamily: typography.body.fontFamily,
  },
});
```

Depends on things that already exist in the project: `@/lib/icons/LucideIcon`,
`@/lib/design-tokens` (`colors`, `typography`). No new icons are needed
(`ChevronDown`, `ChevronUp`, `Check` are already in the LucideIcon registry).

---

## 3) app/onboarding/onboardingStep1.tsx

This file already has a small `SelectField` wrapper used three times (state, area, community).
The change: point that wrapper at the new component, and pass a z-index per field.

### 3a. Imports

Remove the `@rn-primitives/select` component imports and keep only the `Option` **type**, and
add the new component import:

```diff
- import {
-   Select,
-   SelectContent,
-   SelectGroup,
-   SelectItem,
-   SelectTrigger,
-   SelectValue,
-   type Option,
- } from "@/components/ui/select";
+ import { AccessibleSelect } from "@/components/ui/accessible-select";
+ import { type Option } from "@/components/ui/select";
```

(If your file also imported `StyleSheet` from "react-native" or `typography` from design-tokens
only for the old dropdown styles, those are no longer needed here — the styles now live in the
new component. The React Native import should read `import { ActivityIndicator, View } from
"react-native";` and design tokens `import { colors } from "@/lib/design-tokens";`.)

### 3b. SelectFieldProps — add two optional props

```diff
  type SelectFieldProps = {
    className?: string;
    containerClassName?: string;
    disabled?: boolean;
    label?: string;
    onValueChange: (option: Option) => void;
    options: SelectOption[];
    placeholder: string;
    value?: Option;
+   // Stacking order so an open list draws above the fields below it (top field = highest).
+   zIndex?: number;
+   zIndexInverse?: number;
  };
```

### 3c. SelectField body — replace the old Select JSX with AccessibleSelect

Replace the whole `SelectField` function body (the old `<Select>…</Select>` block, its
`triggerWidth` state, and any local `dropdownStyles` StyleSheet) with:

```tsx
function SelectField({
  className,
  containerClassName,
  disabled,
  label,
  onValueChange,
  options,
  placeholder,
  value,
  zIndex,
  zIndexInverse,
}: SelectFieldProps) {
  return (
    <View className={cn(containerClassName, className)} style={zIndex != null ? { zIndex } : undefined}>
      {label ? (
        <Label className="mb-3 text-base font-semibold leading-6">{label}</Label>
      ) : null}
      <AccessibleSelect
        disabled={disabled}
        onValueChange={(option) => onValueChange({ label: option.label, value: option.value })}
        options={options}
        placeholder={placeholder}
        value={value?.value ? { label: value.label ?? placeholder, value: value.value } : undefined}
        zIndex={zIndex}
        zIndexInverse={zIndexInverse}
      />
    </View>
  );
}
```

### 3d. The three SelectField usages — add descending z-index

Add `zIndex` / `zIndexInverse` to each of the three `<SelectField />` uses. Top field gets the
highest z-index so its open list covers the fields below it:

- State field: `zIndex={3000}` `zIndexInverse={1000}`
- Area field (the conditional one): `zIndex={2000}` `zIndexInverse={2000}`
- Community field: `zIndex={1000}` `zIndexInverse={3000}`

Nothing else in the screen changes — the existing state, validation, area-loading, and save
logic all stay the same because the `SelectField` props (`options`, `value`, `onValueChange`,
`placeholder`, `disabled`) are unchanged.

---

## 4) Maestro flows/helpers (follow-up, not yet applied)

The old flows select the state and community by **coordinate** (the old library wasn't
text-addressable on iOS). With dropdown-picker they select **by name**. Files that need this:

- `.maestro/helpers/do-onboarding-from-welcome.yaml`
- `.maestro/helpers/reach-step2.yaml`
- `.maestro/03-onboarding-step1/01-complete-step1-with-areas.yaml`
- `.maestro/03-onboarding-step1/02-next-blocked-until-area.yaml`
- `.maestro/03-onboarding-step1/04-no-area-dropdown-for-no-areas-state.yaml`
- `.maestro/03-onboarding-step1/05-time-in-community-not-required.yaml`
- `.maestro/04-onboarding/02-tell-us-about-yourself.yaml`

Pattern to apply — replace the per-platform coordinate block with a name tap:

```yaml
# OLD (coordinate)
- tapOn: "Select a state"
- runFlow: { when: { platform: iOS },     commands: [ { tapOn: { point: "37%, 73%" } } ] }
- runFlow: { when: { platform: Android }, commands: [ { tapOn: { point: "37%, 77%" } } ] }
- assertVisible: "California"

# NEW (by name — California is visible in the open window, no scrolling)
- tapOn: "Select a state"
- tapOn: "California"
- assertVisible: "California"
```

```yaml
# Community, OLD (coordinate)
- tapOn: { below: "How long have you been in the community?" }
- runFlow: { when: { platform: iOS },     commands: [ { tapOn: { point: "50%, 60%" } } ] }
- runFlow: { when: { platform: Android }, commands: [ { tapOn: { point: "50%, 67%" } } ] }
- assertVisible: "Less than one week"

# Community, NEW (by name — first option, visible)
- tapOn: { below: "How long have you been in the community?" }
- tapOn: "Less than one week"
- assertVisible: "Less than one week"
```

For the **has-areas** cases that need **Texas** (near the bottom of the state list): on iOS a
few `swipe`s reach it; on Android auto-scroll can't reach an off-screen option, so use a
coordinate tap for the state on Android only (or keep those 1–2 state selections manual on
Android). Everything after the state pick (area, community) is by name and works on both.

---

## How to re-apply to the new (zip) project

1. Unzip the new project.
2. Add the dependency to its `package.json` (step 1) and run `yarn install`.
3. Copy `components/ui/accessible-select.tsx` in as a new file (step 2).
4. Edit its `app/onboarding/onboardingStep1.tsx` per step 3 (imports, the two z-index props on
   `SelectFieldProps`, the `SelectField` body, and the three z-index usages). Do NOT overwrite
   the whole file — the team may have other changes in it; apply just these edits.
5. Bring over the `.maestro/` folder from this project (the tests are ours, not part of the
   export), then apply the step-4 flow edits.
6. Build a Release and run the tests.

## How to verify (Android, Release build)

```bash
yarn expo run:android --variant release
```

```bash
bash run-maestro.sh .maestro/03-onboarding-step1
```

Expected: the state/community/area dropdowns open inline, options are tappable by name, and the
onboarding flow completes. iOS behaves the same for selection; only the Android off-screen
auto-scroll caveat applies.

## Faster alternative: folder diff

Once the new project is unzipped on disk, I can run a directory diff between this project and
the new one and produce the exact patch to port (and flag any places the team changed the same
files). Just point me at the new folder path.
