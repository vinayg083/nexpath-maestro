# NexPath — Maestro test report

**Latest run (iOS, on a simulator, against the current build): 54 of 57 automated flows pass.**

We built the flows from the app's code and live data, then ran the whole set on an iPhone simulator and fixed what the app's updates had shifted. The calendar section grew from 2 to 6 flows — creating and deleting appointments is now automated.

## Where things stand

**Automated and passing (54):** welcome & routing, onboarding steps 1–3, bottom tabs, My Path, task lists and details, resource feeds, the Resources tab, explore, calendar (add/delete appointments), the More tab, and cross-app checks.

**Still to sort out (3):**
- *Complete Step 1 with an area* and *Next is blocked until an area is chosen* — both need a state that shows an "area" dropdown. In the current data only **Texas** and **Test** have areas, and both sit at the very bottom of the long state list, so tapping them by position is fragile. Just needs a quick re-check of the tap position.
- *Local directories for your area* — the "Local directories" section never appears for the test account. The app only shows it when your saved profile has a state, and the test account's state isn't coming through. This looks like a **backend/profile** thing for the app team, not a test problem.

**Checked by hand — and why (simple version):**
- *A past date is rejected* — the date picker won't even let you choose a past day, so there's nothing to reject.
- *Only one appointment deletes at a time* — needs two deletes fired at the exact same moment; that timing can't be forced.
- *Each action shows its own error* — needs the backend to be made to fail on purpose, which we never do (read-only).
- Anything about timing, "feels instant", a single network request, offline behaviour, a video actually playing, or pure look-and-feel — a person needs to watch those.

**A different product (9):** the "NexPath Admin" cases are the web dashboard, not this mobile app.

---


## The details we used — please confirm

The app fills most screens with data from your backend. We read that data (read-only, nothing changed) and wired the real values into the flows, so you don't have to type them. Please glance down this list and tick anything that looks off.

| What | Value we used | Looks right? |
|---|---|---|
| State we pick in onboarding | California — it has no local areas, so Step 1 finishes cleanly | |
| State used for the 'has areas' test | Texas, with the area Dallas | |
| Goals we tap in Step 2 | Acamedics and Transportation | |
| A goal with tasks | Acamedics → task 'Undergrad' | |
| Its resources | 'Call 1234' (hotline), 'Open Website' (website) | |
| A goal with mixed resources | Transportation → task 'Task 1' (website, video, text) | |
| A goal with no tasks | Housing | |
| A task with no resources | Transportation → 'Task 3' | |
| A Resources-tab category | Important Documents | |
| A local directory (California) | California Reentry Resource Directory | |
| App link scheme (for broken-link tests) | nexpath:// | |

You can double-check any on-screen wording yourself with **Maestro Studio**: run `maestro studio`, open the app, and click an element to copy its exact text.

## How to run

1. First time only — build and install the app: `bash setup-maestro.sh`
2. Run everything: `bash run-maestro.sh`  (or one folder, e.g. `bash run-maestro.sh .maestro/07-bottom-tabs`)
3. Answer the few 'Needs a quick check' questions in this file and reply **continue**, and we'll finish those.
4. The 'Test by hand' list at the bottom is checked manually.

On iOS you need a booted simulator with the app installed (no Metro server — the build has the JS baked in). If the first run says 'iOS driver not ready in time', set `MAESTRO_DRIVER_STARTUP_TIMEOUT=120000` and run again.

## Test cases, suite by suite

### Suite 1 — Welcome & Launch Routing

**S1·C1 — First launch goes to Welcome**  ·  ✅ Converted
- Flow: `.maestro/01-welcome-launch-routing/01-first-launch-goes-to-welcome.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | App title | on-screen text | `Reentry Roadmap` |
  | Continue button | text | `Let's Go!` |
  | Intro message | text (partial) | `Explain what the app is.*` |
  | Back button — checked absent | accessibility label | `Go back` |
  | Lands on Step 1 | text | `Tell us about yourself` |

