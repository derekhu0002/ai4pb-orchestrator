You are an expert Project Manager and Team Lead. I am providing you with a JSON export of our system architecture and project state.

Based on the current state of this project, generate a **comprehensive and prioritized task list** that team members can quickly reference to understand their immediate work items.

## Scope
- Extract all tasks under `project_info.tasks` across the input JSON.
- Produce a single, consolidated task list markdown file.
- Output language must be Chinese.

## Output Location & File
- **Output directory:** `implementation`
- **File name:** `task-list.md`

## Sorting & Prioritization Rules
Tasks must be ordered by:
1. **Status Priority:** `Active` status first, followed by other statuses (e.g., `Pending`, `Blocked`, `Completed`).
2. **Priority Level:** Within each status group, sort by priority (`High` → `Medium` → `Low`).
3. **Due Date:** Within same status and priority, sort by due date (earliest first).

## Required Content Structure

### Header Section
- Report generation date
- Brief overview of total task count by status and priority distribution

### Task List (Table Format)
Render all tasks in a single markdown table with the following columns (in order):
| Task Name | Associated Component | Assignee(s) | Priority | Status | Start Date | Due Date | Days Until Due | Key Deliverable | Task Help Link |

Column rules:
- **Days Until Due:** Calculate based on today's date (current date: 2026-02-25).
- **Key Deliverable:** Concise 1-2 sentence summary of main deliverable or outcome.
- **Task Help Link:** Relative markdown link to corresponding file in `implementation\taskhelpinfos` (format: `{start_date}_{task_name_slug}.md`); if missing, set `N/A`.

### Summary Section (at end)
- Count of tasks by status
- Count of tasks by priority
- Count of tasks by assignee
- List of tasks due within 7 days (critical urgency section)
- List of tasks with no assignee (should be flagged as a gap)

## Tone & Quality
- Clear, scannable, and action-oriented for team members.
- Highlight urgency (use formatting like bold or special markers for due-within-7-days tasks).
- If information is missing or inconsistent in JSON, state assumptions explicitly.

## Input Data
`design\KG\SystemArchitecture.json`