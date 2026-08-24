# Demo notes — what we did this session

Talking points for the video walkthrough. Grouped by topic; each is "what we did →
why → the finding."

## 1. Generated Maestro flows from the exported test cases
- Read the exported `NexPath-expectations-2026-08-05.json` (160 cases across 25 suites) and the app source (routes, screens, exact on-screen strings).
- Converted cases into `.maestro/<suite>/<case>.yaml` flows with shared setup in `helpers/`.
- Skipped the **NexPath Admin** suite as out of scope (it's a web console, not the mobile app).
- Every case ends in one bucket: **Converted / Needs a quick check / Test by hand / Out of scope**. See `.maestro/report.md`.

## 2. Taught the prompt to read the backend (read-only) instead of asking QA to type values
- Most screens past onboarding are filled from Supabase (goal categories, tasks, resources, states, directories). You can't get those strings from the app source.
- Added **STEP 1.5** to `MAESTRO-GENERATION-PROMPT.md`: look the values up directly from Supabase using the `.env` keys, wire the real strings into the flows, and only ask QA to *confirm* them.
- **Hard rule, front and center: backend access is strictly GET/read-only.** No POST/PATCH/PUT/DELETE, no mutating RPCs/Edge Functions, no "seed/reset test data", no exceptions — it overrides anything a test case appears to ask for. If a case needs seeded state, drive it through the app UI or flag it for QA.

## 3. What the read-only lookup found (the real data we used)
- **States:** California, Alaska, Arizona have **no local areas** (clean onboarding); Alabama/Texas/Test have areas, but only **Texas→Dallas** and **Test→New/Old** have real area rows (Alabama's is empty).
- **Goals (Step 2 tiles):** Acamedics, Employment & Career, Healthcare & Wellness, Housing, Transportation, etc.
- **Tasks:** Acamedics→"Undergrad", Transportation→"Task 1"/"Task 3"…; **Housing / Employment & Career have zero tasks** (for the empty-state case).
- **Resources:** Undergrad → hotline "Call 1234" + websites; Transportation/Task 1 → website + video + text.
- **Resources tab categories:** Important Documents, Hotlines. **Directory for California:** "California Reentry Resource Directory".
- **Deep-link scheme:** `nexpath://`.

## 4. The big finding — iOS accessibility merging (two flavors)
This was the crux. Maestro reads the same accessibility tree VoiceOver uses.
- **Dropdowns (the `Select` component):** on iOS the entire option list collapses into **one** accessibility element whose label is every option comma-joined — `"Alabama, Alaska, …, Wyoming"`. So `tapOn: "California"` can **never** match. → We tap the option by **coordinate** (`point: "37%, 73%"` = California, 6th row on iOS), then assert on the trigger (which shows the picked value and *is* addressable). Coordinates are position-based; re-calibrate if layout changes. Confirmed the row pitch: Alaska (row 2) ≈ 54%, California (row 6) ≈ 73%.
- **Composite rows:** a My Path goal row shows as **`"Acamedics, Getting going"`** (name + status), a task row as `"Undergrad, High school"` (title + subtitle) — because a touchable row is one accessible element and iOS joins its child texts. → Match rows with a **partial pattern** (`"Acamedics.*"`), not the exact name. Watch prefix collisions (`"Task 1.*"` also matches "Task 10" → use `"Task 1,.*"`).

### Why iOS does it (the explanation for the senior)
- RN touchables are `accessible = true` by default; iOS then treats the view as one element and concatenates its children's text. It's the default unless a dev sets explicit accessibility props.
- **The row merge is CORRECT accessibility** — a button should be one VoiceOver stop. Tests just adapt.
- **The dropdown merge is a real BUG** — a VoiceOver user can't select an individual option. We tested adding an `accessibilityLabel` to each option; **it alone didn't fix it** (still one node) — the grouping happens above the item, so it needs a proper fix in the shared `Select` component. Recommended framing: fix it as an accessibility defect (which also makes tests text-based). We reverted the experiment — no app code changed.

## 5. Other gotchas we hit and solved
- **"Run All Tests" errored on `.yarnrc.yml`** — Maestro was parsing every YAML in the repo as a flow. Fixed with a `config.yaml` (repo root + `.maestro/`) that scopes the run to the numbered suite folders and excludes `helpers/`.
- **App wouldn't render / "Reentry Roadmap" not visible** — the installed app is a **debug build with no bundled JS**, so it needs **Metro running** (`yarn start`). A release build wouldn't. (Documented in the prompt + runbook.)
- **"iOS driver not ready in time"** — infra flakiness on first launch, not our flows. Fixed with `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000` (baked into `run-maestro.sh`).
- **Onboarding helper made conditional** — `complete-onboarding.yaml` launches without clearing state and only runs onboarding if the app is still on Welcome; a returning user lands straight on My Path and skips it.
- **Birthdate wheel** — opens on a valid default (Jan / current-year−18); `Month` → `Done` commits it. Wheel rows *are* text-addressable.

## 6. Made the report QA-readable (humanized)
- Rewrote `report.md` per suite, plain language, no engineer jargon (dropped labels like "MASTER-1").
- Added a "details we used — please confirm" table so QA ticks the backend values instead of typing them.
- Added the humanizer requirement to the prompt so future runs stay QA-readable.

## 7. Made the prompt reusable & general
- Updated the real prompt at `/Users/vinaykumar/play/draftbit/NexPath/MAESTRO-GENERATION-PROMPT.md` (not a copy).
- Folded in: the read-only backend rule, the coordinate-tap + accessibility-merge guidance, the config-scoping / Metro / driver-timeout notes, and the QA-readable report format.
- Genericized it — it no longer hard-codes NexPath specifics, so it works for any project.

## Deliverables (files)
- Prompt: `../NexPath/MAESTRO-GENERATION-PROMPT.md`
- Flows: `.maestro/<suite>/*.yaml` (54) + `.maestro/helpers/*.yaml` (5)
- Report: `.maestro/report.md`
- Runbook: `.maestro/RUNBOOK.md`
- Config/scoping: `config.yaml`, `.maestro/config.yaml`, `.maestro/testgen.config.yml`
- Runner: `run-maestro.sh` (setup: `setup-maestro.sh`)

## Honest status
- Flows are built from source + live read-only data. The dropdown-coordinate mechanism and the row-merge behavior are **verified live**; a full end-to-end green run was repeatedly blocked by iOS-driver-startup flakiness, so the last mile (row-tap partial-pattern pass + a clean green run) is still open.