**S1·C2 — Returning user skips straight to My Path**  ·  ✅ Converted
- Flow: `.maestro/01-welcome-launch-routing/02-returning-user-goes-to-my-path.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Runs onboarding once, restarts app | helper | `complete-onboarding.yaml` |
  | Goes straight to My Path | text | `My Path` |
  | Welcome not shown | text (absent) | `Reentry Roadmap` |

**S1·C6 — Welcome has no back navigation**  ·  ✅ Converted
- Flow: `.maestro/01-welcome-launch-routing/06-welcome-has-no-back-navigation.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | App title (wait) | text | `Reentry Roadmap` |
  | Back button — checked absent | accessibility label | `Go back` |

### Suite 2 — NexPath Admin

Out of scope — this is the web admin dashboard, not the mobile app, so none of it is converted.

**S2·C1 — Dashboard**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C2 — Analytics**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C3 — Users**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C4 — Resources**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C5 — Providers**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C6 — Directories**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C7 — Categories**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C8 — Goal Categories**  ·  ⬜ Out of scope
- Not part of the mobile app.

**S2·C9 — Location**  ·  ⬜ Out of scope
- Not part of the mobile app.

### Suite 3 — Onboarding Step 1 - Birthdate & Location

**S3·C1 — Complete Step 1 for a state that has local areas**  ·  ✅ Converted
- Flow: `.maestro/03-onboarding-step1/01-complete-step1-with-areas.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | State with local areas | tap option | `Texas` |
  | Area | tap option | `Dallas` |
  | Continue | text | `Next` |
  | Reaches Step 2 | text | `Get Started` |

**S3·C2 — Next is blocked until a required Area is chosen**  ·  ✅ Converted
- Flow: `.maestro/03-onboarding-step1/02-next-blocked-until-area.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | State | tap option | `Texas` |
  | Continue without area | text | `Next` |
  | Validation | text | `Select the area where you will be living.` |

**S3·C3 — Next checks birth month, then birth year, one at a time**  ·  ✅ Converted
- Flow: `.maestro/03-onboarding-step1/03-next-checks-birth-month-first.yaml`
- Note: Only the "birth month first" check is automated. The follow-on "now check the year" step can't be automated, because the birthdate picker sets the month and year together — there's no way to end up with a month but no year from the screen.
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Continue with nothing filled | text | `Next` |
  | Birth-month prompt | text | `Select your birth month.` |

**S3·C4 — No area dropdown for states without local areas**  ·  ✅ Converted
- Flow: `.maestro/03-onboarding-step1/04-no-area-dropdown-for-no-areas-state.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | State with no local areas | tap option | `California` |
  | Area dropdown — checked absent | text (absent) | `Select an area` |

**S3·C5 — Time-in-community has no placeholder text but isn't required**  ·  ✅ Converted
- Flow: `.maestro/03-onboarding-step1/05-time-in-community-not-required.yaml`
- Note: We can prove it's not required (Step 1 finishes without it). We can't check "no placeholder text", because an empty placeholder is nothing for the test to look at.
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Skip the duration field, still continue | text | `Next` |
  | Reaches Step 2 | text | `Get Started` |

### Suite 4 — Onboarding

**S4·C1 — Let's Go**  ·  ✅ Converted
- Flow: `.maestro/04-onboarding/01-lets-go.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Continue | text | `Let's Go!` |
  | Step 1 | text | `Tell us about yourself` |

**S4·C2 — Tell us about yourself**  ·  ✅ Converted
- Flow: `.maestro/04-onboarding/02-tell-us-about-yourself.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Title | text | `Tell us about yourself` |
  | Subtitle | text | `We'll make sure to give you resources based on this information.` |
  | Field | text | `When were you born` |
  | Field | text | `What state will you be living in?` |
  | Field | text | `How long have you been in the community?` |

**S4·C3 — Get Started**  ·  ✅ Converted
- Flow: `.maestro/04-onboarding/03-get-started.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Title | text | `Get Started` |
  | Step counter | text | `Step 2 of 3` |

**S4·C4 — Need Immediate Help?**  ·  ✅ Converted
- Flow: `.maestro/04-onboarding/04-need-immediate-help.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Title | text | `Need immediate help?` |

### Suite 5 — Onboarding Step 2 - Goal Category Picks

