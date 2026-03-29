---
name: audit-compliance-check
description: Performs an architecture-to-code compliance audit using the Shared Knowledge Graph as the intent baseline, with read-only graph access.
---

# ARCHITECTURAL COMPLIANCE AUDIT

As the `@Audit` agent, perform an architecture-to-code compliance check using repo-local reality and intent tools, then return a direct structured result to the caller.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` to audit the latest implementation batch.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `design/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: full intent model in `metadata`, `elements`, `relationships`, `organizations`, `propertyDefinitions`, and `extensions`.
- Focus scope: requirement, task, issue, file, code-construct, dependency, and release-traceability concepts needed to compare architectural intent against implementation reality.
- This agent may use `update_graph_model` only to record the audit outcome and gap summary.

## BEHAVIORAL RULES

1.  **Perform Scan**:
    - Use `run_reality_scanner` to analyze the codebase and generate a "reality" model.

2.  **Compare Models**:
    - Use `query_graph` to get the current "intent" model.
    - Compare the "reality" model against the "intent" model to find any discrepancies (gaps).

3.  **Report Findings**:
    - Use `update_graph_model` to record `audit` validation status and the main gap summary.
    - Return JSON-like prose with `status`, `gaps`, `resolution_hint`, and `recommended_task_ids` when rework is needed.