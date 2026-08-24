# Set up and run the Maestro tests

This gets the app's automated UI tests running on your Mac. Follow it top to bottom.
Steps 1 to 5 set the machine up, and you only do them once. After that you just
build when the app changes and run the tests whenever you want.

You do not need to understand the app or write any code. If a step fails, go to
"If something goes wrong" at the bottom. It lists the fix for each common problem.

Maestro is the tool that taps through the app and checks each screen the way a
person would, only automatically.

---

## Before you start

- A Mac.
- For iPhone tests: Xcode, and an iPhone simulator (comes with Xcode).
- For Android tests: Android Studio, with one emulator (virtual phone) created.
- The project folder on your machine.
- The project's `.env` file. Ask a developer for it. The app will not start without it.
- The exported test-cases file (its name ends in `...expectations....json`).

You can do just iPhone, just Android, or both. Build the one you want.

---

## Step 1 — Add two files to the project folder

Put the two files below at the top level of the project root folder, right next to
`package.json` (not in any sub-folder):

1. The `.env` file (from a developer).
2. The test-cases file (the `...expectations....json`).

That is the only file work you do by hand.

---

## Step 2 — Let the AI check the project is ready

Open your AI coding tool inside the project folder and paste in all of
`PROJECT-SETUP-PROMPT.md`.

It checks the project and tells you in plain words whether everything is in place:
the app id, your `.env`, and the test file. It also writes a small settings file the
tests need. If something is missing, fix that one thing and paste the prompt again.
Running it more than once is safe.

When it comes back all green, go to Step 3.

---

## Step 3 — Install Maestro (once per machine)

Open Terminal and run:

```bash
curl -fsSL https://get.maestro.mobile.dev | bash
```

When it finishes, close Terminal and open it again so the `maestro` command works.
Check it:

```bash
maestro --version
```

If that prints a version number, you are set.

---

## Step 4 — Install the app's packages (once)

Go into the project folder in Terminal and run:

```bash
yarn install
```

Wait for it to finish. This downloads everything the app is built from.

---

## Step 5 — Build the app onto the simulator (once, per platform)

This bakes everything into the build, so you do not need any server running while you
test. The first build takes a few minutes.

### iPhone

Open the iPhone simulator first (Xcode ▸ Open Developer Tool ▸ Simulator), then run:

```bash
yarn expo run:ios --configuration Release
```

### Android

Start your emulator (Android Studio ▸ Device Manager ▸ ▶), then run:

```bash
yarn expo run:android --variant release
```

(If this fails with "SDK location not found", see the note at the bottom. You add one
small file and re-run. Most of the time you won't hit this.)

The app opens on the simulator on its own. If it shows a real screen (not blank, not an
error box), the build worked.

---

## Step 6 — Generate the tests

Open your AI tool inside the project again, turn web access on (so it can check the
Maestro docs if it needs to), and paste in all of `MAESTRO-GENERATION-PROMPT.md`.

It reads the app to find the real words on each screen, writes the tests into the
`.maestro` folder, and tells you when a step genuinely cannot be automated instead of
guessing. When it is done it points you to `.maestro/report.md`.

---

## Step 7 — Run the tests (repeat any time)

This is the part you repeat. You do not rebuild each time. Just run:

```bash
bash run-maestro.sh
```

To run only one part, point it at that folder:

```bash
bash run-maestro.sh .maestro/03-onboarding-step1
```

Each test shows as it passes or fails, and you can watch it live at the link Maestro
prints when it starts. If a test fails, paste the error back to the AI and ask it to fix
that flow, then run again. That back-and-forth is normal on the first pass.

---

## Step 8 — Read the report

Open `.maestro/report.md`. Every test case is marked as one of:

- Ready to run: done, and running.
- Needs a quick check: nearly done, but a person needs to confirm one small thing. The
  note says what, with a blank for your answer. Fill those in and reply "continue" to the AI.
- Tested by hand: something Maestro cannot check on its own, like a camera scan or a video
  actually playing. The note says why and how to check it yourself.

---

## If something goes wrong

- `maestro: command not found`: close Terminal and open it again after Step 3, then retry.
- Blank or black screen, or the app closes right away: the `.env` is missing or wrong. Get
  the correct one from a developer, put it in the project folder, and build again (Step 5).
- `No package.json` / "nothing found": you are not in the project folder. `cd` into the
  project root and try again.
- iPhone, "iOS driver not ready in time" on the first run: this is Maestro's start-up being
  slow, not your tests. Run it once with a longer wait:
  ```bash
  MAESTRO_DRIVER_STARTUP_TIMEOUT=120000 bash run-maestro.sh
  ```
- Android, black screen or "Network request failed": the emulator sometimes boots with no
  internet. Check it:
  ```bash
  adb shell ping -c 2 8.8.8.8
  ```
  If that says "Network is unreachable", restart the emulator with a working DNS server (use
  your emulator's name in place of the example):
  ```bash
  adb emu kill
  emulator -avd New_Device_API_35 -no-snapshot -dns-server 8.8.8.8,8.8.4.4
  ```
- Android build, "SDK location not found": the build can't find your Android SDK. Create a
  file called `local.properties` inside the project's `android` folder with one line:
  ```
  sdk.dir=/Users/YOUR_NAME/Library/Android/sdk
  ```
  Replace `YOUR_NAME` with your Mac username (and the path if your SDK is elsewhere), then
  build again. Android Studio usually creates this file for you.
- Build fails mentioning `inject-jsx-source`: open `babel.config.js`, comment out the line
  that mentions `inject-jsx-source`, and build again.

---

## Note for the AI (you can ignore this)

This last part is not a step for you to do. It is here for the AI to read if you ever
ask it to look at the running app directly.

By default the AI reads the app's code to find the on-screen words, and any mistake gets
caught the first time you run the tests. For a few tricky screens (custom date wheels, some
dropdowns) it helps to let the AI look at the live app. If you want that, just ask the AI:
"set up the Maestro live connection (MCP) for this project." The generation prompt knows
how to do the rest.
