# Part 1: The Architecture Change Report

### [TRACEABILITY - UPDATE]
*   **Element Name:** `AI4PB VS插件` (ID `1209`)
*   **Code Paths:** `["src/extension.ts", "package.json", "README.md", "MARKETPLACE.md"]`
*   **Reason:** `Metadata correction required: current implementation includes Skill Chat auto-routing, auto-confirm dispatch, and EA status actions that are not reflected in the element description.`

### [TRACEABILITY - UPDATE]
*   **Element Name:** `WorkflowViewProvider` (ID `1213`)
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** `Metadata correction required: implementation now covers webview rendering, chat request handling, auto skill suggestion, auto confirm dispatch, and status action routing, not only basic command dispatch.`

### [TRACEABILITY - UPDATE]
*   **Element Name:** `EA Script Utility Suite` (ID `1214`)
*   **Code Paths:** `["script/EA-jsscript/JSON-Parser.js", "script/EA-jsscript/project_auto_gen.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js", "script/EA-jsscript/PUT-all-elements-on-diagram.js", "script/EA-jsscript/schema_diagram_to_json.js", "script/EA-jsscript/schema_json_to_diagram.js", "script/EA-jsscript/stix_to_ea.js", "script/EA-jsscript/ea_to_stix.js"]`
*   **Reason:** `Correction required: current folder-level code_paths is too broad for strict traceability and does not explicitly enumerate the implemented utility scripts.`

### [TRACEABILITY - UPDATE]
*   **Element Name:** `EA SQL Audit Queries` (ID `1222`)
*   **Code Paths:** `["script/EA-sqlscript/MyToDoIssueSearch.sql", "script/EA-sqlscript/searchalltodoandissues.sql", "script/EA-sqlscript/searchforaudit-withelementid.sql", "script/EA-sqlscript/Searchforaudit-withelementname.sql", "script/EA-sqlscript/searchforaudit-withconnectorid.sql"]`
*   **Reason:** `Correction required: existing workspace contains searchalltodoandissues.sql, but current metadata omits it.`

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `7 application/service/technology elements were verified as already aligned and omitted from [TRACEABILITY - UPDATE].`

### [ELEMENT - ADD]
*   **Name:** `AUTO Skill Router`
*   **Type:** `ApplicationService`
*   **Parent View:** `Runtime Interaction Flow`
*   **Description:** `Service that analyzes freeform user requests, ranks AI4PB skills, and dispatches the confirmed prompt reference to Copilot.`
*   **Attributes:** `code_paths = ["src/extension.ts"]`

### [ELEMENT - MODIFY]
*   **Name:** `AI4PB VS插件`
*   **Change Summary:** `Extension responsibilities expanded from command orchestration to interactive Skill Chat routing and auto-confirm flow dispatch.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `AI4PB VS插件 is a VS Code extension that orchestrates model-driven AI delivery through workflow webview actions, Skill Chat auto-routing, architecture context validation, guided iteration automation, design-code alignment report generation, wrap-up report generation, and Copilot prompt tool integration.`
*   **TOBE Attributes:**
    *   `code_paths = ["src/extension.ts", "package.json", "README.md", "MARKETPLACE.md"]`
*   **TOBE Browser Path:** `N/A`

### [ELEMENT - MODIFY]
*   **Name:** `WorkflowViewProvider`
*   **Change Summary:** `Element description is narrower than the implemented behavior and should reflect the new Skill Chat runtime responsibilities.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `WorkflowViewProvider is the sidebar webview runtime that renders Skill Chat, captures user requests, performs auto skill suggestion and confirmation handling, and dispatches workflow and status actions to extension commands.`
*   **TOBE Attributes:**
    *   `code_paths = ["src/extension.ts"]`
*   **TOBE Browser Path:** `N/A`

