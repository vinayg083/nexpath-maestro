# Test conversion pipeline — overview

How raw test cases become runnable Maestro tests, get stored in Expectify, and come back out — a three-step pipeline. Each step has one prompt/tool.

```
Raw human test cases
        │
        │  STEP 1 — Maestro Generation Prompt  (one time, uses Maestro MCP)
        ▼
Maestro YAML flows  ◄─────────────────────────┐
        │                                      │
        │  STEP 2 — YAML → Expectify JSON       │  STEP 3 — Expectify JSON → YAML
        ▼                                      │
Expectify JSON  ──────────────► Expectify ─────┘
(readable + patterned)          (QA edits here)
```

## Step 1 — Raw cases → Maestro YAML  *(already built)*
**Prompt:** the Maestro Generation Prompt. **Runs:** locally, once, with the Maestro MCP.
The client's loosely-written cases are turned into proper, runnable YAML — iteratively: read the app screens, read the API/data, write the flow, run it, fix it, repeat. This is where the real engineering effort goes, and it only happens once. Output: the `.maestro` suite.

## Step 2 — Maestro YAML → Expectify JSON  *(this repo: MAESTRO-YAML-TO-EXPECTIFY-JSON-PROMPT.md)*
**Runs:** locally, after the YAML works.
Take the *good, runnable* YAML and generate Expectify JSON **from it**. Because it comes from working flows, the JSON is clean and accurate. It's written in a **readable-but-patterned** style — plain English a QA can follow, but each step follows a consistent phrasing that encodes the exact command. Import this into Expectify. This preserves the Step-1 effort in Expectify's format.

## Step 3 — Expectify JSON → Maestro YAML  *(this repo: EXPECTIFY-JSON-TO-MAESTRO-YAML-PROMPT.md)*
**Runs:** inside Expectify, ongoing.
Whenever the QA edits or exports a case, convert its JSON back to runnable YAML. This is **high-fidelity** because the JSON it consumes was produced by Step 2 (clean, patterned) — not raw prose. It reverses the same phrasing patterns Step 2 used.

## Why it's built this way
- **Effort isn't lost.** The hard one-time work (Step 1) is captured as clean JSON (Step 2) that lives in Expectify. Round-tripping through Steps 2↔3 is cheap and reliable.
- **Both audiences served.** The JSON reads as English for QA, yet is structured enough to machine-convert.
- **Steps 2 and 3 are a matched pair.** They share one phrasing dictionary (same phrase ⇄ same command both ways). If one changes, the other must change with it, or the round-trip breaks.