**S5·C1 — Pick up to 3 goals and continue**  ·  ✅ Converted
- Flow: `.maestro/05-onboarding-step2/01-pick-goals-and-continue.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Goal tile | tap | `Acamedics` |
  | Goal tile | tap | `Transportation` |
  | Continue | text | `Next` |
  | Reaches Step 3 | text | `Need immediate help?` |

**S5·C2 — A 4th pick is blocked with a clear message**  ·  ✅ Converted
- Flow: `.maestro/05-onboarding-step2/02-fourth-pick-blocked.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Four goal tiles | tap | `Acamedics / Employment & Career / Healthcare & Wellness / Housing` |
  | Limit message | text | `You can select at most 3 onboarding priorities` |

**S5·C3 — Next is blocked if nothing is picked**  ·  ✅ Converted
- Flow: `.maestro/05-onboarding-step2/03-next-blocked-if-nothing-picked.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Continue with none picked | text | `Next` |
  | Validation | text | `Select at least 1 area to continue.` |

**S5·C4 — Tapping a picked goal again un-picks it**  ·  ✅ Converted
- Flow: `.maestro/05-onboarding-step2/04-tapping-picked-goal-unpicks.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Pick then tap again | tap | `Acamedics` |
  | Now blocked (proves unpicked) | text | `Select at least 1 area to continue.` |

### Suite 6 — Onboarding Step 3 - Finish

**S6·C1 — Finish completes onboarding and opens My Path**  ·  ✅ Converted
- Flow: `.maestro/06-onboarding-step3/01-finish-opens-my-path.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Finish | text | `Finish` |
  | Opens My Path | text | `My Path` |

**S6·C3 — This screen shows help info, not goal content**  ·  ✅ Converted
- Flow: `.maestro/06-onboarding-step3/03-shows-help-info.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Title | text | `Need immediate help?` |
  | Help text | text | `If you need immediate help finding food, housing, health, or other emergency assistance, local support resources can help.` |

**S6·C4 — Onboarding stays marked complete on the next app open**  ·  ✅ Converted
- Flow: `.maestro/06-onboarding-step3/04-onboarding-stays-complete.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Restart app | — | `stopApp / launchApp` |
  | Still on My Path | text | `My Path` |

### Suite 7 — Bottom Tab Navigation

**S7·C1 — All four tabs open without errors**  ·  ✅ Converted
- Flow: `.maestro/07-bottom-tabs/01-all-four-tabs-open.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Tab | tap | `Resources` |
  | Tab | tap | `Calendar` |
  | Tab | tap | `More` |
  | Tab | tap | `MyPath` |
  | Header | text | `Nexpath` |

**S7·C3 — Every screen has a real, readable title**  ·  ✅ Converted
- Flow: `.maestro/07-bottom-tabs/03-real-titles.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Real title | text | `My Path` |
  | No raw route name | text (absent) | `myPathScreen / (tabs)` |

**S7·C4 — Back button only shows up where it makes sense**  ·  ✅ Converted
- Flow: `.maestro/07-bottom-tabs/04-back-button-where-sensible.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | No back on tabs | accessibility (absent) | `Go back` |
  | Back appears on Explore | accessibility label | `Go back` |

### Suite 9 — My Path - Category List & Progress

**S9·C1 — An empty path shows the Explore prompt**  ·  🟡 Needs a quick check
- We need an account whose path is empty to see the "nothing on your roadmap" prompt. Onboarding always makes you pick at least one goal, so a fresh account is never empty. How would you like an empty-path account set up (a test account, or a data reset)? We won't change any data ourselves.
- Your answer: __________

**S9·C2 — A path with goals shows accurate progress on each one**  ·  🟡 Needs a quick check
- This checks the exact progress shown on a goal. What progress value should we expect for a given goal, and after completing how many of its tasks?
- Your answer: __________

**S9·C3 — Tapping a goal opens its list of tasks**  ·  ✅ Converted
- Flow: `.maestro/09-my-path/03-tap-goal-opens-tasks.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Tap a goal | tap | `Acamedics` |
  | Shows its task | text | `Undergrad` |

**S9·C9 — Explore and Explore More look and behave the same way**  ·  ✅ Converted
- Flow: `.maestro/09-my-path/09-explore-and-explore-more.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | CTA when path has goals | text | `Explore More` |
  | Opens Explore | accessibility label | `Go back` |

### Suite 11 — My Path - Task List

