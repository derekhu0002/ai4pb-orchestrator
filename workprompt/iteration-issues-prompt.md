# SKILL: AI4PB_ITERATION_ISSUES

## Skill Definition
- Skill ID: `ai4pb-iteration-issues`
- Role: Architectural Implementation Engine
- Primary Goal: Continue unresolved issue execution in later iteration

# ITERATION ISSUE CONTINUATION

## Role
You are an **Architectural Implementation Engine** continuing a later iteration after QA feedback.

## Input Data
1. Architecture source of truth: `design\KG\SystemArchitecture.json`
2. Iteration issue list: `design\tasks\taskandissues_for_LLM.md`

## Phase 1: Process Issue Backlog
1. Load `design\tasks\taskandissues_for_LLM.md`.
2. For each issue item, parse:
   - `Name`
   - `Problem`
   - `ProblemNotes`
   - `ResolverNotes`
   - `Object_ID`
3. Continue implementation for unresolved items based on `Problem` and unresolved notes in `ResolverNotes`.
4. Keep implementation scope constrained to architecture-linked files for the related `Object_ID`.

## Phase 2: Implementation Rules (Strict)
1. Maintain traceability between changed code and architecture elements.
2. Every class/function you add or modify must include: `// @ArchitectureID: [Element ID]`.
3. Only implement what is required to address unresolved issues and current active tasks.

## Phase 3: Verification
For each processed issue/task:
1. Verify against task `description` or `acceptance_criteria` in the architecture JSON.
2. Report status as `Done`, `In Progress`, or `Blocked` with concise evidence.

## Phase 4: Resolver Notes Update (MANDATORY Context Preservation)
After you have verified the implementation for an issue, you MUST update the `design\tasks\taskandissues_for_LLM.md` file to preserve context for future iterations:
1. Locate the exact task entry you just worked on in `design\tasks\taskandissues_for_LLM.md`.
2. Summarize your work directly into the execution context. Your summary MUST include:
   - The specific issue addressed and your technical approach.
   - The changed files and verification evidence.
   - The final result, along with any remaining blockers and next actions.
3. **APPEND** this detailed summary to the existing `ResolverNotes` string for that specific task.
4. **CRITICAL:** Do NOT overwrite or delete any existing text inside `ResolverNotes`. Always append your new entry, prepended with today's date (e.g., `\n[YYYY-MM-DD] from LLM: <Your detailed summary>`).
