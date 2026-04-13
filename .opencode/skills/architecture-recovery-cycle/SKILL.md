---
name: architecture-recovery-cycle
description: Scans a brownfield repository, extracts physical module boundaries, and recovers them into ArchiMate ApplicationComponents and an architecture-mapping file.
---
# ARCHITECTURE RECOVERY CYCLE

Use this skill to initialize or recover the architecture baseline for a legacy (brownfield) codebase.

## BEHAVIORAL RULES
1. **Step 1: Document Exploration**: You MUST begin with documentation-first exploration before inferring business semantics from code.
  - Use the `read` tool to inspect the most relevant repository-level description files at the project root, such as `README.md`, `package.json`, and overview material under `docs/`.
  - Extract the highest-signal statements about project purpose, intended users, business goals, workflow, scope, architecture overview, and delivery context.
  - Treat these documents as the highest-weight evidence for L1/L2 semantic inference. When documentation and code signals conflict, do not silently ignore the conflict; surface it in the later human review draft.

2. **Step 2: Scan the Reality & Ensure Baseline**: After reading the high-level documents, call `scan_legacy_topology()` with no arguments to retrieve the repository's macro-level physical modules, top symbols, signatures, and doc snippets.
  - Immediately after scanning, call `update_graph_model(action="ensure_architecture_baseline", content="Recovered brownfield baseline.")` so the Shared Knowledge Graph has a valid four-layer starting point before detailed recovery begins.

3. **Step 3: Recover L3 Components & Functions**: You MUST recover the physical application layer from the topology results.
  - For each significant module, create one `ApplicationComponent` shell using `update_graph_model(action="upsert_element", elementType="ApplicationComponent")`.
  - Generate deterministic component IDs such as `ELM-COMP-AUTH`, `ELM-COMP-BILLING`, or `ELM-COMP-REPORTING`.
  - Deduce the component responsibility from the module path, symbol names, signatures, doc snippets, and any corroborating repository documentation from Step 1.
  - For each recovered component, reverse-engineer the most important 2-3 logical behaviors into `ApplicationFunction` elements using `update_graph_model(action="upsert_element", elementType="ApplicationFunction")`.
  - Generate deterministic function IDs such as `ELM-FUNC-AUTHENTICATE`, `ELM-FUNC-CALCULATE-TAX`, or `ELM-FUNC-SYNC-REPORTS`.
  - In the `content` field of EVERY `ApplicationFunction`, you MUST write a strict IPO contract using exactly this Markdown shape:
    - **[Input]**: (Deduce from symbol signatures, arguments, payloads, inbound files/events, and documented external inputs)
    - **[Processing]**: (Deduce the current legacy logic, decision rules, transformations, orchestration behavior, or documented subsystem responsibility)
    - **[Output]**: (Deduce from return types, emitted records, updated state, external effects, or documented deliverables)
    - **[Acceptance Criteria]**: (Write baseline regression criteria that describe what the legacy behavior must continue to satisfy)
  - You MUST connect each recovered `ApplicationFunction` back to its parent `ApplicationComponent` using `update_graph_model(action="upsert_relationship", type="Assignment")`.

4. **Step 4: AI Business Hypothesis**: You MUST synthesize a business-context hypothesis by combining the document evidence from Step 1 with the physical implementation evidence from Step 2 and Step 3.
  - Do not infer business meaning from code names alone when better documentation exists.
  - Use Step 1 as the primary semantic anchor and Step 2/3 as the structural reality check.
  - Draft all of the following:
    - The system's core business goal (`Goal`)
    - The main user or stakeholder role (`Actor`)
    - The most important business process or business service (`BusinessProcess` or `BusinessService`)
  - The hypothesis MUST be concrete, reviewable, and grounded in both the docs and the scanned code reality.

5. **Step 5: Human Review**: You MUST submit the business-context draft to the human using the `question` tool before finalizing semantic stitching.
  - **Title**: `Brownfield Business Context Review`
  - **Body** MUST follow this shape:
    1. `长官，结合 README 文档和底层代码结构，我为您推测了以下业务蓝图：`
    2. `**[推测的 Goal (商业目标)]**: ...`
    3. `**[推测的 Actor (用户角色)]**: ...`
    4. `**[推测的 Business Flow (业务流程)]**: ...`
    5. `请审查。如果准确请点击 Approve；如需补充或纠偏，请在下方输入您的修正建议。`
  - **Options**: `Approve Draft (批准草案)` and `Needs Adjustment (请在下方输入您的修正建议)`.
  - If the human provides corrections, treat those corrections as authoritative and use them to replace the provisional business hypothesis.

6. **Step 6: Semantic Stitching**: After the human approves or corrects the draft, you MUST stitch the confirmed L1/L2 context back into the recovered L3 implementation structure.
  - Use `update_graph_model(action="upsert_element")` to rewrite the baseline `Goal`, `Actor`, `BusinessProcess`, `BusinessService`, and any other required L1/L2 nodes so their `documentation` contains meaningful confirmed business semantics instead of placeholder boilerplate.
  - Use `update_graph_model(action="upsert_relationship")` to create valid `Realization`, `Serving`, or other appropriate ArchiMate relationships that connect the recovered `ApplicationComponent` elements to the confirmed business-layer nodes.
  - The objective is to eliminate graph islands: no major recovered component should remain detached from the approved business context.

7. **Step 7: Bind Reality & Report**: You MUST finalize the recovery contract and return a full summary.
  - Use the `write` tool to create or overwrite `.opencode/architecture-mapping.yaml`.
  - Map ONLY the recovered `ApplicationComponent` IDs to their physical module globs.
  - Do NOT map individual `ApplicationFunction` elements in YAML.
  - Return a structured final report that includes the reference documents consulted, the recovered physical modules and assigned `ApplicationComponent` IDs, the recovered `ApplicationFunction` elements and IPO contracts, the proposed and then confirmed business semantics, the created cross-layer relationships, and confirmation that `.opencode/architecture-mapping.yaml` was written successfully.
  - Do NOT generate implementation tasks during this recovery workflow.