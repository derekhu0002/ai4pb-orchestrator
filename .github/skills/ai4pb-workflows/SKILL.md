---
name: ai4pb-workflows
description: SCRUM flow router skill for selecting planning, execution, review, and reporting workflows.
---

# AI4PB Workflows Skill

Use these tool references as Copilot skill entry points:
- `#ai4pb-init`
- `#ai4pb-audit`
- `#ai4pb-wrapup`
- `#ai4pb-task-list`
- `#ai4pb-task-support`
- `#ai4pb-weekly-report`
- `#ai4pb-iteration-issues`

Execution rule:
1. Pick one workflow entry point according to user intent.
2. If the task is task-list generation, execute `#ai4pb-task-support` first, then `#ai4pb-task-list`.
3. Follow the selected prompt strictly and do not add out-of-scope tasks.
