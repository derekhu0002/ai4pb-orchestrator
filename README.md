# AI4PB Orchestrator (VS Code Extension)

MVP extension for orchestrating the AI-For-Project-Building workflow in VS Code.

## Commands

- `AI4PB: Refresh Architecture Context`
- `AI4PB: Start Iteration from Model`
- `AI4PB: Run Design-Code Alignment`
- `AI4PB: Generate Wrap-up Report`
- `AI4PB: Open Next Action`
- `AI4PB: Run All (Guided)`

## What it does

- Validates required artifacts (`design/KG/SystemArchitecture.json`, prompts, docs, `.aicodingconfig`)
- Opens model and prompt files to start an implementation iteration
- Generates alignment and wrap-up markdown reports in `TEMP/`
- Provides a next-action command based on architecture JSON freshness
- Adds an `AI4PB` Activity Bar view with one-click workflow steps

## Sidebar Workflow View

- Open the `AI4PB` icon from VS Code Activity Bar.
- The panel shows live status cards (architecture freshness, config presence, prompt completeness, latest report).
- Each status card has quick actions:
  - `Architecture JSON`: Open or Refresh
  - `.aicodingconfig`: Open or Create
  - `Prompt Set`: Open available prompts
  - `Latest Report`: Open latest report or Generate wrap-up
- In `Workflow`, run steps in sequence:
  0. Run All (Guided)
  1. Refresh Context
  2. Open Next Action
  3. Start Iteration
  4. Run Alignment
  5. Generate Wrap-up
- Status auto-refreshes every 15 seconds and after command execution; use `Refresh` button for manual update.

### Guided Mode

- `Run All (Guided)` executes the flow end-to-end with stop-on-error behavior:
  1. Refresh context
  2. Precheck required artifacts (fresh architecture JSON + required prompts)
  3. Start iteration from model
  4. Generate alignment report
  5. Generate wrap-up report

## Build & Run

1. Install dependencies:
   - `npm install`
2. Compile:
   - `npm run compile`
3. Press `F5` in this extension folder to launch Extension Development Host.
4. In the new window, run commands from Command Palette.

## Notes

- Architecture JSON path defaults to `design/KG/SystemArchitecture.json`.
- Optional override in `.aicodingconfig`:

```json
{
  "EA_AUTOGEN_CONFIG": {
    "architectureJsonPath": "design/KG/SystemArchitecture.json"
  }
}
```
