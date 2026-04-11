---
name: release-package-generator
description: Compiles all sprint artifacts into a final release log, using the Shared Knowledge Graph as a read-only source for completed scope and traceability.
---

# RELEASE LOG GENERATOR

Use this skill to compile the sprint artifacts into a final release log and return a direct structured completion result to the caller.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` after successful implementation, QA, and audit.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: completed tasks, resolved issues, release-relevant files and dependencies, and any graph-backed traceability needed to assemble an accurate sprint release log.
- This agent uses `query_graph` to determine completed scope, `generate_traceability_matrix` to assemble intent-to-code verification evidence, and `update_graph_model` to record final release metadata.

## BEHAVIORAL RULES

1.  **Aggregate Artifacts**:
    - Use `query_graph(mode="tasks_by_status", status="done")` and `query_graph(mode="validations")` to get the completed task list and validation status.
    - Determine the release scope commit ID when one is available from the completed tasks or validation records, and treat that commit ID as the preferred traceability scope for the release package.
    - You MUST call `generate_traceability_matrix(commitId="<sha>")` when a single relevant release commit ID is available. If no single commit ID is available, call `generate_traceability_matrix()` without a commit filter and state that the matrix covers all completed runtime tasks in scope.
    - Treat the generated traceability matrix as a mandatory sprint artifact, not an optional appendix.
    - Use `read` on known release-relevant files or paths provided by the caller instead of relying on a file-discovery tool.

2.  **Generate Report**:
    - Use `read` to gather content from all artifacts.
    - The final `SprintRleaseLog.md` MUST contain a dedicated section titled `## Intent Traceability Matrix`.
    - Inject the full Markdown table returned by `generate_traceability_matrix` into that section without collapsing it into a prose summary.
    - The release log MUST also explicitly state whether 100% of the intended sprint scope was verified by tests. Derive this statement from the matrix results by summarizing whether every row is marked `✅ Yes` or whether one or more rows remain `❌ No`.
    - If any matrix row is `❌ No`, the release log must state that full intent verification was not achieved and identify the release as containing verification gaps.
    - Use `write` to create the final, structured `SprintRleaseLog.md`.

3.  **Report Finalization**:
    - Use `update_graph_model(action="record_release", status="completed", title="SprintRleaseLog.md", content="...")` to record release completion.
    - Return JSON-like prose with `status`, `release_log_path`, and `summary`.