# SKILL: AI4PB_DESIGN_AUDIT

## Skill Definition
- Skill ID: `ai4pb-audit`
- Role: Expert Software Architect and ArchiMate Modeler
- Primary Goal: Generate architecture audit and change report against as-built implementation

**Role:** Expert Software Architect and ArchiMate Modeler.

**Context:**
You have just completed the coding implementation for **the system of this project**. I need you to audit the "As-Built" architecture against the provided "As-Designed" Knowledge Graph.

**Input Data:**
1.  **The Codebase:** The file structure, classes, API endpoints, database models, and configuration files you have just generated/analyzed.
2.  **The Current Architecture:** **YOU MUST READ** the file `design\KG\SystemArchitecture.json` to understand the architecture.

**Constraint:**
**DO NOT** output the full JSON. Provide a structured **Audit & Change Report** in a temporary markdown file `design\temp\audit.md` only. I will use this report to manually update my modeling tool.

**Task 1: Traceability Recovery & Architecture Audit (The "Diff" Report)**
Compare the `design\KG\SystemArchitecture.json` content against your actual code implementation.

*   **Traceability Recovery (CRITICAL):**
    *   **Goal:** Every Application Component, Service, and Interface in the JSON *must* link to specific files in the codebase.
    *   **Action:** Verify the `code_paths` attribute for every element. If it is missing, incorrect, or incomplete, you must flag it for update.
    *   **Inclusion Rule (STRICT):** Only include elements in `[TRACEABILITY - UPDATE]` when a change is required (`code_paths` missing/incorrect/incomplete, or element metadata must be corrected). If an element is already aligned, do **not** include it in the report.
    *   **Reverse Check:** Ensure no major code file is "orphaned" (not linked to an Architecture Element). If a file exists but has no corresponding element, it triggers an `[ELEMENT - ADD]` request.

*   **Elements (Add):**
    *   Identify major components (Python modules, Docker containers, React Contexts, Middleware) in the code that are currently missing from the graph.
    *   **CRITICAL:** You MUST specify which **View** the new element belongs to (e.g., inside "AI Security Orchestrator (Backend)" or "Technology Layer").

*   **Elements (Modify):**
    *   **Description & Tech Stack:** If the code uses a different library (e.g., ChromaDB instead of Milvus) or a different logic flow, request a change to the `name` and `description`.
    *   **Attributes:** Update `code_paths` and metadata.
    *   **TOBE Content (MANDATORY):** Do not provide only suggestions. For every `[ELEMENT - MODIFY]`, you MUST provide complete target-state (`TOBE`) content for every changed field, including full replacement text for `description` and full replacement value for any changed attributes.
    *   **Location:** Verify if the element is in the correct View. If the code suggests it belongs elsewhere (e.g., moved from "Core" to "Utils"), note this.

*   **Elements (Delete vs. Future):**
    *   **Delete:** If an element represents an abandoned approach or a library that was definitely *not* used.
    *   **Mark as Future:** If an element (e.g., a specific Plugin) is in the design but **not yet implemented**, do not delete it. Recommend updating its description to start with "[PROPOSED]".

*   **Relationships:**
    *   Analyze imports, dependency injection, API calls, and TCP connections.
    *   **View Placement (STRICT):** Every proposed relationship must specify where it should be modeled (the exact view name in the architecture JSON).
    *   **Use precise ArchiMate logic:**
        *   `ArchiMate_Realization` (Class implements Interface).
        *   `ArchiMate_Serving` (Infrastructure hosts App).
        *   `ArchiMate_Access` (App reads/writes DB).
        *   `ArchiMate_Composition` (Parent module contains Sub-module).
        *   `ArchiMate_Triggering` (Event triggers Task).

**Task 2: Business Layer Consulting (Gap Analysis)**
Review the `BusinessLayer` nodes in the JSON against your code.
*   **Coverage:** Which business processes are successfully supported by the code?
*   **Gaps:** Which business processes exist in the design but have *zero* code implementation?
*   **Suggestions:** Specific technical recommendations to bridge the gaps.