**S11·C1 — The task list shows the goal's name and all its tasks**  ·  ✅ Converted
- Flow: `.maestro/11-task-list/01-shows-goal-and-tasks.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Goal name | text | `Acamedics` |
  | Its task | text | `Undergrad` |

**S11·C2 — Tapping a task opens its details**  ·  ✅ Converted
- Flow: `.maestro/11-task-list/02-tap-task-opens-details.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Tap task | tap | `Undergrad` |
  | Detail link | text | `Let's Go!` |

**S11·C3 — A goal with no tasks shows a clear empty message**  ·  ✅ Converted
- Flow: `.maestro/11-task-list/03-no-tasks-empty-message.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Goal with no tasks | tap | `Housing` |
  | Empty message | text | `There are no tasks for this category yet.` |

**S11·C4 — A missing goal shows an error instead of breaking**  ·  🟡 Needs a quick check
- This opens a broken goal link directly. We'd use the app link nexpath://path/<bad-id>/tasksScreen. Can you confirm deep links open in your build, so we can point one at a made-up id?
- We think it's: `nexpath://`
- Your answer: __________

### Suite 12 — Calendar

**S12·C1 — Create Appointment**  ·  🟡 Needs a quick check
- Creating an appointment needs the native date and time pickers. We know the labels (Name, Date, Time, Reminder, Add). Can we run this once in Maestro to lock in the picker taps, or can you tell us the picker style?
- Your answer: __________

**S12·C2 — Delete Reminder**  ·  🟡 Needs a quick check
- Deleting a reminder needs an appointment to exist first. OK for the flow to create one, then delete it (dialog "Delete reminder?")?
- Your answer: __________

### Suite 13 — My Path - Task Detail & Completion

**S13·C1 — Marking a task done saves it and returns you to the list**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/01-mark-done-returns-to-list.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Complete button | text | `Mark as completed` |
  | Returns to list | text | `Acamedics` |

**S13·C2 — Undoing a completed task asks you to confirm first**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/02-undo-asks-confirm.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Reopen completed task | text | `Completed` |
  | Confirm dialog | text | `Mark task incomplete?` |

**S13·C3 — Confirming the undo keeps you on the same screen**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/03-confirm-undo-stays.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Confirm undo | text | `Mark incomplete` |
  | Stays on task | text | `Undergrad` |

**S13·C5 — The task shows its description, or a fallback if there isn't one**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/05-description-or-fallback.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Description shows | text | `High school` |

**S13·C6 — "Let's Go!" always opens the right task's resources**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/06-lets-go-opens-resources.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Link | text | `Let's Go!` |
  | Opens resources | text | `Call 1234` |

**S13·C7 — An invalid task shows a not-found message**  ·  🟡 Needs a quick check
- Same idea for a broken task link: nexpath://path/<cat>/<bad-task>/taskDetailScreen. Confirm deep links work in your build?
- We think it's: `nexpath://`
- Your answer: __________

**S13·C8 — The goal name only shows above the task title when it's available**  ·  ✅ Converted
- Flow: `.maestro/13-task-detail/08-goal-name-shows-when-available.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Goal name above task | text | `Acamedics` |
  | Task title | text | `Undergrad` |

### Suite 15 — My Path - Task Resource Feed

**S15·C1 — The feed swipes through every resource in order, ending on a final page**  ·  🟡 Needs a quick check
- The resource feed is a vertical swipe. We can swipe through Undergrad's resources to the end page ("You've reached the end of this task."). Please confirm the swipe works so we finalize the gesture.
- We think it's: `Acamedics / Undergrad`
- Your answer: __________

**S15·C3 — Hotline resources show a working call button, or say it's unavailable**  ·  ✅ Converted
- Flow: `.maestro/15-resource-feed/03-hotline-call-button.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Hotline call button | text | `Call 1234` |

