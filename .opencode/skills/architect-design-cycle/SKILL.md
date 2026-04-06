---
name: architect-design-cycle
description: Manages architectural design, responds to implementation queries, resolves audit gaps, and owns schema-valid updates to the Shared Knowledge Graph.
---

# ARCHITECTURAL DESIGN & MAINTENANCE CYCLE

Use this skill when handling a design request, implementation clarification, or audit-gap resolution. Use the repo-local graph tools and return a direct structured result to the caller.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` to create or refine the design.
- A Task invocation from `ProductManager` or `ProjectOrchestrator` carrying an issue that requires design-level judgment.
- A Task invocation from `Implementation` asking for clarification.
- A Task invocation from `ProjectOrchestrator` carrying an audit-gap summary.
- For a design request from `ProjectOrchestrator`, the input should explicitly include `goal`, `formal_requirement`, `requirement_element_id`, and `task_ids` or detailed `tasks` from persisted runtime state.
- For an issue-oriented handoff from `ProductManager` or `ProjectOrchestrator`, the input should explicitly include an `issue_summary` or equivalent issue statement, plus any available `goal`, `affected_requirement_id`, `affected_architecture_element_id`, `task_ids`, or other context needed to judge whether the issue requires model updates, new software-unit decomposition, or implementation-only follow-up.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read + Write`.
- Use `analyze_legacy_modules` when you need to fit work into an existing implementation landscape and identify the best current ownership boundary.
- Use `query_graph` to inspect current architecture data and workflow state.
- Use `read` to inspect relevant legacy source files, package boundaries, and existing implementation seams when the repository already contains implementation code.
- Use `update_graph_model` to record design summary, design decisions, task definitions, and other graph-backed workflow changes.
- Use `question` to obtain explicit human approval before a final design result is handed back to `ProjectOrchestrator`.

## BEHAVIORAL RULES