### [ELEMENT - MODIFY]
*   **Name:** `EA Script Utility Suite`
*   **Change Summary:** `Current traceability is too coarse and should enumerate concrete implemented files for reverse lookup and maintenance.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `EA Script Utility Suite groups the repository-level EA automation utilities for JSON export, task extraction, schema conversion, STIX conversion, and diagram placement support used around the AI4PB modeling workflow.`
*   **TOBE Attributes:**
    *   `code_paths = ["script/EA-jsscript/JSON-Parser.js", "script/EA-jsscript/project_auto_gen.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js", "script/EA-jsscript/PUT-all-elements-on-diagram.js", "script/EA-jsscript/schema_diagram_to_json.js", "script/EA-jsscript/schema_json_to_diagram.js", "script/EA-jsscript/stix_to_ea.js", "script/EA-jsscript/ea_to_stix.js"]`
*   **TOBE Browser Path:** `N/A`

### [ELEMENT - MODIFY]
*   **Name:** `EA SQL Audit Queries`
*   **Change Summary:** `SQL asset inventory is incomplete and misses an existing repository query file.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `EA SQL Audit Queries provides SQL scripts used by EA-side audit and lookup workflows to locate target elements, connectors, todos, issues, and pending architecture governance items.`
*   **TOBE Attributes:**
    *   `code_paths = ["script/EA-sqlscript/MyToDoIssueSearch.sql", "script/EA-sqlscript/searchalltodoandissues.sql", "script/EA-sqlscript/searchforaudit-withelementid.sql", "script/EA-sqlscript/Searchforaudit-withelementname.sql", "script/EA-sqlscript/searchforaudit-withconnectorid.sql"]`
*   **TOBE Browser Path:** `N/A`

### [RELATIONSHIP - ADD]
*   **Source:** `AI4PB VS插件`
*   **Target:** `AUTO Skill Router`
*   **Type:** `ArchiMate_Realization`
*   **Parent View:** `Runtime Interaction Flow`
*   **Description:** `The extension implementation realizes the automatic skill-routing service inside src/extension.ts.`

### [RELATIONSHIP - ADD]
*   **Source:** `WorkflowViewProvider`
*   **Target:** `AUTO Skill Router`
*   **Type:** `ArchiMate_Triggering`
*   **Parent View:** `Runtime Interaction Flow`
*   **Description:** `Incoming chat requests from the webview trigger automatic skill analysis and confirmation flow.`

### [RELATIONSHIP - ADD]
*   **Source:** `AUTO Skill Router`
*   **Target:** `Github Copilot`
*   **Type:** `ArchiMate_Triggering`
*   **Parent View:** `Runtime Interaction Flow`
*   **Description:** `After analysis or confirmation, the router dispatches the selected AI4PB prompt reference into Copilot.`

# Part 2: Business Gap Analysis
*   **Implemented Processes:**
    *   `Requirement Analysis And System Architecture Analysis` is partially supported by EA export scripts, architecture JSON loading, prompt tool exposure, and Skill Chat routing over the architecture context.
    *   `Implementation` is supported by AI4PB workflow entry points for task list, init, task support, iteration issues, audit, wrap-up, iteration summary, and weekly report dispatch.
    *   `Architecture context handoff` from Sparx EA to Copilot is implemented through `design/KG/SystemArchitecture.json`, `src/extension.ts`, and the EA JScript export assets.
    *   `Manual Acceptance Gate` is documented and can be guided by prompts, but it is not enforced as a runtime control point in the extension.
*   **Missing Capabilities:**
    *   `TestAndVerification` has no executable automated verification, test run orchestration, or results ingestion in the current extension runtime.
    *   `Issue/BugOrIssue` feedback remains document-driven and manual; there is no structured sync from validation evidence back into architecture status.
    *   `StrategyAndMotivation` coverage in code is indirect only; no feature explicitly manages Goal/Driver/Assessment lifecycle in the runtime.
*   **Suggestions:**
    *   `Add a verification bridge` that can collect task/test evidence from build output, problem reports, or scripted test execution before wrap-up.
    *   `Add issue evidence capture` so iteration issues can be linked to changed files and validation results, then exported back into EA governance artifacts.
    *   `Add strategy-facing metadata checks` so business goals and principles are not left as passive documentation only.

# Part 3: Documentation & README Synchronization
*   **Reviewed READMEs:**
    *   **File:** `README.md`
    *   **File:** `docs/getting-started/README.md`
    *   **File:** `workprompt/README.md`
    *   **File:** `script/EA-jsscript/README.md`
