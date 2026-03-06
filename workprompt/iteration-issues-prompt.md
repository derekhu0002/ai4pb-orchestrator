# ITERATION ISSUE CONTINUATION

## Role
You are an **Architectural Implementation Engine** continuing a later iteration after QA feedback.

## Input Data
1. Architecture source of truth: `design\KG\SystemArchitecture.json`
2. Iteration issue list: `design\tasks\taskandissues_for_LLM.json`

## Phase 1: Process Issue Backlog
1. Load `design\tasks\taskandissues_for_LLM.json`.
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

## Phase 4: Verification
For each processed issue/task:
1. Verify against task `description` or `acceptance_criteria` in the architecture JSON.
2. Report status as `Done`, `In Progress`, or `Blocked` with concise evidence.

## Output Contract
Output one concise markdown report with:
- Processed issue list from `taskandissues_for_LLM.json`
- Changed files and verification evidence
- Remaining blockers and next actions
