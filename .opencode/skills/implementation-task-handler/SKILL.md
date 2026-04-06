---
name: implementation-task-handler
description: Executes assigned coding tasks, including new features, bug fixes, and architectural refactoring, using the Shared Knowledge Graph as a read-only implementation contract.
---

# IMPLEMENTATION TASK HANDLER

Use this skill to execute the assigned coding work and return a direct structured result to the caller. Use native Task delegation to `SystemArchitect` when blocked.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` with one or more task IDs.
- A Task invocation from `ProjectOrchestrator` carrying a `lane: "fast-track"` handoff for a localized, non-structural change.
- A Task invocation from `ProjectOrchestrator` carrying a QA or audit rework summary.
- The handoff payload may also include consolidated `recommendedSkills` and `recommendedTools` emitted from repository language and environment detection.
- When implementation succeeds, the output must include the git commit ID for the exact changes delivered for review.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only` by default.
- Read scope: assigned `Task` work packages, linked requirements, related ArchiMate elements and relationships, and any traceable `File`, `CodeConstruct`, or `Dependency` concepts needed to implement the task correctly.
- This agent uses `query_graph` as the implementation source of truth for scope, dependencies, and traceability.
- This agent may use `update_graph_model` only to record execution status, not to alter architectural intent.

## BEHAVIORAL RULES

0.  **Runtime Bootstrap**:
    - Before reading any specific task, call `query_graph(mode="summary")` once so workflow state and the shared graph context are initialized in projects that were created from this template.
    - Detect whether the handoff explicitly marks the work as `lane: "fast-track"` or otherwise states that the change was pre-classified as localized and non-structural.
    - Check the handoff payload for `recommendedSkills`. If present, you MUST use the `skill` tool to read EACH recommended skill document before planning implementation, choosing a verification path, or making environment assumptions.
    - Check the handoff payload for `recommendedTools`. If present, treat them as the preferred domain-specific execution toolchain for this task batch.
    - Treat `architectureCoverage.missingCoreLayers` in that summary as a hard blocker for normal implementation work. If any core layer is missing, ask `SystemArchitect` to complete the intention baseline before coding.
    - Also treat `intentionModel.isIntentModelSufficient === false` as a blocker for normal implementation work. A graph that only contains runtime-synced tasks or thin placeholders is not enough implementation guidance.
    - For an explicit `fast-track` handoff, do not block solely because the intention model is thin or the core layers are incomplete.
    - A `fast-track` handoff is valid only while the requested change remains local and non-structural. If the task touches a workflow boundary, API, schema, persistence contract, infra behavior, security behavior, package/module ownership boundary, or multiple software units, stop the fast-track path and ask `SystemArchitect` to take over.
    - When the dominant language, active environment, or verification path is not obvious from the assigned files, call `run_reality_scanner` once and inspect both `languageSupport` and `detectedEnvironments`.
    - Consolidate any `recommendedSkills` and `recommendedTools` from the handoff payload plus the scanner's `languageSupport` and `detectedEnvironments`, then use those consolidated arrays as the preferred execution stack for that task batch.
    - If the task spans multiple implementation languages, split the execution and verification plan by language boundary instead of assuming one workflow fits every changed file.

1.  **Task Execution Loop**:
    - For each assigned task ID, use `query_graph(mode="task_by_id", id="TASK-...")` to read its full specification.
    - For normal implementation work, use the intention model, not only the free-text task summary, as the implementation contract.
    - For an explicit `fast-track` handoff, use the narrow user request, the orchestrator's fast-track rationale, and the persisted runtime task summary as the implementation contract.
    - If a specification is ambiguous, or the required architecture baseline is incomplete, invoke `SystemArchitect` through the native Task tool, then resume the task with the returned clarification.
    - If a `fast-track` task stops being obviously local during code inspection, do not guess. Escalate to `SystemArchitect` and report that the lane classification was invalidated by implementation reality.
    - Prefer language-aware execution. If `languageSupport` indicates TypeScript or JavaScript, use the repo's JS/TS-oriented skills and verification flow. If it indicates Python, use Python-oriented verification commands and avoid assuming Node-specific build steps.
    - When the task includes `architectureElementId`, treat that ID as required traceability metadata for the code reality. Add or preserve a nearby source comment in the form `@ArchitectureID: <architectureElementId>` on the main changed code construct or file that realizes the element whenever the file format supports comments.
    - Reuse existing `@ArchitectureID` markers when they already point to the same architecture element. Do not spam every edited line with duplicate markers, but do ensure the main implemented construct remains traceable for downstream reality scanning.
    - If a task is implementation-scoped but does not include `architectureElementId`, and the work cannot be cleanly traced back to an existing marked construct, ask `SystemArchitect` for clarification instead of inventing an ArchitectureID.
    - Exception: for an explicit `fast-track` change that remains local, superficial, and non-architectural, you may complete the work without inventing an `ArchitectureID`. In that case, report that no architecture IDs were touched and keep the scope narrow.
    - If `run_reality_scanner` reports that the dominant language has only fallback extraction coverage, state that limitation explicitly in your notes and compensate with narrower manual inspection instead of overstating scanner confidence.
    - If the handoff payload or scanner result includes `recommendedTools`, you MUST prioritize those domain-specific tools for execution and testing over generic `bash` commands whenever they can cover the required step.
    - Use `write` and `bash` as needed to implement the code.
    - Use `update_graph_model(action="set_task_status", taskId="TASK-...", status="in_progress|done|blocked", content="...")` to mark progress.

2.  **Commit Completion**:
    - Before returning success, inspect the git worktree with non-interactive git commands and make sure the assigned implementation work is the only content being committed.
    - Stage only the files that belong to the assigned implementation work. Do not mix unrelated user changes into the commit.
    - Create a non-interactive git commit after the implementation is complete. The commit message should reference the completed task IDs and summarize the software-unit-scoped work.
    - Capture the resulting commit ID with a git command and persist it on every completed task by calling `update_graph_model(action="set_task_status", taskId="TASK-...", status="done", commitId="<sha>", content="...")`.
    - If you cannot create a clean commit because the worktree contains unrelated changes that cannot be isolated safely, mark the affected tasks as `blocked` and explain the git-state problem instead of creating an unsafe commit.

3.  **Reporting Completion**:
    - Return JSON-like prose with `status`, `completed_task_ids`, `blocked_task_ids`, `files_changed`, `commit_id`, `architecture_ids_touched`, and `notes`.
    - If a `fast-track` task had to be escalated, say so explicitly in `status` or `notes` and explain which discovered structural concern forced the escalation.