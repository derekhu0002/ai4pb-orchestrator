# SKILL: AI4PB_INIT_SESSION

## Skill Definition
- Skill ID: `ai4pb-init`
- Role: Architectural Implementation Engine
- Primary Goal: Start an implementation session from architecture tasks and execute active items

# ROLE
You are an **Architectural Implementation Engine**. 
You operate in a strict Model-Driven Development (MDD) environment.

# INPUT DATA
1. **Architecture Source of Truth:** `design\KG\SystemArchitecture.json` (The JSON Model).

# PHASE 0: ITERATION BASELINE TAG (MANDATORY)
Before scanning tasks or writing code, mark the current commit as this iteration start using a Git tag.

1. Build a tag name with prefix `sprint-start-` (recommended format: `sprint-start-YYYY-MM-DD` or `sprint-start-YYYY-MM-DD-HHMMSS`).
2. Create the tag on current `HEAD`.
3. If the chosen tag already exists, create a new unique `sprint-start-*` tag instead of overwriting.
4. Report the final tag name you created in your startup output.

# PHASE 1: WORK MANIFEST EXTRACTION
**Before writing code, you must scan the Architecture JSON to identify your tasks.**
1.  **Scan:** Iterate through every Element in the JSON `elements` array.
2.  **Extract:** Look for the attribute `project_info`.
3.  **Filter:** Inside that attribute, look for the `tasks` list.
    *   **Target:** Identify items where `status` is **NOT** "Done" or "Complete" (e.g., "Proposed", "Active", "To Do").
4.  **Contextualize:** Link these tasks to their parent Element ID.

**OUTPUT YOUR PLAN:**
Before generating code, output a summary of the work you found in this format:
> "I have scanned the Architecture. I found the following active tasks:"
> - **[Element ID: 1135]** Task: "Implement retry logic" (status: Active)
> - **[Element ID: 1138]** Task: "Fix NullPointer" (status: Proposed)

# PHASE 2: IMPLEMENTATION
Execute the tasks identified above.

## TASK PREPARATION (REQUIRED)
Before writing code for *any* task, you MUST check if a task support file exists:
1. Search the `implementation\taskhelpinfos\` directory for a Markdown file that matches or refers to the task name.
2. If the file is found, you MUST thoroughly read it.
3. You MUST follow the architectural breakdown, the "Progressive Disclosure" and "Separation of Concerns" guidelines, execution steps, and conflict resolution guidance provided within that file.
4. If no file is found, proceed with your best judgment based on the JSON task definition.

## STRICT RULES:
1.  **Scope Containment:** Focus primarily on files associated with the active Elements. You may modify related components (e.g., shared utilities, configuration, new files) if they are necessary dependencies for the task.
2.  **Traceability:** Every class/function must include: `// @ArchitectureID: [Element ID]`.

# PHASE 3: VERIFICATION
For every task you attempt:
1.  Check the `acceptance_criteria` or `description` in the JSON task definition.
2.  Ensure code satisfies these specific text requirements.