**Task 3: Comprehensive README & Documentation Update**
*   **Scope:** Review **ALL** `README.md` files throughout the codebase (root and subdirectories).
*   **Action:** Perform a **read-only discrepancy audit** against the current implementation and architecture graph. Do **not** modify README content.
*   **Consistency:** Verify that README descriptions match component responsibilities defined in the architecture.
*   **Output:** In the final report, list reviewed README files and document discrepancies, risks, and recommended wording updates (without applying them).

**Task 4: Strategy & Architecture Compliance Review**
*   **Goal:** Verify that the implementation obeys the high-level strategy and architecture principles.
*   **Strategy Source:** Review the "Strategy" and "Motivation" layers in the provided KG.
*   **Compliance Check:**
    *   Are the key architectural principles (e.g., Separation of Concerns, Modularity, Security-First) respected in the code?
    *   Does the implementation align with the strategic goals (e.g., Scalability, Extensibility)?
*   **Reporting:** Highlight any deviations or violations of the strategy.

**Task 5: Knowledge Graph Structure Reorganization (CRITICAL)**
Reorganize the architecture structure proposal using **Progressive Disclosure** and **Separation of Concerns** principles.

*   **Progressive Disclosure Rules:**
    *   Propose a layered reading path from high-level to detailed (e.g., Strategy → Business → Application → Technology).
    *   Ensure each View is cognitively scoped (target 7-15 elements per View, avoid overloaded diagrams).
    *   Split overloaded Views into focused Views by concern (e.g., runtime flow, data access, security controls, async processing).
    *   Introduce drill-down structure: high-level overview Views plus detailed subordinate Views.
    *   For **every View** (existing and newly proposed), include viewpoint fields directly inside that View's description using: `Stakeholders`, `Concerns`, `Purpose`, `Scope` as a separate standalone viewpoint section.

*   **Separation of Concerns Rules:**
    *   Separate capability concerns clearly (orchestration, plugin runtime, data governance, identity/access, observability, infrastructure).
    *   Reduce mixed responsibilities inside single elements; recommend split/merge when needed.
    *   Keep cross-layer relationships explicit and minimal per View; avoid relation clutter.
    *   Ensure each element has one primary ownership location (browser path) and is referenced from Views by inclusion.

*   **Required Reorganization Actions:**
    *   **[VIEW - ADD]** when a new focused viewpoint is needed.
    *   **[VIEW - MODIFY]** when an existing View should be narrowed, renamed, or re-scoped.
    *   **[VIEW - SPLIT]** when one View should become multiple Views.
    *   **[VIEW - MERGE]** when redundant Views should be consolidated.
    *   **[ELEMENT - MOVE]** when browser path/location should change for ownership clarity.
    *   **[RELATIONSHIP - MOVE]** when a relationship should be shown in a different View for readability.
    *   **[VIEW BROWSER LOCATION - STRICT]:** Every View action above MUST include explicit browser location using `browser_path` style paths. If proposing a new View, provide its exact target browser path. If modifying/splitting/merging, provide both current and target browser paths.

*   **Constraint:**
    *   Do not delete information solely for simplification.
    *   Preserve architecture completeness while improving readability.
    *   Use current JSON structure terms: `elements`, `relationships`, `views`, `browser_path`.

**Output Format:**

**Part 1: The Architecture Change Report**
Please use this exact format for easy parsing:

### [TRACEABILITY - UPDATE]
*   **Element Name:** `Existing Element Name` (Use exact ID or Name from JSON)
*   **Code Paths:** `["path/to/implementation_file.py", "path/to/class_file.py"]`
*   **Reason:** `New implementation / Refactoring / Correction required`

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `N elements verified as already aligned and omitted from [TRACEABILITY - UPDATE]`.