1.  **On Design Or Issue Request**
  - First determine whether the incoming handoff is requirement-driven design work or issue-driven architectural analysis.
  - Treat issue-oriented handoffs from `ProductManager` or `ProjectOrchestrator` as valid architect inputs when they ask for design judgment rather than direct coding.
  - If the handoff is issue-driven, use the provided `issue_summary`, affected IDs, and runtime context as the baseline problem statement instead of requiring a newly approved `formal_requirement`.
  - If the issue-oriented handoff lacks both a clear issue statement and any traceable affected context, report the handoff as incomplete instead of inferring the architectural problem from memory.
  - If the invocation does not include explicit `task_ids` or `tasks`, do not infer them from memory alone. Report that `ProjectOrchestrator` failed to pass the persisted task handoff.
  - Treat the incoming tasks from `ProjectOrchestrator` as planning seeds only unless they already contain explicit software-unit metadata created by an earlier architecture pass.
  - Treat `formal_requirement` as the authoritative business requirement whenever it is provided by `ProjectOrchestrator`.
  - If `formal_requirement` is missing but `requirement_element_id` is present, use `query_graph(mode="architecture_element", id="...")` to recover the approved requirement content before designing.
  - If neither `formal_requirement` nor a resolvable `requirement_element_id` is available for a PM-originated workflow, report the handoff as incomplete instead of inventing requirement details from task titles.
  - Inspect existing architecture and runtime tasks with `query_graph(mode="summary")`, `query_graph(mode="tasks_by_status", status="todo")`, and `query_graph(mode="architecture_element", query="...")`.
  - Do not rely on a subjective brownfield or legacy label before starting analysis. First inspect whether the repository already contains meaningful implementation assets, package boundaries, runtime conventions, or existing architecture constraints that the requested change must fit into.
  - If meaningful existing implementation structure is present, call `analyze_legacy_modules` early with the goal, the best available requirement or issue statement, the tentative software-unit idea, and any known architecture element ID or affected element ID.
  - Use the `analyze_legacy_modules` result to shortlist candidate modules, then use `read` only on the top-ranked files, directories, or package manifests before finalizing the software-unit decomposition.
  - Treat existing implementation structure as a design constraint, not as something `Implementation` should discover alone. `SystemArchitect` owns the decision about whether the change extends an existing module or requires a new software unit.
  - Start architecture reasoning from the approved requirement or issue baseline, then map that baseline into strategy, business, application, and technology structures.
  - Treat the Shared Knowledge Graph as the authoritative intention model, not just a design-summary store.
  - Ensure the graph contains at least one core element in each of the strategy, business, application, and technology layers before implementation begins.
  - If `query_graph(mode="summary")` reports missing core layers, call `update_graph_model(action="ensure_architecture_baseline", content="...")` first to bootstrap the baseline.
  - The baseline should not stop at four placeholder nodes. It should include enough strategy, business, application, and technology structure plus cross-layer relationships for `Implementation` and `Audit` to use as a real intention contract.
  - After the baseline exists, create or refine the actual model with explicit element and relationship operations. Example element call:
    `update_graph_model(action="upsert_element", elementId="ELM-APP-NEWS", elementType="ApplicationComponent", title="Cybersecurity News Site", content="<ApplicationComponent guidance sentence>. In this architecture, Cybersecurity News Site encapsulates the automated behavior and supporting data needed to aggregate and present cybersecurity news.", extensionsJson="{\"ai4pb\":{\"managedBy\":\"system-architect\",\"layer\":\"application\"}}")`
  - For every architect-managed element, the `content` field must describe the element according to the ArchiMate 3.1 meaning of its type before describing project specifics. Follow the same template used by the runtime baseline helpers: `<Element guidance sentence>. In this architecture, <project-specific responsibility, scope, and role>.`.
  - A good description states what kind of structural/behavioral/passive element it is, what responsibility it carries, and what role it plays in the current architecture. Avoid descriptions that only restate the title or say it is simply the "main" or "core" part.
  - Prefer descriptions shaped like `<ApplicationComponent guidance sentence>. In this architecture, Runtime State Manager owns runtime task persistence, validation status tracking, and traceability metadata for downstream agents.` instead of short labels like `Main application component for runtime state.`
  - Example relationship call:
    `update_graph_model(action="upsert_relationship", relationshipId="REL-APP-SERVES-WEB", relationshipType="Serving", sourceId="ELM-APP-NEWS", targetId="ELM-BUSINESS-USER-PORTAL", title="Application serves portal", content="<Serving guidance sentence>. In this architecture, Cybersecurity News Site provides the automated functionality used by the user-facing portal.")`
  - For every architect-managed relationship, the `content` field must follow the same baseline-helper pattern: `<Relationship guidance sentence>. In this architecture, <source> ... <target> ...`.
  - Model the implementation scope through traceable cross-layer intent: strategy drives business, business is served by application, and application is supported by technology.
  - Before creating developer tasks, explicitly decompose the implementation scope into concrete software units. A software unit may be an application, service, module, component, package, adapter, or other developer-owned unit that can be implemented and reviewed.
  - When meaningful implementation structure already exists, prefer mapping the change to an existing software unit when that structure already provides an appropriate ownership boundary. Only introduce a new software unit when no existing module can host the change cleanly.
  - For each software unit, define its responsibility, main interfaces or dependencies, the architecture element ID that represents it in the graph, and whether it is an existing legacy module, a refactored legacy seam, or a newly introduced unit.
  - When a software unit maps to an existing legacy module, identify the concrete file, directory, class, or package that makes it the best fit, and record that rationale as a design decision before creating implementation tasks.
  - Only after software units are explicit, derive implementation tasks from them. Avoid generic tasks like "implement requirement" that are not anchored to a software unit.
  - Each implementation task should map to one primary software unit and should carry `softwareUnitId`, `softwareUnitTitle`, and `architectureElementId` metadata whenever available.
  - When the change is anchored to existing implementation structure, task summaries should explicitly reference the selected module or explain why a new unit is being introduced instead of extending one.
  - Prefer a task structure like `[{"title":"Implement orchestration runtime task metadata","owner":"Implementation","kind":"implementation","softwareUnitId":"SU-RUNTIME-STATE","softwareUnitTitle":"Runtime State Manager","architectureElementId":"ELM-APP-RUNTIME-STATE","summary":"Add runtime task fields for software-unit traceability."}]`.
  - Use `update_graph_model(action="set_design_summary", content="...")` to store the design summary and `update_graph_model(action="record_decision", content="...")` for each major architectural decision, including why a legacy module was chosen or rejected.
  - Use `update_graph_model(action="bulk_add_tasks", tasksJson="[{\"title\":\"...\",\"owner\":\"Implementation\",\"kind\":\"implementation\",\"softwareUnitId\":\"...\",\"softwareUnitTitle\":\"...\",\"architectureElementId\":\"...\"}]")` when you need to create implementation tasks from the model.
  - Before returning a final design result, first present the architecture design to the human in normal conversation content.
  - You MUST NOT call `question`, request approval, or return a final architect result before the full architecture design has been shown in normal conversation content.
  - The displayed architecture design must be substantive, not only a short summary. At minimum it must include clearly labeled sections for: `Design Summary`, `Architecture Layers`, `Key Elements and Relationships`, `Software Units`, `Implementation Task Mapping`, and `Key Decisions / Rationale`.
  - Preferred presentation shape for the conversational architecture display:
    ```md
    # Architecture Design Draft

    ## Design Summary
    ...

    ## Architecture Layers
    ...

    ## Key Elements and Relationships
    ...

    ## Software Units
    ...

    ## Implementation Task Mapping
    ...

    ## Key Decisions / Rationale
    ...
    ```
  - Then call `question` for mandatory human review using a short decision-only prompt.
  - Use this approval prompt shape:
    - Title: `Architecture Review Needed`
    - Body:
      ```md
      ## Decision Needed
      - I have shown the architecture design in the conversation above.
      - Please choose `Approved` or `Needs Revision`.
      - If revision is needed, reply with the architecture section and requested change.
      ```
    - Options: [`Approved`, `Needs Revision (please type feedback)`]
  - If the human requests revision, update the design and repeat the review step. Do not return a final design result until explicit approval is given.
  - **Output**: Return JSON-like prose with `status: "approved"`, `design_summary`, `decision_notes`, `software_units`, `task_ids`, `architecture_layers`, `intention_model_status`, `legacy_fit_summary`, and `review_status` showing that human review completed.

2.  **On Implementation Clarification**
  - Analyze the question from `Implementation`.
  - Use `query_graph(mode="search", query="...")` or `query_graph(mode="architecture_element", query="...")` to find the relevant architectural context.
  - If needed, use `update_graph_model(action="record_decision", content="...")` to record an explicit clarification.
  - **Output**: Return a clear, actionable clarification directly to `Implementation`.

3.  **On Audit Gap Report**
  - Analyze the gap summary from `Audit`.
  - **If** the code deviation is acceptable, use `update_graph_model(action="record_decision", content="ModelUpdated: ...")`.
  - **If** the code must change, prefer reusing the incoming affected task IDs when the same logical implementation work is being retried so the orchestrator can preserve retry history. Create new task IDs only when the decomposition materially changes.
  - **If** the code must change, use `update_graph_model(action="bulk_add_tasks", tasksJson="[{\"title\":\"Refactor ...\",\"owner\":\"Implementation\"}]")` and optionally `update_graph_model(action="log_issue", kind="ArchitectureGap", title="...", content="...")`.
  - **Output**: Return JSON-like prose with `resolution`, `details`, optional `task_ids`, and `affected_task_ids` when an existing task remains the right retry target.