# Maestro testing — runbook (clean project, start to finish)

Everything needed to take a **fresh** Draftbit/Expo project from "just the app + its
exported test cases" to running Maestro UI tests. Ordered steps + the gotchas we hit,
so you don't rediscover them.

The AI-facing version of this is `MAESTRO-GENERATION-PROMPT.md` (one prompt that
regenerates the flows + report). This file is the human runbook around it.

---

## 0. Prerequisites (once per machine)

- macOS with **Xcode** + an iOS **Simulator**.
- **Node** + **Yarn** (this app uses Yarn Berry).
- **Maestro CLI**: `curl -fsSL "https://get.maestro.mobile.dev" | bash` (needs a JDK). Add `~/.maestro/bin` to PATH.
- Optional: the **Maestro MCP** server, only if you want an AI agent to author/inspect flows live (`useMaestroMcp: true` in the config, and connect it via `claude mcp` / `/mcp`).

## 1. One-time project setup

Run from the project root:

```bash
bash setup-maestro.sh
```

It detects the app id, checks tools, installs deps, and builds + installs the `.app`
on a booted simulator. Watch for these, which bite on a fresh project:

- **.env is required.** The app hard-crashes on boot without the Supabase URL + anon key. Put them in `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- **Debug build ⇒ Metro must be running.** `npx expo run:ios` installs a **debug** build with **no** bundled JS (`main.jsbundle` absent). It renders a blank screen unless Metro is up. Start it in another terminal: `yarn start` (or `npx expo start`). A *release* build bundles the JS and needs no Metro — but the default dev build does. (Symptom if you forget: every flow fails at the first `assertVisible` because nothing renders.)
- **babel.config.js**: if exported from Draftbit, comment out `@draftbit/babel-plugin-inject-jsx-source` (broken `require.resolve` off Draftbit's servers) or Metro won't boot.

## 2. Config — `.maestro/testgen.config.yml`

```yaml
appId: com.draftbitbuildservices.newapp
testCases: ../<App>-expectations-*.json
modules: all            # 'all', one name, or a list
output: .maestro
useMaestroMcp: true      # only meaningful if the MCP is actually connected via /mcp
```

## 3. Generate the flows

Feed `MAESTRO-GENERATION-PROMPT.md` to the agent. It will: read the app source for
exact strings, look up dynamic content from the backend **read-only**, convert each
test case, and write flows + `.maestro/report.md`.

**Backend access is strictly GET-only.** Never POST/PATCH/PUT/DELETE, never call a
mutating RPC/Edge Function, never "seed" or "reset" data via the API. If a case needs
seeded state, drive it through the app UI or flag it for QA. (Full rule in the prompt.)

## 4. Device-control gotchas the flows are built around

These are the non-obvious things that make or break a run on this app:

1. **iOS driver is slow to start** (esp. first run). If a run dies with
   `iOS driver not ready in time` / a Kotlin `LocalXCTestInstaller` trace, it's infra,
   not your flow. Set a longer timeout and retry:
   ```bash
   export MAESTRO_DRIVER_STARTUP_TIMEOUT=120000
   ```
   `run-maestro.sh` sets this for you.

2. **Dropdowns (the `Select` component) are NOT text-addressable.** On iOS the whole
   option list collapses into ONE accessibility element whose label is every option
   comma-joined (`"Alabama, Alaska, …, Wyoming"`). So `tapOn: "California"` can never
   match. The flows tap the option by **coordinate**, per platform, then assert on the
   trigger (which *does* show the picked value):
   ```yaml
   - tapOn: "Select a state"
   - runFlow: { when: { platform: iOS },     commands: [ - tapOn: { point: "37%, 73%" } ] }  # California, 6th row
   - runFlow: { when: { platform: Android },  commands: [ - tapOn: { point: "37%, 77%" } ] }
   - assertVisible: "California"
   ```
   Rows are ~4.75% of screen height apart on the iPhone 17 sim (row 1 ≈ 49%, row 2
   Alaska ≈ 54%, row 6 California ≈ 73%). **Coordinates are position-based — re-calibrate
   if the layout or device changes.** This is the #1 reason a previously-green flow
   starts failing. (Same applies to the area and community-length dropdowns.)
   - This is also a genuine **accessibility bug** worth reporting to the app team: a
     VoiceOver user can't select an individual option either. Fixing it (each option
     its own labeled element) would let the flows tap by text and drop the coordinates.

3. **Composite rows merge their text.** Any tappable row (My Path category, task row,
   explore row) is one accessible element, so iOS joins its child texts:
   a My Path goal shows as `"Acamedics, Getting going"` (name + status), a task as
   `"Undergrad, High school"` (title + subtitle). Match rows with a **partial pattern**,
   not the exact name: `tapOn: "Acamedics.*"`. (Unlike the dropdown, this merge is
   *correct* accessibility — a button should be one VoiceOver stop — so just adapt the
   test.) Watch prefix collisions: `"Task 1.*"` also matches "Task 10"/"Task 11"; use
   `"Task 1,.*"` (the comma before the subtitle) to pin it.
   - Screen **titles/eyebrows** (tasks header, task-detail title) are standalone Text,
     so those keep exact matches. Only *rows* merge.

4. **Birthdate wheel is fine.** The picker opens on a valid default (January /
   current-year−18); `tapOn "Month"` then `tapOn "Done"` commits it. Wheel rows
   (`"March"`, `"2005"`) *are* text-addressable if you need a specific value.

5. **"Run All Tests" scanned every YAML** and choked on `.yarnrc.yml`
   (`Either 'url' or 'appId' must be specified`). Fix: a `config.yaml` that scopes
   Maestro to the numbered suite folders only (present at repo root and in `.maestro/`).
   Helpers in `helpers/` are sub-flows (called via `runFlow`), excluded from the run set.

## 5. Onboarding helper (skip if already onboarded)

`helpers/complete-onboarding.yaml` launches **without** clearing state and only runs
onboarding when the app is still on Welcome:

```yaml
- launchApp
- extendedWaitUntil: { visible: "Reentry Roadmap|My Path", timeout: 40000 }
- runFlow: { when: { visible: "Reentry Roadmap" }, file: do-onboarding-from-welcome.yaml }
- assertVisible: "My Path"
```

A returning (already-onboarded) user lands straight on My Path and skips onboarding.
Onboarding-specific suites still use `clearState: true` (via `reach-step1`) to get a
fresh account every time.

## 6. Run

```bash
bash run-maestro.sh                       # everything (scoped by config.yaml)
bash run-maestro.sh .maestro/07-bottom-tabs   # one folder
```

Requires: booted simulator with the app installed, **Metro running** (debug build).
In Maestro Studio, open the whole project; the root `config.yaml` keeps "Run All"
from touching non-test YAMLs.

## 7. Report & iterate

`.maestro/report.md` buckets every case: **Converted / Needs a quick check / Test by
hand / Out of scope**, with a "details we used — please confirm" table of the real
backend values. Work the "Needs a quick check" items, re-run, done.

---

## Known-good backend values (this app's data, read-only lookups)

| Purpose | Value |
|---|---|
| No-local-areas state (onboarding) | California (row 6 → `37%, 73%`) |
| Has-local-areas state + area | Texas → Dallas (needs scroll); Alabama is row 1 but has no actual areas |
| Step-2 goals picked | Acamedics, Transportation |
| Goal with tasks | Acamedics → task "Undergrad"; Transportation → "Task 1" |
| Goal with no tasks | Housing (also Employment & Career) |
| Task with no resources | Transportation → "Task 3" |
| Resource types on Undergrad | hotline "Call 1234", website "Open Website" |
| Mixed resources | Transportation → "Task 1" (website, video, text) |
| Resources-tab category | Important Documents (also Hotlines) |
| Directory (California profile) | California Reentry Resource Directory |
| Deep-link scheme | `nexpath://` |

## Open items (not yet green-verified here)

- The California-coordinate → My Path → tasks chain is **designed and partially
  verified** (dropdown coordinate mechanism confirmed by calibration; Welcome/Step 1
  render confirmed; row-merge confirmed), but a full end-to-end green run was blocked
  by repeated iOS-driver-startup flakiness. Re-run with `MAESTRO_DRIVER_STARTUP_TIMEOUT`
  set and the app+Metro warm.
- Row-tap selectors across the suite flows still need the partial-pattern pass
  (`"Name.*"`) described in §4.3.
