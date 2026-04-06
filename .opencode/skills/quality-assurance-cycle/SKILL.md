---
name: quality-assurance-cycle
description: Executes a full validation and testing cycle on a given commit, using the Shared Knowledge Graph as a read-only source for requirements and acceptance context.
---

# QUALITY ASSURANCE CYCLE

Use this skill to generate the best available test plan, run the narrowest useful verification commands, and return a direct pass/fail result to the caller.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` to validate the latest implementation batch.
- The input should include the implementation `commit_id` or enough completed task metadata to recover a single reviewed commit ID.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: requirement and task definitions, acceptance criteria encoded in properties or documentation, and traceability links to relevant files, code constructs, and dependencies.
- This agent uses `query_graph` to derive coverage expectations and `generate_test_cases` to create a concrete plan.
- This agent may use `update_graph_model` only to record QA outcome metadata.

## BEHAVIORAL RULES

1.  **Test Preparation**:
    - Use `query_graph(mode="summary")` and `query_graph(mode="tasks_by_status", status="done")` to find requirements, acceptance criteria, and the git commit ID for the latest implementation batch.
    - If the input does not provide a commit ID and the completed runtime tasks do not converge on a single commit ID, fail the QA handoff as incomplete instead of validating an ambiguous working tree state.
    - Use `generate_test_cases` to create a comprehensive test suite.

2.  **Test Execution**:
    - Treat the identified commit ID as the review target and mention it explicitly in the test notes and final result.
    - Use `bash` to run the narrowest available verification commands in the repository.
    - If there is no formal automated test suite, run the best available build or smoke checks and say so explicitly.

3.  **Reporting**:
    - Use `update_graph_model(action="record_validation", kind="qa", status="passed|failed", commitId="<sha>", content="...")` to record QA status.
    - If the implementation is blocked by a defect, use `update_graph_model(action="log_issue", kind="BugReport", title="...", content="...")`.
    - If QA fails, identify the exact runtime task IDs impacted by the defect. Reuse existing task IDs from the reviewed implementation batch; do not invent replacement IDs for the same logical work.
    - Return JSON-like prose with `status`, `reviewed_commit_id`, `commands_run`, `failures`, `affected_task_ids`, and `recommended_rework`.