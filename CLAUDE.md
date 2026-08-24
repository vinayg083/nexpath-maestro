```markdown
# About this app

This file describes this app's stack, structure, and conventions. **Keep it updated**: when the app gains a backend, new conventions, or significant structure, update this file (and the README) so future sessions inherit that knowledge.

## Stack

- Expo cross-platform app (iOS / Android / Web), TypeScript (strict), Expo Router v4 (file-based routing)
- NativeWind v4 (Tailwind for RN) for styling
- React Native Reusables (shadcn-style primitives, `@rn-primitives/*`) as the base component library; build higher-level components on top
- Yarn Berry (v4.x) with **Plug'n'Play** — not classic yarn, no traditional `node_modules`. Patching dependencies is a last resort; use `yarn patch`, never hand-edit.
- React Query available for server state when a backend is wired
- `~/*` aliases the project root (see `tsconfig.json`), e.g. `import { Button } from '~/components/ui/button';`

## Light-Only Styling

This app intentionally has no dark mode, theme provider, theme toggle, or appearance listener. Expo is configured with `userInterfaceStyle: "light"`, the root layout uses a dark-content status bar, and all screens should keep a white/light background.

Use NativeWind classes (`text-foreground`, `bg-background`, `text-h1`, `border-border`, …) for styled UI. These resolve to static light values declared in `tailwind.config.js` and `global.css`. For raw values in React Native style objects, use `lib/design-tokens.ts`. Do not add `useColorScheme`, `Appearance`, `dark:` classes, or new dynamic theming logic unless the product direction changes.

## Conventions

- **Icons:** Lucide icons must go through the `LucideIcon` wrapper so NativeWind classes apply — `import LucideIcon from '~/lib/icons/LucideIcon';` then `<LucideIcon name="Home" className="h-6 w-6 text-foreground" />`. Do NOT import from `lucide-react-native` directly. Validate the `name` against the wrapper's registry before use; if a name is missing, pick a supported one.
- **Portals:** web uses `WebPortalContext` (DOM container); native uses `PortalHost` from `@rn-primitives/portal`. Both are configured in `app/_layout.tsx`, and the primitives in `components/ui/` rely on this — don't bypass it.
- **Fonts:** Poppins is the app-wide Google Font, loaded in `app/_layout.tsx` with Expo Fonts. Typography utilities in `global.css` and raw style tokens in `lib/design-tokens.ts` should stay aligned with Poppins; use NativeWind weight classes (`font-bold`, `font-medium`, etc.) rather than inline font-family overrides when possible.
- **Navigation:** set an explicit human-friendly `title` for every screen header — never let route names like `(tabs)` or `products/[id]` appear in the UI. Keep `app/index.tsx` for redirects, not feature UI; use `_layout.tsx` files for stacks/tabs.
- **Screens:** wrap in SafeAreaView (react-native-safe-area-context) and handle scrolling/gestures correctly. Keep bottom tab bars compact — pad content inside screens, not via `tabBarStyle`.
- **Components:** shared UI in `components/ui/`, layout-level pieces in `components/layout/`. Keep components small and focused; reuse before creating.
- **Performance:** `FlatList`/`SectionList` for long lists — never `ScrollView` + `.map()` for large collections.

## Critical files

- `app/_layout.tsx` — root layout, light status bar setup, font loading, portal hosts
- `lib/design-tokens.ts` — raw light palette and typography values for React Native style objects
- `tailwind.config.js` — NativeWind config, static light color declarations, safelist
- `lib/utils.ts` — `cn` helper for class merging
- `global.css` — global CSS and typography classes

## Current state

<!-- Update this section as the app evolves: connected backend and how data flows,
     key screens and routes, state stores, env vars the app expects, known TODOs. -->

- NexPath first build is implemented as a static, navigable Expo Router app with onboarding followed by bottom tabs.
- `app/index.tsx` redirects to `/welcome`, so the app always opens on the dedicated Welcome screen before onboarding. Additional onboarding routes live under `app/onboarding/`: `onboardingStep1`, `onboardingStep2`, and `onboardingStep3`; finishing onboarding dismisses the onboarding stack before replacing the root with `/(tabs)/myPathScreen`, so native swipe/back actions cannot return to onboarding after completion.
- The four onboarding screens were restyled to closely match the uploaded `Untitled4.jpg` wireframe reference: minimal white screens, compact form controls, two-column priority tiles, and small primary action buttons.
- onboardingStep2 loads active goals from `goal_categories`, allows up to 3 local picks (at least 1 to continue), and submits selected picks to My Path through `user_path_categories.goal_category_id` only when the user presses Next.
- My Path reads `user_path_categories` through `goal_categories`, counts linked `path_tasks`, calculates completion progress from `user_path_task_completions` joined through `path_tasks.goal_category_id`, and filters task lists by `path_tasks.goal_category_id` using the My Path goal category id. Each My Path load also updates the signed-in `profiles.timezone` field from the device/browser IANA timezone when available. Task lists load the backend category before rendering so the category title never flashes a placeholder; task/resource viewer titles render from backend task data only. Task rows use 2px `#788896` borders, show non-interactive completion circles, and open task detail when pressed. Task subtitles map from `path_tasks.subtitle`, incomplete task action labels map from `path_tasks.incomplete_label`, and completed tasks show `Completed` with a warning before marking them incomplete again; users can only change completion from the task detail screen. `video` task resources render directly as full-height player pages instead of showing the intermediate action layout. Shared video playback lives in `components/resources/VideoPlayer.tsx`; it accepts `video_url`, automatically detects YouTube URLs versus direct video/storage URLs, uses `expo-video` with native controls for direct playback, and uses `react-native-youtube-iframe` with validated extracted video IDs for YouTube playback. Direct videos support autoplay while active, center tap-to-play/pause with a fading play overlay, native scrub/seek, fullscreen, mute/unmute, current time/duration controls, loading/buffering UI, retryable errors, web-safe default mute, and pause on inactive/unmount. YouTube videos stay inside the app and are controlled exclusively by the YouTube player's own embedded controls (`controls: true`) — **never place a touch-intercepting overlay above the YouTube WebView**: on web the app cannot deliver play/pause commands into the cross-origin player iframe (react-native-web-webview posts without a targetOrigin so the browser drops them, and the iframe has no autoplay permission), so a covering overlay makes playback unstartable. On iOS/Android the `play` prop drives autoplay-while-active and pause-on-inactive, mirroring player state events so it never fights taps made in the YouTube UI; on web the player mounts only while its feed page is active (unmounting is the only reliable web pause) and playback starts with one tap on YouTube's play button. The only layers above the player are a pointer-events-none loading spinner and the retryable error panel; invalid URLs get a dedicated message. Video pages show the resource title and description as plain bottom-left caption text, with no translucent backing panel and descriptions capped at 3 lines until tapped to expand; the video page's SafeAreaView, viewer chrome, and caption wrapper are all pointer-events box-none with no full-size plain children, because react-native-web's box-none forces direct children to pointer-events auto and a full-size child (e.g. a flex-1 spacer) blocks clicks to the iframe on web.
- The My Path bottom CTA says `Explore` when the user's path is empty and `Explore More` once path categories exist. `/explore` lists all `goal_categories` with a My Path-style row that shows category icon, title, subtitle, and chevron. `/explore/[id]` uses a task-detail-like layout for category details, with category title, subtitle/description text, and an `Add to My Path` button 40px below the description; categories already in the user's path show a disabled `Added to My Path` action.
- My Path analytics use `lib/analytics`: task completion emits `task_completed` with task/category metadata, task resource feed views and resource action taps emit `task_resource_viewed`, and Explore add-to-path emits `task_added_from_explore` with category metadata.
- The Calendar tab creates Supabase-backed appointments/reminders and requires strictly future local date-times. Date selection blocks past dates, time selection keeps the original wheel-style picker UI, the form shows "Please select a future date and time." below the time field when the selected local time is in the past, and form submission revalidates against the user's local `Date` before saving.
- Routes live under `app/(tabs)/`: `myPathScreen`, `resources`, `calendar`, and `more`.
- The Resources tab is a category-based directory loaded through `getResourceCarousels()`, which queries `category_resources`, joins linked `categories` and active `resources`, groups every linked resource under each category, and renders horizontal resource cards. Local directory links still load for the user's profile location. Full-screen vertical feeds are reserved for My Path task resources.
- The More tab exposes account deletion; before invoking the `delete-account` Edge Function, the client removes the signed-in user's app rows from appointments, devices, My Path categories, task completions, and profile data so Supabase auth deletion is not blocked by related records. After a successful delete and local sign-out, the user is routed back to the Welcome screen.
- Shared onboarding UI lives in `components/onboarding/OnboardingFrame.tsx` and `components/onboarding/OnboardingChoice.tsx`.
- Shared tab metadata lives in `lib/nexpath-tabs.ts`; the reusable placeholder layout is `components/layout/NexPathPlaceholderScreen.tsx`.
- The app is light-mode only. Static colors are centralized in `lib/design-tokens.ts`, `tailwind.config.js`, and `global.css` around the requested palette: primary `#336699`, background `#FFFFFF`, text `#293845`, and destructive/accent red `#D3455B`. Poppins is used across app text.
- Shared form labels use 14px Poppins with a 20px line height by default.
- Supabase is configured through `lib/supabase/` for auth/location dropdowns, onboardingStep2 goal category picks saved to My Path, Resources category-resource carousel/directory reads, My Path category/task/resource reads, profile timezone updates, task completion writes, onboardingStep1 profile saves, and onboardingStep3 `complete_onboarding` RPC on Finish. Anonymous auth setup idempotently ensures the signed-in user's `profiles` row exists before profile-dependent writes such as device registration, onboarding saves, priority picks, My Path reads, profile timezone updates, and task completion writes.
```