*   **Discrepancies:**
    *   `README.md` and `MARKETPLACE.md` list prompt tools but omit `#ai4pb-iteration-summary`, while `package.json` and `src/extension.ts` clearly register and expose it.
    *   `docs/getting-started/05-scrum-workflow.md` describes task list, task support, and other document outputs as if the extension itself guarantees file generation. The real implementation launches Copilot with prompt references; file output depends on prompt execution, not extension-side automation.
    *   `workprompt/README.md` does not explicitly document that the design-audit prompt writes to `design/temp/audit.md`, even though that output path is part of the prompt contract.
    *   `script/EA-jsscript/README.md` does not mention `searchalltodoandissues.sql`, which now exists in the repository and should be reflected in architecture traceability.
*   **Recommended Updates (Not Applied):**
    *   `README.md` and `MARKETPLACE.md`: add `#ai4pb-iteration-summary` to the prompt-tool list and mention the corresponding command entry.
    *   `docs/getting-started/05-scrum-workflow.md`: change wording from guaranteed extension output to `Copilot executes the prompt and may generate the target file when the prompt instructions are followed`.
    *   `workprompt/README.md`: add the audit output contract `design/temp/audit.md` under `reverse-engineer-WHOLE.md`.
    *   `script/EA-jsscript/README.md`: add `searchalltodoandissues.sql` to the SQL asset inventory and align the wording with the `EA SQL Audit Queries` element.

# Part 4: Strategy & Architecture Compliance Report
*   **Compliance:** `PARTIAL`
*   **Violations:**
    *   `Separation of Concerns` is only partial: `src/extension.ts` centralizes UI rendering, workflow orchestration, prompt tool registration, config handling, auto-routing, and report generation.
    *   `Progressive Disclosure` is only partial in the KG: `StrategyAndMotivation` view is effectively empty, while `System Architecture Description` is overloaded and mixes multiple concern types.
    *   `Closed-loop verification` is partial: the modeled `TestAndVerification` process is still mostly manual and prompt-driven rather than executable inside the implementation.
    *   `Ownership clarity` is partial: strategy elements such as `Goal`, `Driver`, and `Assessment` currently live under a Business browser path instead of a Strategy/Motivation ownership path.
*   **Recommendations:**
    *   `Refactor runtime ownership` into focused modules such as workflow-view, auto-routing, prompt registry, configuration, and reporting, then mirror those units in the KG.
    *   `Populate the StrategyAndMotivation layer` with explicit viewpoint content and move strategy-owned elements out of the Business subtree.
    *   `Add machine-checkable governance` for traceability existence checks and verification evidence before release or wrap-up.

# Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PARTIAL` with rationale: the model has top-level layers and some drill-down views, but `StrategyAndMotivation` is empty and `System Architecture Description` is overloaded with 20 included elements.
*   **Separation of Concerns:** `PARTIAL` with rationale: strategy concepts are owned under a Business browser path, and the `Application` view mixes runtime, prompt assets, and EA-side integration concerns.
*   **Hotspots:** `System Architecture Description`, `Application`, `AI4PB VS插件` subtree.

### [VIEW - ADD]
*   **View Name:** `Auto Skill Routing`
*   **Target Browser Path:** `Model/Application/Application/Auto Skill Routing`
*   **Purpose:** `Single concern this view explains`
*   **Description:** `Stakeholders: SystemEngineer, Developer. Concerns: how freeform requests are classified, confirmed, and dispatched into Copilot. Purpose: isolate automatic workflow routing from the broader runtime flow. Scope: AI4PB VS插件, WorkflowViewProvider, AUTO Skill Router, Github Copilot, and Prompt Tool Registry.`
*   **Included Elements:** `["1209", "1213", "AUTO Skill Router", "1187", "1219"]`
*   **Included Relationships:** `["1098", "1100", "1104", "AI4PB VS插件 --(ArchiMate_Realization)--> AUTO Skill Router", "WorkflowViewProvider --(ArchiMate_Triggering)--> AUTO Skill Router", "AUTO Skill Router --(ArchiMate_Triggering)--> Github Copilot"]`
*   **Reason:** `Creates a focused drill-down for the newly implemented auto-routing capability and reduces runtime cognitive load.`

### [VIEW - MODIFY]
*   **View Name:** `StrategyAndMotivation`
*   **Current Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/StrategyAndMotivation`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/StrategyAndMotivation`
*   **Change:** `Narrow Scope / Re-layout`
*   **Before Scope:** `Empty placeholder view with no usable strategy reading path.`
*   **After Scope:** `Focused strategy ownership view for Goal, Driver, Assessment, Stakeholder, Value, Principle, and Constraint.`
*   **Description Update:** `Stakeholders: Enterprise architect, product owner. Concerns: strategic intent, design principles, and motivation traceability. Purpose: make strategy assumptions explicit before business/application drill-down. Scope: only strategy and motivation concepts and their direct relations.`

