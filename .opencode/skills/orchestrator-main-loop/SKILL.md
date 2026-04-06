---
name: orchestrator-main-loop
description: The primary thinking and delegation loop for the master project orchestrator. It manages the entire system building lifecycle from requirement triage to release and uses the Shared Knowledge Graph as the workflow state source of truth.
---

# PROJECT ORCHESTRATION MAIN LOOP

Use this skill to manage the full development lifecycle with native OpenCode primitives. Use Task-based subagent invocation, direct child-session returns, and the repo-local runtime state tools. Do not assume asynchronous mailboxes or fictional orchestration APIs.

## INPUT DATA
- **Initial Invocation Goal**: The high-level requirement provided by the **human Product Manager** when you are first activated.
- **Runtime Inputs**: Structured child results returned by the `AI_ProductManager`, `SystemArchitect`, `Implementation`, `QualityAssurance`, `Audit`, and `ReleaseAgent` subagents.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: project-level context, task backlogs, issue state, release readiness, and high-level traceability across `metadata`, `elements`, `relationships`, `organizations`, and `extensions`.
- This agent may use `query_graph` and `read_project_status` to inspect architecture and runtime execution state.
- This agent MUST NOT perform implementation work itself when a specialist subagent should handle it.

## CORE BEHAVIORAL RULES (MANDATORY)

1.  **Phase 1: Requirement Triage & PM Delegation**
    - Upon activation, parse the **Initial Invocation Goal**.
    - Evaluate the goal: Is it a raw, ambiguous, unstructured idea (e.g., "build a shopping cart"), or is it already a highly structured, execution-ready formal specification with clear business rules and acceptance criteria?
    - If the goal is raw or lacks detailed constraints, **do not decompose it yet**. Instead, invoke the `AI_ProductManager` subagent through the native Task tool with the raw goal.
    - Expect a direct result from `AI_ProductManager` containing at least `status`, `formal_requirement`, and `element_id` for the approved requirement.
    - Treat this returned formal requirement as the new baseline goal for the project. If the goal was already highly structured from the start, skip this phase and proceed to Phase 2.

2.  **Phase 2: Goal Processing & Design Delegation**
    - Using the finalized goal (either passed directly from the start or refined by `AI_ProductManager`), check runtime state. If it is missing or ambiguous, call `read_project_status(section="overview")` first to bootstrap the repo-local runtime file before planning.
    - Use `decompose_goal` first to create a planning backlog in runtime state based on the formalized goal.
    - Immediately verify persistence with `read_project_status(section="tasks")`.
    - If persisted runtime state still has no tasks after `decompose_goal`, stop and report a runtime-tooling failure. Do not continue to `SystemArchitect` with inferred or remembered planning items.
    - Treat the persisted tasks from `decompose_goal` as planning seeds only. They are not yet valid developer tasks.
    - Then use the native Task tool to invoke `SystemArchitect` with the formalized goal, the full approved requirement, and the exact persisted planning list.
    - If the repository already contains meaningful implementation code, treat the workflow as brownfield by default. Do not insert a new routing phase; instead, require `SystemArchitect` to analyze the legacy structure and decide whether the requirement should extend an existing module or introduce a new software unit.
    - If the goal came from `AI_ProductManager`, preserve the PM output separately instead of flattening it into a short goal string.
    - Pass the architect a concrete payload that includes `goal`, `formal_requirement`, `requirement_element_id`, `task_ids`, and `tasks`. Example shape: `{ "goal": "...", "formal_requirement": "...full approved requirement...", "requirement_element_id": "ELM-REQ-001", "task_ids": ["TASK-001", "TASK-002"], "tasks":[{"id":"TASK-001","title":"...","status":"todo","kind":"planning"}] }`.
    - Expect a direct result that includes a design summary, a software-unit decomposition, created or updated implementation task IDs, explicit confirmation that human architecture review is approved, and for brownfield work a statement of which legacy module(s) were selected or rejected.
    - If the architect reports revision requested or does not confirm approved human review, do not continue to implementation. Route back to `SystemArchitect` until the reviewed design is approved.

3.  **Phase 3: Implementation Delegation**
    - After `SystemArchitect` returns successfully, use `read_project_status` or `query_graph` to determine the active task IDs.
    - Before invoking `Implementation`, call `query_graph(mode="summary")` and inspect `architectureCoverage.missingCoreLayers`.
    - If any of `strategy`, `business`, `application`, or `technology` is missing, stop implementation routing and send the workflow back to `SystemArchitect` to complete the intention baseline.
    - Also inspect `intentionModel.isIntentModelSufficient`. If it is `false`, treat the design as underspecified even if the four layers nominally exist.
    - Require the architect result to identify concrete software units and task IDs derived from those software units.
    - For brownfield work, require the architect result to show that each implementation task is anchored either to an existing legacy module chosen for extension or to a justified new software unit when no suitable legacy module exists.
    - If the architect result does not reference concrete task IDs, or those tasks are missing software-unit metadata in persisted runtime state, stop and report that the architect handoff is incomplete.
    - Invoke `Implementation` through the native Task tool with those software-unit-scoped task IDs and the architect's summary.
    - Expect a direct result that includes completed tasks, blocked tasks, any clarification dependency that was resolved, work performed against the established intention baseline, and the git commit ID for the implementation batch.
    - If the implementation result does not include a commit ID, or completed runtime tasks do not record one, stop and report that the implementation handoff is incomplete.
    - After `Implementation` returns, immediately re-read persisted runtime state with `read_project_status(section="tasks")` or `query_graph(mode="tasks_by_status", status="done")` before advancing.
    - Treat persisted runtime state as the source of truth. A conversational child result is not sufficient by itself to prove implementation completion.

4.  **Phase 4: Parallel Validation**
    - Invoke `QualityAssurance` and `Audit` only if persisted runtime state shows at least one active task, at least one task with status `done`, and a recoverable implementation commit ID for that batch.
    - Re-check `intentionModel.isIntentModelSufficient` before starting `Audit`. If the intention model is still weak, route back to `SystemArchitect` instead of auditing.
    - If runtime state is empty, unchanged, or contains no `done` task, do not start validation. Re-read state once, then route back to `Implementation` or `SystemArchitect` based on what is missing.
    - Pass the implementation `commit_id` explicitly to both `QualityAssurance` and `Audit`, and require both child results to report the reviewed commit ID back.
    - You must evaluate both child results before deciding the next step.

5.  **Phase 5: Decision and Rework**
    - **IF** QA and Audit both pass, invoke `ReleaseAgent`.
    - **IF** QA fails, invoke `Implementation` again with the QA failure summary.
    - **IF** Audit fails, invoke `SystemArchitect` with the audit gap summary.
    - **IF** the architect returns `ModelUpdated`, run `Audit` again.
    - **IF** the architect returns `ReworkRequired`, invoke `Implementation` with the new refactoring task IDs.
    - **IF** runtime state never reflects implementation progress, stop the workflow and report that the implementation agent did not persist execution state through the runtime-backed tools.

6.  **Phase 6: Release Delegation**
    - Invoke `ReleaseAgent` only after both QA and Audit return success.
    - Expect a direct release result that includes the generated release-log path and final summary.

7.  **Phase 7: Conclusion**
    - Report the final status to the user directly from the child-session results.