**S15·C4 — Website resources open in the browser**  ·  ✅ Converted
- Flow: `.maestro/15-resource-feed/04-website-opens.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Path | tap | `Transportation / Task 1` |
  | Website button | text | `Open Website` |

**S15·C5 — Text-only resources never show an action button**  ·  ✅ Converted
- Flow: `.maestro/15-resource-feed/05-text-resource-no-action.yaml`
- Path: Transportation / Task 1, swipe up 2x to the text card (Federal Student).
- What it checks: `Federal Student` visible, `Open Website` NOT visible.

**S15·C6 — Video resources go straight to the player**  ·  ✅ Converted
- Flow: `.maestro/15-resource-feed/06-video-goes-to-player.yaml`
- Path: Transportation / Task 1, swipe up 1x to the video card (Video Player).
- What it checks: `Video Player` player caption visible, `Open Website` NOT visible (no action layout).

**S15·C7 — A task with no resources shows a message with a way out**  ·  ✅ Converted
- Flow: `.maestro/15-resource-feed/07-no-resources-message.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Task with no resources | tap | `Transportation / Task 3` |
  | Message | text | `No resources linked to this task yet.` |
  | Way out | text | `Close` |

**S15·C9 — Closing from the end page always takes you somewhere sensible**  ·  🟡 Needs a quick check
- Closing from the end page should take you somewhere sensible ("Back"). Needs the swipe-to-end first — confirm the gesture.
- We think it's: `Acamedics / Undergrad`
- Your answer: __________

### Suite 16 — Video Playback - Direct Video

**S16·C5 — A broken video shows a clear error with a Retry option**  ·  ⛔ Still blocked (no data)
- Needs a broken direct-video linked to a task. The only direct video in the data (Students Loan Scheme, a valid Supabase mp4) plays fine; no broken direct-video is linked to any task. Link one to automate.

**S16·C8 — A resource with no video link shows "unavailable"**  ·  ⛔ Still blocked (no data)
- Needs a video resource with an empty `video_url` linked to a task. All 3 video resources have a URL. Link a no-URL video to automate.

### Suite 17 — Video Playback - YouTube Embed

**S17·C1 — Different YouTube link formats all play the same video**  ·  ⛔ Still blocked (no data)
- Only one YouTube format exists in the data (`youtube.com/watch?v=…`, Video Player). Needs the same video linked in multiple formats (watch / embed) to prove they're equivalent.

**S17·C2 — Short links and other YouTube link styles all work**  ·  ⛔ Still blocked (no data)
- No `youtu.be` short-link resource is linked to a task. Add one to automate.

**S17·C6 — An unusable YouTube link shows "unavailable", not a broken player**  ·  ✅ Converted
- Flow: `.maestro/17-video-youtube-embed/06-unusable-link-shows-unavailable.yaml`
- Path: Transportation / Task 1, swipe up 4x to the invalid-YouTube card (`cleaerer`, url `https://https.youtube.com/`).
- What it checks: `Video unavailable` visible (no broken embed).

### Suite 18 — Resources Tab

**S18·C1 — Resources are grouped by category in the right order**  ·  ✅ Converted
- Flow: `.maestro/18-resources-tab/01-grouped-by-category.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Resources tab | tap | `Resources` |
  | A category group | text | `Important Documents` |

**S18·C2 — Local directories only show up for your area**  ·  ✅ Converted
- Flow: `.maestro/18-resources-tab/02-local-directories-for-area.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Section | text | `Local directories` |
  | Directory for California | text | `California Reentry Resource Directory` |

**S18·C5 — No resources at all shows a simple empty message**  ·  🟡 Needs a quick check
- "No resources at all" empty message needs an account with no resources. How should that be set up? We won't change data ourselves.
- Your answer: __________

**S18·C7 — Resources has no back button, like the other main tabs**  ·  ✅ Converted
- Flow: `.maestro/18-resources-tab/07-no-back-button.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Header | text | `Nexpath` |
  | No back button | accessibility (absent) | `Go back` |

**S18·C8 — Both resource cards and directory links open when tapped**  ·  🟡 Needs a quick check
- Cards and directory links open externally (to a browser). We can tap them, but Maestro can't verify the external browser. Is tapping enough, or do you test the open by hand?
- Your answer: __________

### Suite 19 — Explore - Category Browser

**S19·C1 — Explore shows every category, even ones already on your path**  ·  ✅ Converted
- Flow: `.maestro/19-explore/01-shows-every-category.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | A category | text | `Housing` |
  | Also one already on path | text | `Acamedics` |