### [VIEW - MODIFY]
*   **View Name:** `Application`
*   **Current Browser Path:** `Model/Application/Application/Application`
*   **Target Browser Path:** `Model/Application/Application/Application Overview`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Mixed static landscape, EA integration, prompt assets, and runtime relations in one place.`
*   **After Scope:** `Top-level application ownership map only: VS Code, Github Copilot, AI4PB VS插件, Sparx EA, Prompt Tool Registry, SKILLS, JSON Format of Archimate Model, and Post-Tools/Release support.`
*   **Description Update:** `Stakeholders: Solution architect, maintainer. Concerns: application ownership boundaries and primary runtime building blocks. Purpose: provide a concise application landscape before opening detailed runtime or prompt views. Scope: top-level components and services only.`

### [VIEW - SPLIT]
*   **Source View:** `System Architecture Description`
*   **Source Browser Path:** `Model/Business/Business/System Architecture Description/System Architecture Description`
*   **New Views:** `["Architecture Motivation Map", "Architecture Meta-Model Reference"]`
*   **Target Browser Paths:** `["Model/Business/Business/System Architecture Description/Architecture Motivation Map", "Model/Business/Business/System Architecture Description/Architecture Meta-Model Reference"]`
*   **Split Logic:** `Separate strategic motivation concepts (Goal/Driver/Assessment/Stakeholder/Value/Principle/Constraint/CourseOfAction/Outcome/StrategyBehavior) from architecture-definition objects (System Requirement/Core Gap/Target Architectures/Value Stream/Capability/Resource).`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description`

### [VIEW - MERGE]
*   **Source Views:** `["AI4PB VS插件", "AI4PB VS插件-infrustracture"]`
*   **Source Browser Paths:** `["Model/Application/Application/AI4PB VS插件/AI4PB VS插件", "Model/Application/Application/AI4PB VS插件/AI4PB VS插件-infrustracture"]`
*   **Target View:** `AI4PB Extension Runtime`
*   **Target Browser Path:** `Model/Application/Application/AI4PB VS插件/AI4PB Extension Runtime`
*   **Merge Logic:** `Both views belong to the same extension bounded context and are currently too small to justify separate diagrams; merge them and keep deeper concerns in Runtime Interaction Flow and Auto Skill Routing.`
*   **Description Requirement:** `Merged target View description must include Stakeholders / Concerns / Purpose / Scope`

### [ELEMENT - MOVE]
*   **Element:** `Goal` (ID `1202`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Goal`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Goal`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Driver` (ID `1203`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Driver`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Driver`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Assessment` (ID `1204`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Assessment`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Assessment`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Stakeholder` (ID `1205`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Stakeholder`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Stakeholder`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Constrain` (ID `1206`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Constrain`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Constrain`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Principle` (ID `1207`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Principle`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Principle`
*   **Reason:** `Ownership clarity / SoC`

### [ELEMENT - MOVE]
*   **Element:** `Value` (ID `1208`)
*   **Current Browser Path:** `Model/Business/Business/System Architecture Description/Value`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Value`
*   **Reason:** `Ownership clarity / SoC`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1093 / Sparx EA --(ArchiMate_Access)--> JSON格式模型提取JS脚本`
*   **From View:** `Application`
*   **To View:** `EA JSSCRIPT`
*   **Reason:** `Readability / clutter reduction`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1058 / Github Copilot --(ArchiMate_Access)--> SKILLS`
*   **From View:** `Application`
*   **To View:** `Prompt Asset Supply`
*   **Reason:** `Readability / clutter reduction`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1080 / Driver --(drive)--> Goal`
*   **From View:** `System Architecture Description`
*   **To View:** `StrategyAndMotivation`
*   **Reason:** `Readability / ownership focus`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1082 / Assessment --(drive)--> Goal`
*   **From View:** `System Architecture Description`
*   **To View:** `StrategyAndMotivation`
*   **Reason:** `Readability / ownership focus`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1083 / Stakeholder --(has)--> Driver`
*   **From View:** `System Architecture Description`
*   **To View:** `StrategyAndMotivation`
*   **Reason:** `Readability / ownership focus`