### [ELEMENT - ADD]
*   **Name:** `Exact Code Name`
*   **Type:** `ApplicationComponent` (or other ArchiMate type)
*   **Parent View:** `Exact View Name` (Must exist in JSON)
*   **Description:** `1-sentence description.`
*   **Attributes:** `code_paths = ["path/to/file.py"]`

### [ELEMENT - MODIFY]
*   **Name:** `Existing Element Name`
*   **Change Summary:** Description of why this change is needed.
*   **TOBE Name:** `Complete replacement value or N/A`
*   **TOBE Description:** `Complete replacement description text (full content, not delta)`
*   **TOBE Attributes:**
    *   `attribute_name_1 = complete replacement value`
    *   `attribute_name_2 = complete replacement value`
*   **TOBE Browser Path:** `Complete replacement path or N/A`

### [RELATIONSHIP - ADD]
*   **Source:** `Element A`
*   **Target:** `Element B`
*   **Type:** `Serving` (or other ArchiMate relationship)
*   **Parent View:** `Exact View Name` (Must exist in JSON)
*   **Description:** `Why this exists.`

**Part 2: Business Gap Analysis**
*   **Implemented Processes:** ...
*   **Missing Capabilities:** ...

**Part 3: Documentation & README Synchronization**
*   **Reviewed READMEs:**
    *   **File:** `path/to/README.md`
*   **Discrepancies:** Detail any specific discrepancies found between the code and the documentation.
*   **Recommended Updates (Not Applied):** Summarize the exact changes that should be made.

**Part 4: Strategy & Architecture Compliance Report**
*   **Compliance:** (PASS / FAIL / PARTIAL)
*   **Violations:** Describe any violations of architecture principles (e.g. coupling issues, missing layers).
*   **Recommendations:** Suggest corrective actions to align implementation with strategy.

**Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)**

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PASS / PARTIAL / FAIL` with rationale.
*   **Separation of Concerns:** `PASS / PARTIAL / FAIL` with rationale.
*   **Hotspots:** List the top cluttered Views/elements causing cognitive overload.

### [VIEW - ADD]
*   **View Name:** `New View Name`
*   **Target Browser Path:** `Model/.../.../New View Name`
*   **Purpose:** `Single concern this view explains`
*   **Description:** `Must include Stakeholders / Concerns / Purpose / Scope in plain text`
*   **Included Elements:** `["id1", "id2", ...]`
*   **Included Relationships:** `["id1", "id2", ...]`
*   **Reason:** `Why this reduces cognitive load`

### [VIEW - MODIFY]
*   **View Name:** `Existing View Name`
*   **Current Browser Path:** `Model/.../.../Existing View Name`
*   **Target Browser Path:** `Model/.../.../Updated View Name`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Current concern mix`
*   **After Scope:** `New focused concern`
*   **Description Update:** `Include Stakeholders / Concerns / Purpose / Scope in plain text`

### [VIEW - SPLIT]
*   **Source View:** `Existing overloaded View`
*   **Source Browser Path:** `Model/.../.../Existing overloaded View`
*   **New Views:** `["View A", "View B", ...]`
*   **Target Browser Paths:** `["Model/.../.../View A", "Model/.../.../View B", ...]`
*   **Split Logic:** `Concern boundaries used for split`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description`

### [VIEW - MERGE]
*   **Source Views:** `["View A", "View B"]`
*   **Source Browser Paths:** `["Model/.../.../View A", "Model/.../.../View B"]`
*   **Target View:** `Merged View Name`
*   **Target Browser Path:** `Model/.../.../Merged View Name`
*   **Merge Logic:** `Why these views are redundant`
*   **Description Requirement:** `Merged target View description must include Stakeholders / Concerns / Purpose / Scope`

### [ELEMENT - MOVE]
*   **Element:** `ID or Name`
*   **Current Browser Path:** `current/path`
*   **Target Browser Path:** `target/path`
*   **Reason:** `Ownership clarity / SoC`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `ID or statement`
*   **From View:** `View Name`
*   **To View:** `View Name`
*   **Reason:** `Readability / clutter reduction`

