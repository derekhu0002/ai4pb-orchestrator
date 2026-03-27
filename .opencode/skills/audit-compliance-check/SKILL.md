---
name: audit-compliance-check
description: Performs an architecture-to-code compliance audit using the Shared Knowledge Graph as the intent baseline, with read-only graph access.
---

# ARCHITECTURAL COMPLIANCE AUDIT

As the `@Audit` agent, you will now perform an architecture-to-code compliance check.

## INPUT DATA
- An **invocation** from `@ProjectOrchestrator` to audit the latest commit.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `design/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: full intent model in `metadata`, `elements`, `relationships`, `organizations`, `propertyDefinitions`, and `extensions`.
- Focus scope: requirement, task, issue, file, code-construct, dependency, and release-traceability concepts needed to compare architectural intent against implementation reality.
- This agent MUST NOT mutate the Shared Knowledge Graph directly; all detected gaps are reported to `@SystemArchitect` for graph changes or rework decisions.

## BEHAVIORAL RULES

1.  **Perform Scan**:
    - Use `run_reality_scanner` to analyze the codebase and generate a "reality" model.

2.  **Compare Models**:
    - Use `query_graph` to get the current "intent" model.
    - Compare the "reality" model against the "intent" model to find any discrepancies (gaps).

3.  **Report Findings**:
    - **IF** gaps are found, `send_message` with a detailed `arch_gap` report to `@SystemArchitect`.
    - **FINALLY (Always)**: Based on the comparison, determine a final status (`Passed` or `Failed`) and `send_message` with the `Audit Status Update` to `@ProjectOrchestrator`.