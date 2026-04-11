---
name: product-manager-analysis-cycle
description: Manages the requirement analysis process, including human-in-the-loop clarification, final approval, and knowledge graph persistence.
---

# REQUIREMENT ANALYSIS & ELICITATION CYCLE

Use this skill to turn raw, unstructured ideas into formal, actionable requirements that downstream architecture work can use.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` containing the `Raw Requirement`.

## BEHAVIORAL RULES

1. **Phase 1: Analysis & Clarification**
   - Read the raw requirement. Identify missing business rules, edge cases, target audience, and non-functional requirements.
   - You MUST be context-aware before translating or formalizing the raw requirement. Treat the Shared Knowledge Graph as the source of historical product intent, constraints, and operational context.
   - Before drafting a clarification or formal requirement, you MUST use `query_graph(mode="search", scope="architecture", query="<keywords from new requirement>")` to retrieve relevant historical architecture elements related to the request.
   - From the query results, explicitly inspect for existing `Requirement`, `Constraint`, and `BusinessProcess` elements that may affect, narrow, or contradict the new request.
   - Perform an explicit impact and conflict analysis on the retrieved historical context. Compare the new raw requirement against prior requirements, constraints, and business processes to determine whether the new request reinforces them, changes them, or conflicts with them.
   - Conflict detection is mandatory, not optional. If the new request contradicts historical intent, policy, workflow, or behavior, you MUST surface that contradiction to the human before continuing. Example: a new rule requiring mandatory login conflicts with an older requirement that anonymous checkout must remain available.
   - Do not finalize, approve-seek, or persist a requirement that potentially overrides historical context unless the conflict has been made visible to the human and a resolution path has been chosen.
   - If the graph query returns no relevant historical context, say so explicitly in your reasoning and continue with clarification using the raw requirement as the current best available source of truth.
   - If there are ambiguities or missing critical details, use the `question` tool to ask the human.
   - If the impact analysis finds a likely contradiction, policy collision, or business-process mismatch, use the `question` tool even if the new requirement otherwise seems clear, because conflict resolution is itself a critical clarification step.
   - Every clarification request MUST use the following body template, with concise Markdown headings and no long unstructured paragraphs:
     ```md
     ## Goal
     [One-sentence description of the product goal]

     ## Impact & Potential Conflicts (Critical)
     - **Detected Constraints/History**: [List relevant existing rules found in the graph]
     - **Conflicts Found**: [Describe any contradictions between the new request and existing rules, or state "None detected"]

     ## Current Understanding & Assumptions
     - [What is understood]
     - [What has been assumed]

     ## Questions for Human (Including Conflict Resolution)
     1. [Question about missing details or HOW to resolve a specific conflict]
        - Why it matters: [reason]
        - Suggested options: [e.g., Option A: Override old rule / Option B: Support both via branching / Option C: Cancel new feature]
     2. [Question 2...]
        - Why it matters: [reason]
        - Suggested options: [Option A / Option B / free text]

     ## What Happens After Your Reply
     - I will refine the requirement spec based on your decisions and proceed to the approval step.
     ```
   - Ask at most 3 numbered questions in one round. Prefer grouped, high-signal questions over many small questions.
   - In the `Impact & Potential Conflicts (Critical)` section, name the most relevant retrieved historical items in business terms, not just by ID, so the human can understand what is at stake.
   - When conflicts are detected, each proposed option should reflect a strategic path such as overriding the old rule, supporting both behaviors behind an explicit boundary, or rejecting the new request.
   - Wait for the human's reply, update your understanding, and repeat until the requirement is clear and any detected conflict is explicitly resolved.

2. **Phase 2: Formalization & Human Approval (Mandatory)**
   - Draft a structured requirement specification (User Stories, Acceptance Criteria, Business Constraints).
   - The formal requirement MUST reflect the outcome of the Phase 1 impact and conflict analysis. If historical constraints, prior requirements, or business processes were found, carry their resolution forward explicitly into the PRD.
   - Include a dedicated backward-compatibility and conflict-resolution section so `SystemArchitect` can see whether the new requirement preserves, overrides, branches, or retires historical rules.
   - You MUST first present the complete PRD to the human as a normal conversational response in the main dialog area.
   - You MUST NOT ask for approval, call `question`, or return a final PM result before the full PRD has been displayed in normal conversation content.
   - The displayed PRD must be substantive, not a short summary. At minimum it must include clearly labeled sections for: `Goal`, `Scope`, `Backward Compatibility & Resolved Conflicts`, `User Stories / Usage Scenarios`, `Acceptance Criteria (Mandatory)`, `Constraints & Non-functional Requirements`, and `Open Questions / Assumptions` when applicable.
   - In `Backward Compatibility & Resolved Conflicts`, explicitly state how the new requirement interacts with existing rules, requirements, constraints, or business processes discovered during Phase 1. If none were found, say that no conflicting historical context was detected.
   - Acceptance criteria MUST be clear, testable, and unambiguous. Prefer Given/When/Then format unless another structure is materially clearer for the requirement.
   - Preferred presentation shape for the conversational PRD display:
     ```md
     # Formal Requirement Draft

     ## Goal
     ...

     ## Scope
     ...

     ## Backward Compatibility & Resolved Conflicts
     *(Explicitly state how this requirement interacts with or overrides specific existing rules/requirements)*
     ...

     ## User Stories / Usage Scenarios
     ...

     ## Acceptance Criteria (Mandatory)
     *(Must be clear, testable, and unambiguous. Preferably in Given/When/Then format)*
     ...

     ## Constraints & Non-functional Requirements
     ...

     ## Open Questions / Assumptions
     ...
     ```
   - After the full PRD has been shown, you MUST use the `question` tool only for the final decision.
   - The `question` body must stay short and must not repeat the PRD content.
   - Use this short approval body template:
     ```md
     ## Decision Needed
     - I have shown you the full PRD in the conversation above.
     - Please choose `Approved` or `Needs Revision`.
     - If revision is needed, reply with the section name and the requested change.

     ## After Approval
     - I will persist the full PRD and hand it off to the next stage.
     ```
   - Example `question` usage:
     - Title: "Requirement Approval Needed"
     - Body: "[Use the short approval template above. Do not include the PRD again.]"
     - Options:["Approved", "Needs Revision (please type feedback)"]
   - If the human selects "Needs Revision" or provides feedback, incorporate the feedback and return to Phase 2. Do not proceed until explicit approval is given.

3. **Phase 3: Persistence & Handoff**
   - ONCE APPROVED, use the exact full PRD that was shown in the conversation and persist it with `update_graph_model(action="add_element", elementType="Requirement", title="Formal Requirement", content="[Approved Full PRD]")`.
   - (Optional) Use `update_graph_model(action="reset_runtime")` to update `state.activeGoal` with the refined requirement.
   - Return a direct structured result to `ProjectOrchestrator` containing: `status: "approved"`, `formal_requirement`, and `element_id`.