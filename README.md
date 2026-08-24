# NexPath

The NexPath app, its Maestro UI test suite, and the docs for the test pipeline.

The pipeline turns test cases exported from Expectify into runnable Maestro flows, and folds
the working flows back into that export so nothing is written twice.

## Docs

- **[PROJECT-SETUP-GUIDE.md](./docs/PROJECT-SETUP-GUIDE.md)**: the step by step for setting up your machine and running the tests. Start here. Covers installing Maestro, installing the app's packages, building the app onto a simulator, and running the flows.

- **[PROJECT-SETUP-PROMPT.md](./docs/PROJECT-SETUP-PROMPT.md)**: an AI prompt you paste into your AI tool inside the project. It checks the project is ready to test:
  - confirms the app id, your `.env`, and the exported test cases file
  - checks the tools (Node, a JDK, Maestro, a booted simulator or emulator)
  - writes the two files the tests need: `.maestro/testgen.config.yml` (the settings) and `run-maestro.sh` (the script that runs the tests)

- **[MAESTRO-GENERATION-PROMPT.md](./docs/MAESTRO-GENERATION-PROMPT.md)**: an AI prompt for the first time you set up a project. After you export a project's test cases from Expectify, it:
  - reads the app's real screens to find the exact on screen text
  - turns the cases into runnable Maestro flows in `.maestro/`
  - flags any step it cannot automate instead of guessing

- **[TEST-PIPELINE-OVERVIEW.md](./docs/TEST-PIPELINE-OVERVIEW.md)**: the three step pipeline on one page. Raw cases become Maestro YAML, the working YAML is folded back into Expectify JSON, and that JSON converts back to YAML when needed.

- **[EXPECTIFY-JSON-TO-MAESTRO-YAML-PROMPT.md](./docs/EXPECTIFY-JSON-TO-MAESTRO-YAML-PROMPT.md)**: converts the Expectify JSON back into runnable Maestro YAML. Use it whenever the cases are edited on Expectify and need to run again.

- **[EXPECTIFY-PLATFORM-NEEDS.md](./docs/EXPECTIFY-PLATFORM-NEEDS.md)**: what the Expectify platform needs to support the pipeline.

- **[DROPDOWN-CHANGE-HANDOFF.md](./docs/DROPDOWN-CHANGE-HANDOFF.md)**: notes on the dropdown change made for testability.

## Test data

- **[NexPath-expectations-2026-08-05.json](./NexPath-expectations-2026-08-05.json)**: the original test cases exported from Expectify, left untouched.

- **[NexPath-Automation.json](./NexPath-Automation.json)**: the same cases with the working flows folded back in, ready to import back into Expectify.
