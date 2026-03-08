# AI4PB Orchestrator

AI4PB Orchestrator connects EA (ArchiMate) architecture output with GitHub Copilot implementation workflows.

It helps teams run a model-driven loop: architecture modeling -> JSON export -> guided implementation -> design audit -> wrap-up.

## Highlights

- AI4PB Activity Bar with workflow actions
- Architecture context checks and iteration state outputs
- Prompt Tool integration for Copilot Chat (no manual copy/paste)
- Release-friendly VSIX packaging flow

## Sidebar Workflow (Current)

The current sidebar removes the old "Prompt Set" action and follows a SCRUM-oriented sequence:

1. Initialize EA Template
2. Export Option
3. Open Copilot (Task List)
4. Open Copilot (Init Prompt)
5. Open Copilot (Task Support)
6. Open Copilot (Iteration Issues)
7. Open Copilot (Design Audit)
8. Open Copilot (Wrap-up)
9. Open Copilot (Weekly Report)

## Copilot Tools

This extension contributes the following tools that can be referenced directly in chat:

- `#ai4pb-init`
- `#ai4pb-audit`
- `#ai4pb-wrapup`
- `#ai4pb-task-list`
- `#ai4pb-task-support`
- `#ai4pb-weekly-report`
- `#ai4pb-iteration-issues`

## Typical Usage

1. Export the latest architecture JSON from EA to `design/KG/SystemArchitecture.json`.
2. Open the AI4PB sidebar and set export options.
3. Run Copilot actions in order: Task List -> Init -> Task Support -> Iteration Issues -> Audit -> Wrap-up -> Weekly Report.
4. Review generated files under `TEMP/` and sync results back to EA.

## Included Commands

- `AI4PB: Initialize EA Template`
- `AI4PB: Refresh Architecture Context`
- `AI4PB: Start Iteration from Model`
- `AI4PB: Run Design-Code Alignment`
- `AI4PB: Generate Wrap-up Report`
- `AI4PB: Open Next Action`
- `AI4PB: Run All (Guided)`

## Notes

- EA manual export remains the supported production path.
- If architecture JSON is missing or stale, AI4PB reports the issue in precheck/status.
