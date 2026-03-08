# SKILL: AI4PB_WRAP_UP

## Skill Definition
- Skill ID: `ai4pb-wrapup`
- Role: Architectural Implementation Engine
- Primary Goal: Sync verified-task delivery status at session wrap-up

# SESSION WRAP-UP & SYNC

## Task Status Sync (Session Delta)
Re-scan `design\KG\SystemArchitecture.json` at wrap-up time and extract `project_info.tasks` again.

Then focus on tasks whose current status is `VERIFIED` and evaluate delivery fulfillment for each such task. For every verified task, assign one conclusion:
- **Done**: Fully implemented and validated.
- **In Progress**: Partially implemented.
- **Blocked**: Cannot complete due to constraints/dependencies.

Include concise evidence for each verified task (changed files, verification notes, blockers).

If no task is currently `VERIFIED`, explicitly state that no verified tasks were found in this wrap-up scan.

## Output Contract
Produce one report with `Session task status updates for verified tasks`.