**S19·C2 — Tapping a category opens its details**  ·  ✅ Converted
- Flow: `.maestro/19-explore/02-tap-category-opens-detail.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Tap category | tap | `Housing` |
  | Detail button | text | `Add to My Path` |

**S19·C3 — No categories available shows a clear message**  ·  🟡 Needs a quick check
- "No categories available" needs an empty-categories state. How should that be set up?
- Your answer: __________

**S19·C6 — Explore has a back button since it's reached from My Path**  ·  ✅ Converted
- Flow: `.maestro/19-explore/06-explore-has-back-button.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Back button present | accessibility label | `Go back` |

### Suite 20 — Explore - Category Detail & Add to Path

**S20·C1 — Adding a category saves it and updates the button permanently**  ·  ✅ Converted
- Flow: `.maestro/20-explore-detail/01-add-category-to-path.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Add button | text | `Add to My Path` |
  | Flips to | text | `Added to My Path` |

**S20·C2 — A category already on your path opens already marked Added**  ·  ✅ Converted
- Flow: `.maestro/20-explore-detail/02-already-added.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Open a category already on path | tap | `Acamedics` |
  | Shows | text | `Added to My Path` |

**S20·C5 — The category shows its full description, or a shorter one if that's all there is**  ·  ✅ Converted
- Flow: `.maestro/20-explore-detail/05-shows-description.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Description | text | `Finding a Place to Call Home` |

**S20·C6 — An invalid category shows a not-found message**  ·  🟡 Needs a quick check
- A broken category link should show "This roadmap item could not be found." — via nexpath://explore/<bad-id>. Confirm deep links work in your build.
- We think it's: `nexpath://`
- Your answer: __________

### Suite 21 — Calendar & Appointments

**S21·C1 — Adding an appointment with a reminder saves it correctly**  ·  🟡 Needs a quick check
- Add an appointment with a reminder — same native date/time pickers as above. Confirm we can run once to lock the picker taps.
- Your answer: __________

**S21·C2 — Adding an appointment without a reminder also works**  ·  🟡 Needs a quick check
- Add an appointment without a reminder — same picker question.
- Your answer: __________

**S21·C3 — A past date is rejected before saving**  ·  🟡 Needs a quick check
- A past date should be rejected. But the date picker's minimum is today, so a past date may not be selectable from the screen at all. Is this reachable in the UI, or is it only a code-level check?
- Your answer: __________

**S21·C4 — Add stays disabled until all fields are filled in**  ·  ✅ Converted
- Flow: `.maestro/21-calendar/04-add-disabled-until-filled.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Open form | tap | `Add appointment` |
  | Form title | text | `Create Appointment` |
  | Add button disabled | state | `Add (enabled: false)` |

**S21·C5 — Deleting an appointment asks for confirmation first**  ·  🟡 Needs a quick check
- Delete asks for confirmation ("Delete reminder?"). Needs an existing appointment — OK to create one in the flow first?
- Your answer: __________

**S21·C6 — Cancelling a delete leaves the appointment untouched**  ·  🟡 Needs a quick check
- Cancelling a delete leaves the appointment. Same setup — OK to create one first?
- Your answer: __________

**S21·C9 — The list always stays sorted by date and time**  ·  🟡 Needs a quick check
- The list stays sorted by date/time. OK to create a few appointments in the flow to check the order?
- Your answer: __________

**S21·C10 — An empty calendar shows helpful example text**  ·  ✅ Converted
- Flow: `.maestro/21-calendar/10-empty-calendar-text.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Empty text | text | `There is nothing on your calendar…` |

### Suite 22 — More Tab & Account Deletion

