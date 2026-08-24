# What we need on Expectify

QA writes test cases in Expectify. We convert them to Maestro tests and back. Three things make that work. A fourth is optional.

## 1. Reusable setup (grouping)

Completing onboarding is about 15 steps (open the app, birthdate, pick a state, pick a community length, pick goals, finish). 47 of our cases need the user already onboarded before their real steps start. Without grouping, all 15 steps get copied into every one of those 47 cases, and any change to onboarding means editing 47 cases.

Instead, define those steps once as a named block and have each case reference it. Expectify already has a `preconditions` field for this:

```
Case:          "Website resource opens"
Preconditions: "User has finished onboarding, on My Path."   (the 15 steps, referenced)
Steps:         Tap "Transportation" ...
```

That reference becomes one line in Maestro:

```yaml
- runFlow: ../helpers/complete-onboarding.yaml
```

So the 15 onboarding steps are written once, not 47 times. The same applies to any repeated sequence, such as "add a calendar appointment".

## 2. Conditional steps

Run a step only when something is on screen. This lets us onboard once and skip it afterwards.

```yaml
- runFlow:
    when: { notVisible: "My Path" }
    commands:
      - runFlow: ../helpers/complete-onboarding.yaml
```

## 3. Reset toggle, and reorder cases

Per case, a "reset app before this test" toggle:

```yaml
- launchApp: { clearState: true }   # reset on: clean start
- launchApp                         # reset off: keep previous state
```

Reset on is safer but re-runs onboarding every time (slower). Reset off is faster but tests depend on each other. Use reset off only for tests that change nothing.

Also, the ability to drag cases into the order they run in. When tests share state, order matters, and it has to come from Expectify because Maestro's own ordering is unreliable.

## Summary

| Need | Maestro |
|---|---|
| Reusable setup (preconditions + saved groups) | `runFlow` |
| Conditional steps | `runFlow` with `when` |
| Reset toggle + reorder cases | `clearState`, fixed order |

## Optional: a step builder

Right now the QA writes each step as free English, and an AI reads it and works out the Maestro command. That works, but the AI has to interpret, and that is where mistakes and cost come from. If a step is worded loosely, the AI can guess wrong.

The alternative: the QA picks the action from a dropdown and fills in a target. Now there is nothing to interpret. Each choice maps to one Maestro command by a fixed table, so the conversion is a plain lookup, no AI. It still reads naturally.

Actions the QA would pick from:

| Pick | Fill in | Becomes |
|---|---|---|
| Open app | fresh? yes/no | `launchApp` (with or without clear state) |
| Tap | `Let's Go!` | `- tapOn: "Let's Go!"` |
| Type | `test@example.com` | `- inputText: "test@example.com"` |
| Swipe | up / down | `- swipe: { direction: UP }` |
| Scroll to | `Transportation` | `- scrollUntilVisible: ...` |

Checks the QA would pick from:

| Pick | Fill in | Becomes |
|---|---|---|
| See | `My Path` | `- assertVisible: "My Path"` |
| Don't see | `Go back` | `- assertNotVisible: "Go back"` |
| Wait for | `My Path`, 30s | `- extendedWaitUntil: { visible: "My Path", timeout: 30000 }` |

Anything that does not fit a dropdown gets a **Manual** option: the QA writes it in plain words and a person handles it (the same as the 2 dropdown cases we just marked manual).

Why it is worth considering: converting a case becomes a lookup instead of an AI call, so it is faster, cheaper, and cannot misread a step. The trade-off is that writing a step is a bit less free-form. This is a nice-to-have on top of the three requirements, not a replacement for them.
