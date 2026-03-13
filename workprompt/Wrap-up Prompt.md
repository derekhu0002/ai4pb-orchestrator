# SKILL: AI4PB_WRAP_UP

## Skill Definition
- Skill ID: `ai4pb-wrapup`
- Role: Architectural Implementation Engine
- Primary Goal: Check and sync implementation status for verified todos/issues at session wrap-up

# SESSION WRAP-UP & SYNC

## Task Status Sync (Session Delta)
Re-scan `design\tasks\taskandissues_for_LLM.md` at wrap-up time and extract only `ToDos` and `Issues` entries whose `Status` is `Verified`.

## KG View Resolution Rules
If you inspect architecture Views while validating wrap-up evidence, you MUST resolve View references globally first.
1. Read `elements`, `relationships`, and `views` together from `design\KG\SystemArchitecture.json`.
2. Treat `included_elements` and `included_relationships` as ID references only.
3. Reverse-lookup each referenced ID in the corresponding top-level array before using View content as evidence.
4. Do NOT claim missing View semantics unless the referenced IDs cannot be found globally.

Use this fast-path order to load tasks quickly and reliably:
1. **Primary source:** `design\tasks\taskandissues_for_LLM.md` (table rows).
2. **Fallback source:** `design\KG\SystemArchitecture.json` -> `elements[*].project_info.tasks` only when the markdown source is missing/empty.

Task parsing rules (mandatory):
- Normalize fields across key styles:
	- Name: `name` or `Name`
	- Type: `type` or `Type` or `ProblemType`
	- Status: `status` or `Status`
	- Assignee: `assigned_to` or `AssignedTo`
	- Progress: `progress` or `ResolverNotes`
- **Verified-only filter (mandatory):** keep only rows/items where `Status` is exactly `Verified`.
- Filter out empty placeholder tasks (for example empty name + empty status + empty type).
- Do not treat `attributes[*].content` long prompt text as task payload.

Review all code/file modifications that happened during this iteration before concluding task status, and obtain them via Git diff query first.
Iteration start ref rule:
- Prefer the latest Git tag matching `sprint-start*` as the iteration start ref (for example: `sprint-start-2026-03-09`).
- Use diff range: `<latest sprint-start*>..HEAD` to collect changed file list and patch diff.
- If no `sprint-start*` tag exists, use current staged/unstaged git diff as fallback.
For each modification, classify it into one of the following:
- **Mapped**: Directly implements a specific todo/issue item.
- **Supporting**: Indirect dependency/refactor/config/test update required by a todo/issue item.
- **Unrelated/Potential Drift**: Not clearly tied to any todo/issue item (must be flagged for review).

For every verified todo/issue item, link the relevant modifications and use them as evidence when assigning status.

Then evaluate delivery fulfillment for each verified todo/issue item from that file. For every item, assign one conclusion:
- **Done**: Fully implemented and validated.
- **In Progress**: Partially implemented.
- **Blocked**: Cannot complete due to constraints/dependencies.

Include concise evidence for each verified todo/issue item (changed files, verification notes, blockers).
If any **Unrelated/Potential Drift** modifications exist, include them in a separate "Drift Review" section.

If no verified todos/issues are found in the input file, explicitly state that no verified todos/issues were found in this wrap-up scan.

## Output Contract
Produce one report with `Session todo/issue implementation status updates`.