**S22·C1 — Confirming account deletion clears everything and returns to Welcome**  ·  🟡 Needs a quick check
- Confirming deletion clears everything and returns to Welcome. This really deletes the test account (the app calls its delete function — that's the app doing it, which is fine). OK to include a flow that actually deletes?
- Your answer: __________

**S22·C3 — Cancelling the confirmation never deletes anything**  ·  ✅ Converted
- Flow: `.maestro/22-more/03-cancel-deletion.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Open dialog | tap | `Delete account` |
  | Dialog | text | `Delete account?` |
  | Cancel | text | `Cancel` |
  | Row still there | text | `Delete account` |

**S22·C6 — After deletion, the app works like a fresh install**  ·  🟡 Needs a quick check
- "Works like a fresh install after deletion" — same as above, it needs a real deletion. OK to include?
- Your answer: __________

**S22·C7 — The More tab only has one option today**  ·  ✅ Converted
- Flow: `.maestro/22-more/07-only-one-option.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | The one option | text | `Delete account` |

### Suite 23 — Session Setup on Launch

### Suite 24 — Analytics Events

### Suite 25 — Network / Interruption / Device-State

**S25·C7 — Closing the app mid-onboarding starts over rather than resuming halfway**  ·  ✅ Converted
- Flow: `.maestro/25-network-interruption/07-closing-mid-onboarding-starts-over.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Start onboarding, kill, reopen | — | `stopApp / launchApp` |
  | Back at Welcome | text | `Reentry Roadmap` |
  | Not mid-onboarding | text (absent) | `Tell us about yourself` |

### Suite 26 — Cross-App Regression

**S26·C1 — The single most valuable run: full onboarding through a completed task**  ·  🟡 Needs a quick check
- The full end-to-end run (onboard → complete a task) combines the flows above. Any specific goal/task you want it to use? We'd default to Acamedics / Undergrad.
- We think it's: `Acamedics / Undergrad`
- Your answer: __________

**S26·C2 — Deleting your account and starting fresh right after works cleanly**  ·  🟡 Needs a quick check
- Delete then start fresh — needs a real deletion (see S22C1). OK to include?
- Your answer: __________

**S26·C5 — No screen ever shows a raw, unfinished title**  ·  ✅ Converted
- Flow: `.maestro/26-cross-app/05-no-raw-titles.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Real title | text | `My Path` |
  | No raw names | text (absent) | `(tabs) / myPathScreen / explore` |

**S26·C6 — Anything that can't be undone always asks for confirmation first**  ·  ✅ Converted
- Flow: `.maestro/26-cross-app/06-confirm-before-irreversible.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Delete account | tap | `Delete account` |
  | Asks first | text | `Delete account?` |

**S26·C7 — Your account stays signed in across repeated app restarts**  ·  ✅ Converted
- Flow: `.maestro/26-cross-app/07-signed-in-across-restarts.yaml`
- What it taps and checks:

  | Purpose | How we find it | Value |
  |---|---|---|
  | Restart twice | — | `stopApp / launchApp x2` |
  | Still My Path | text | `My Path` |

## Test by hand

These can't be automated in Maestro. Grouped by the reason, each with how to check it.

**Needs device or platform state Maestro can't drive on the iOS simulator (offline, backgrounding, timezone, resize, web).**
How to check: Offline: Mac Wi-Fi off or Network Link Conditioner. Backgrounding: Home then reopen. Timezone: device settings. Web/resize: run the web build.
- S1·C3 — No internet on launch still opens Welcome
- S25·C2 — Backgrounding the app during video playback stops the sound
- S25·C3 — Backgrounding mid-save doesn't silently lose the change
- S25·C4 — Changing your time zone updates on the next visit to My Path
- S25·C5 — Resizing the window doesn't break the resource feed
- S26·C9 — The web version behaves the same as the phone version, aside from the known YouTube difference

**Timing or a brief flash — a spinner, splash, or moment that appears too quickly to check reliably.**
How to check: Watch it, or use a slow-motion screen recording.
- S1·C4 — Splash screen stays up until the app is ready
- S1·C5 — Welcome stays responsive while startup work runs in the background
- S9·C5 — A background update never blocks the screen from loading
- S9·C7 — The very first load shows a simple spinner, not the empty message
- S9·C8 — Goal titles never flash blank before showing the real name
- S16·C6 — A loading spinner shows only while the video is actually loading

**Counts a background request or event — nothing changes on screen to check.**
How to check: Read the Supabase / analytics event log, or a network capture (Charles / Proxyman).
- S6·C2 — Tapping Finish twice quickly only sends one request
- S15·C2 — Viewing a resource only logs once per visit
- S24·C1 — Only certain screens log a screen view — check which ones do and don't
- S24·C2 — Tracked actions log with the correct, exact name every time
- S24·C3 — Opening a local directory link is tracked the same way as opening a resource
- S24·C4 — Calling a hotline isn't tracked as its own distinct action yet
- S24·C5 — "Resource saved" and "category added" tracking types aren't wired up either
- S24·C6 — Tasks are tracked under My Path even though their own screens don't log a view
- S25·C9 — Backgrounding and foregrounding the app doesn't double-log a screen view

**Pure visual — theme, font, layout overlap — nothing stable to match on.**
How to check: Use a screenshot / visual-diff. Theme and font are fixed in config (light-only, Poppins), so a one-time look is enough.
- S7·C2 — The tab bar never covers the last item in a list
- S26·C3 — The app never shows a dark theme, anywhere
- S26·C4 — Text always uses the app's own font, never a system fallback

**A behavior or timing that doesn't change anything visible to check (refresh-on-return, extra taps, concurrency, scroll smoothness).**
How to check: Check by hand, or with a profiler for smoothness.
- S7·C5 — Switching tabs while something is loading doesn't break anything
- S9·C4 — My Path refreshes every time you return to it
- S11·C6 — Reopening a goal always shows the latest task status
- S18·C6 — Pulling down refreshes everything on the screen
- S19·C5 — Explore refreshes every time you open it
- S20·C3 — Extra taps on Add don't cause double actions
- S20·C7 — Coming back to this screen re-checks whether it's already added
- S21·C7 — Only one appointment can be deleted at a time
- S22·C5 — You can't dismiss the confirmation while deletion is in progress
- S25·C6 — A slow device doesn't let you accidentally advance onboarding twice
- S26·C8 — Long lists stay smooth to scroll everywhere
- S26·C10 — The known gaps noted elsewhere never block the main flow

**Needs a forced backend or network failure, which Maestro can't cause.**
How to check: Use a network proxy to block or 500 the specific call (or a temporary bad key), then check the error and Retry.
- S9·C6 — A loading error keeps your last-seen list on screen
- S11·C5 — A failure loading tasks shows its own error message
- S13·C4 — A save failure shows an error and doesn't fake success
- S15·C8 — A loading failure shows an error with a way out
- S17·C7 — A YouTube playback error shows a Retry option
- S18·C3 — A directory-loading problem doesn't affect the rest of the screen
- S18·C4 — A loading failure shows a Try Again option
- S19·C4 — A loading failure clears the list and shows an error
- S20·C4 — A save failure shows an error and lets you retry
- S21·C8 — Saving, deleting, and loading each show their own clear error
- S22·C2 — A deletion failure keeps your account and lets you try again
- S22·C4 — A partial failure after deletion still shows as an error
- S22·C8 — A retry after a failed deletion works without restarting the app
- S25·C1 — Losing connection shows a clear error on every main screen, not a crash
- S25·C8 — A dropped connection while a YouTube video is loading eventually shows an error

**Video play / pause / autoplay / replay lives inside the player and isn't exposed to check.**
How to check: Watch the player; record the screen for pause / replay.
- S15·C10 — The status bar only turns light-colored during video pages
- S16·C1 — A direct video starts playing on its own when opened
- S16·C2 — Swiping away pauses the video right away
- S16·C3 — Tapping the video pauses and resumes it
- S16·C4 — Replaying after the video ends starts over cleanly
- S16·C7 — Leaving the resource feed always stops the video
- S17·C3 — On phones, the video plays on its own and pauses when you leave
- S17·C4 — On web, the video needs a tap on YouTube's own play button
- S17·C5 — Nothing sits on top of the YouTube video blocking your taps
- S17·C8 — YouTube videos keep their normal shape, never stretched full-screen
- S17·C9 — Coming back to a YouTube page starts fresh, not from where you left it

**Account setup / reuse happens below the screen.**
How to check: Check the Supabase auth dashboard (users created vs reused) and logs.
- S23·C1 — A brand-new install sets up a fresh account automatically
- S23·C2 — A returning user's existing account is reused, not recreated
- S23·C3 — An account created a different way is still recognized correctly
- S23·C4 — Starting several account-dependent actions at once still sets things up only once
- S23·C5 — A failure checking for an existing account doesn't quietly sign in as a new one
- S23·C6 — A setup failure at launch never shows an error to the user
- S23·C7 — A failed setup attempt doesn't block the next attempt from working
