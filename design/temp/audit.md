# Part 1: The Architecture Change Report

### [TRACEABILITY - UPDATE]
*   **Element Name:** `VS Code`
*   **Code Paths:** `["package.json", "src/extension.ts"]`
*   **Reason:** `code_paths missing; extension contribution points and runtime command orchestration are implemented in these files.`

*   **Element Name:** `Github Copilot`
*   **Code Paths:** `["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md"]`
*   **Reason:** `code_paths missing; integration moved from manual copy-only usage to LM tool references (#ai4pb-init/#ai4pb-audit/#ai4pb-wrapup) and command-driven chat entry.`

*   **Element Name:** `Sparx EA`
*   **Code Paths:** `["script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/fetch_shared_script.py"]`
*   **Reason:** `code_paths missing; service behavior is implemented by bootstrap + shared exporter + script fetch helper.`

*   **Element Name:** `AI4PB VS插件`
*   **Code Paths:** `["src/extension.ts", "package.json", "README.md", "MARKETPLACE.md"]`
*   **Reason:** `code_paths missing/incomplete; component has grown to include workflow view, status actions, guided workflow, and Copilot tool integration.`

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `2 elements verified as already aligned and omitted from [TRACEABILITY - UPDATE] (WorkflowViewProvider, Release VSIX Toolchain).`

### [ELEMENT - ADD]
*   **Name:** `EA Script Utility Suite`
*   **Type:** `ApplicationComponent`
*   **Parent View:** `Application`
*   **Description:** `Repository-level EA automation utilities for schema import/export, STIX conversion, and diagram element placement that are currently major orphaned implementation files.`
*   **Attributes:** `code_paths = ["script/EA-jsscript/schema_json_to_diagram.js", "script/EA-jsscript/schema_diagram_to_json.js", "script/EA-jsscript/stix_to_ea.js", "script/EA-jsscript/ea_to_stix.js", "script/EA-jsscript/PUT-all-elements-on-diagram.js"]`

*   **Name:** `Post-Tools Utilities`
*   **Type:** `ApplicationComponent`
*   **Parent View:** `Application`
*   **Description:** `Post-processing toolkit for JSON diff, PDF merge, prompt assembly, and task scanning used in architecture analysis workflows.`
*   **Attributes:** `code_paths = ["script/post-tools/compare_json.py", "script/post-tools/merge_pdfs.py", "script/post-tools/prompt.py", "script/post-tools/scan_tasks.py"]`

*   **Name:** `Prompt Tool Registry`
*   **Type:** `ApplicationService`
*   **Parent View:** `Application`
*   **Description:** `LanguageModelTools service exposing init, audit, and wrap-up prompt retrieval endpoints consumed by Copilot Agent.`
*   **Attributes:** `code_paths = ["package.json", "src/extension.ts"]`

### [ELEMENT - MODIFY]
*   **Name:** `VS Code`
*   **Change Summary:** `Element is modeled as external IDE but lacks explicit repository traceability for extension-host integration points.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `VS Code is the host platform where AI4PB extension commands, views, and language model tools are contributed and executed.`
*   **TOBE Attributes:**
    *   `code_paths = ["package.json", "src/extension.ts"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Github Copilot`
*   **Change Summary:** `Current description/usage in relationships still implies manual prompt copy only, while code implements direct LM tools and one-click chat handoff.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `GitHub Copilot is integrated through registered language model tools and command-driven chat initiation to consume AI4PB prompt templates and execute architecture-guided workflows.`
*   **TOBE Attributes:**
    *   `code_paths = ["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Sparx EA`
*   **Change Summary:** `Element contains large script payload attribute but no normalized code_paths metadata for traceability and maintenance.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `Sparx EA service executes bootstrap and shared JScript exporters to produce architecture JSON artifacts and support model-driven delivery workflows.`
*   **TOBE Attributes:**
    *   `code_paths = ["script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/fetch_shared_script.py"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `AI4PB VS插件`
*   **Change Summary:** `Description under-specifies current runtime capabilities; element also lacks code_paths despite being the central implemented component.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `AI4PB VS插件 is a VS Code extension that orchestrates model-driven AI delivery through workflow webview actions, architecture context validation, guided iteration automation, design-code alignment report generation, wrap-up report generation, and Copilot prompt tool integration.`
*   **TOBE Attributes:**
    *   `code_paths = ["src/extension.ts", "package.json", "README.md", "MARKETPLACE.md"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `ProjectManagement`
*   **Change Summary:** `Element has prompt content attributes but lacks explicit code_paths mapping to prompt files, reducing traceability consistency.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `ProjectManagement packages task-list, task-support, and weekly-report prompt assets used for management-level planning outputs from the architecture model.`
*   **TOBE Attributes:**
    *   `code_paths = ["workprompt/task-list-prompt.md", "workprompt/task-support-prompt.md", "workprompt/weekly-report-prompt.md"]`
*   **TOBE Browser Path:** `N/A`

### [RELATIONSHIP - ADD]
*   **Source:** `AI4PB VS插件`
*   **Target:** `WorkflowViewProvider`
*   **Type:** `ArchiMate_Composition`
*   **Parent View:** `AI4PB VS插件`
*   **Description:** `WorkflowViewProvider is an internal structural part of the extension component and is instantiated by extension activation logic.`

*   **Source:** `AI4PB VS插件`
*   **Target:** `JSON Format of Archimate Model`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `Application`
*   **Description:** `Extension runtime reads architecture JSON path for refresh, precheck, start-iteration, and reporting flows.`

*   **Source:** `AI4PB VS插件`
*   **Target:** `ProjectManagement`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `Application`
*   **Description:** `Extension opens and operationalizes project-management prompt assets as part of model-guided delivery support.`

*   **Source:** `AI4PB VS插件`
*   **Target:** `Github Copilot`
*   **Type:** `ArchiMate_Triggering`
*   **Parent View:** `Application`
*   **Description:** `Extension commands trigger Copilot Chat sessions with ai4pb tool references for init/audit/wrap-up workflows.`


# Part 2: Business Gap Analysis
*   **Implemented Processes:**
    *   `Requirement Analysis And System Architecture Analysis` is partially implemented via architecture context refresh, JSON presence checks, and prompt/tool orchestration.
    *   `Implementation` is strongly implemented via guided workflow (`refresh -> precheck -> start iteration -> alignment -> wrap-up`) and generated runtime artifacts in `TEMP/`.
    *   `System Architecture Description` is actively consumed as the source-of-truth JSON (`design/KG/SystemArchitecture.json`).

*   **Missing Capabilities:**
    *   `TestAndVerification` has zero automated verification execution in extension runtime (no test command orchestration, no result ingestion).
    *   `Issue` / `BugOrIssue` feedback is not synchronized back into architecture task structures automatically.
    *   Strategy/motivation objects (`Goal`, `Value`, `Assessment`, `Principle`) have no direct measurable telemetry pipeline in code.

*   **Suggestions:**
    *   Add a verification command/service to run task-defined tests and persist machine-readable outcomes into `TEMP/` for model feedback.
    *   Add issue-sync utility that transforms audit and verification findings into normalized `project_info.tasks` update proposals.
    *   Add lightweight KPI extraction from reports (completion ratio, blocked ratio, stale-architecture age) and map to strategy elements.


# Part 3: Documentation & README Synchronization
*   **Reviewed READMEs:**
    *   **File:** `README.md`
    *   **File:** `workprompt/README.md`
    *   **File:** `script/EA-jsscript/README.md`

*   **Discrepancies:**
    *   `README.md` still emphasizes a 3-button main entry, while current extension behavior is status-card driven and includes direct Copilot actions plus additional command endpoints.
    *   `README.md` references guided flow conceptually but does not explicitly document generated artifact filenames/patterns (`design-code-alignment-*.md`, `wrap-up-*.md`, `iteration-state.json`).
    *   `workprompt/README.md` declares prompt output directories under `implementation/*`, whereas extension-generated operational artifacts are under `TEMP/*`; this dual-output model is not explicitly separated.
    *   `src/extension.ts` references bundled `docs/system-engineer-guidance.md`, but this file is absent in repository docs, creating documentation traceability risk.

*   **Recommended Updates (Not Applied):**
    *   Update root README with an explicit action-to-command map and exact generated artifact names/locations.
    *   Update `workprompt/README.md` with a clear split: LLM content outputs (`implementation/*`) vs extension runtime outputs (`TEMP/*`).
    *   Add or remove stale guidance reference by either creating `docs/system-engineer-guidance.md` or deleting this dependency from runtime checks.


# Part 4: Strategy & Architecture Compliance Report
*   **Compliance:** `PARTIAL`
*   **Violations:**
    *   `Separation of Concerns` is partial: `src/extension.ts` combines webview UI, config persistence, workflow orchestration, artifact checks, and reporting in one module.
    *   `Traceability` is partial: multiple key application/service elements lack standardized `code_paths`.
    *   `Verification-closure` is partial: strategy requires loop closure, but implementation has no automated test/verification execution or issue re-ingestion.
*   **Recommendations:**
    *   Refactor extension into bounded modules (`workflow`, `ui`, `config`, `reports`, `copilot-integration`) and map each to dedicated KG components.
    *   Enforce `code_paths` completeness in architecture governance checks for all Application Component/Service/Interface elements.
    *   Introduce verification and issue-sync services to close implementation -> test -> feedback loop.


# Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PARTIAL` with rationale: layered containers exist, but detailed implementation concerns are concentrated in overloaded `Application`, `Business`, and `System Architecture Description` views.
*   **Separation of Concerns:** `PARTIAL` with rationale: runtime orchestration, prompt assets, and extraction toolchain are mixed in single views.
*   **Hotspots:** `Application`, `Business`, `System Architecture Description`.

### [VIEW - ADD]
*   **View Name:** `Application - Extension Runtime Flow`
*   **Target Browser Path:** `Model/Application/Application/Application - Extension Runtime Flow`
*   **Purpose:** `Single concern this view explains: extension runtime orchestration and Copilot handoff`
*   **Description:** `Stakeholders: SystemEngineer, Developer. Concerns: runtime command flow, prompt/tool invocation, artifact generation. Purpose: explain how extension executes model-driven iteration. Scope: AI4PB VS插件, VS Code, Github Copilot, WorkflowViewProvider, JSON Format of Archimate Model, prompt data objects.`
*   **Included Elements:** `["1186", "1187", "1209", "1213", "1194", "1190", "1189", "1191", "1211"]`
*   **Included Relationships:** `["1056", "1062", "1088", "1089", "1090", "1091", "1077", "REL_NEW_AI4PB_to_WorkflowViewProvider_Composition", "REL_NEW_AI4PB_to_GithubCopilot_Triggering"]`
*   **Reason:** `Reduces cognitive load by isolating runtime behavior from extraction/toolchain concerns.`

*   **View Name:** `Application - EA Extraction & Script Tooling`
*   **Target Browser Path:** `Model/Application/Application/Application - EA Extraction & Script Tooling`
*   **Purpose:** `Single concern this view explains: EA export pipeline and supporting scripts`
*   **Description:** `Stakeholders: Enterprise Architect, SystemEngineer. Concerns: export script ownership, bootstrap decoupling, generated JSON provenance. Purpose: show extraction implementation chain from EA to JSON. Scope: Sparx EA, JSON格式模型提取JS脚本, JSON Format of Archimate Model, EA Script Utility Suite, Post-Tools Utilities.`
*   **Included Elements:** `["1193", "1210", "1194", "ELM_NEW_EA_Script_Utility_Suite", "ELM_NEW_Post_Tools_Utilities"]`
*   **Included Relationships:** `["1061", "1092", "1093", "REL_NEW_AI4PB_to_JSON_Access"]`
*   **Reason:** `Separates extraction/tooling concern from runtime UX concern.`

### [VIEW - MODIFY]
*   **View Name:** `Application`
*   **Current Browser Path:** `Model/Application/Application/Application`
*   **Target Browser Path:** `Model/Application/Application/Application Overview`
*   **Change:** `Rename / Narrow Scope`
*   **Before Scope:** `Mix of extension runtime flow, prompt assets, extraction links, and implementation details.`
*   **After Scope:** `High-level application inventory only, with drill-down references to focused subviews.`
*   **Description Update:** `Stakeholders: Architects, delivery leads. Concerns: application landscape boundaries. Purpose: top-level application map. Scope: key components/services and only essential cross-cutting relations.`

*   **View Name:** `StrategyAndMotivation`
*   **Current Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/StrategyAndMotivation`
*   **Target Browser Path:** `Model/StrategyAndMotivation/StrategyAndMotivation/Strategy & Motivation Core`
*   **Change:** `Narrow Scope / Re-layout`
*   **Before Scope:** `Currently under-populated (empty inclusion set), weak strategy visibility.`
*   **After Scope:** `Focused strategy layer with Goal/Driver/Assessment/Value/Principle/Constrain and explicit trace to requirements/outcomes.`
*   **Description Update:** `Stakeholders: Business stakeholders, Enterprise Architect. Concerns: why-change rationale, principles, constraints. Purpose: make strategic intent auditable. Scope: motivation elements and their requirement/outcome links.`

### [VIEW - SPLIT]
*   **Source View:** `Business`
*   **Source Browser Path:** `Model/Business/Business/Business`
*   **New Views:** `["Business - Delivery Lifecycle", "Business - Roles & Responsibilities"]`
*   **Target Browser Paths:** `["Model/Business/Business/Business - Delivery Lifecycle", "Model/Business/Business/Business - Roles & Responsibilities"]`
*   **Split Logic:** `Separate temporal process flow (Requirement->Implementation->Test->Issue loop) from actor assignment and responsibility mapping.`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description`

*   **Source View:** `System Architecture Description`
*   **Source Browser Path:** `Model/Business/Business/System Architecture Description/System Architecture Description`
*   **New Views:** `["System Architecture Description - Meta Model", "System Architecture Description - Strategy Trace"]`
*   **Target Browser Paths:** `["Model/Business/Business/System Architecture Description/System Architecture Description - Meta Model", "Model/Business/Business/System Architecture Description/System Architecture Description - Strategy Trace"]`
*   **Split Logic:** `Separate conceptual ArchiMate meta-structure from strategy/motivation trace relationships to keep each view within cognitive limits.`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description`

### [VIEW - MERGE]
*   **Source Views:** `["AI for Business", "SystemArchitecture"]`
*   **Source Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/AI for Business/AI for Business", "Model/AI-For-Project-Building-SystemArchitecture/SystemArchitecture"]`
*   **Target View:** `AI4PB Architecture Overview`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/AI4PB Architecture Overview`
*   **Merge Logic:** `Both are high-level overviews with sparse relationships; merging creates a single executive entry point before drill-down views.`
*   **Description Requirement:** `Merged target View description must include Stakeholders / Concerns / Purpose / Scope`

### [ELEMENT - MOVE]
*   **Element:** `JSON格式模型提取JS脚本`
*   **Current Browser Path:** `Model/Application/Application/JSON格式模型提取JS脚本`
*   **Target Browser Path:** `Model/Technology/Technology/EA Extraction Runtime/JSON格式模型提取JS脚本`
*   **Reason:** `Ownership clarity / SoC`

*   **Element:** `Release VSIX Toolchain`
*   **Current Browser Path:** `Model/Technology/Technology/Release VSIX Toolchain`
*   **Target Browser Path:** `Model/Technology/Technology/Build & Release/Release VSIX Toolchain`
*   **Reason:** `Ownership clarity / SoC`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1093 / Sparx EA --(ArchiMate_Access)--> JSON格式模型提取JS脚本`
*   **From View:** `Application`
*   **To View:** `Application - EA Extraction & Script Tooling`
*   **Reason:** `Readability / clutter reduction`

*   **Relationship:** `1062 / Github Copilot --(ArchiMate_Access)--> JSON Format of Archimate Model`
*   **From View:** `Application`
*   **To View:** `Application - Extension Runtime Flow`
*   **Reason:** `Readability / clutter reduction`

*   **Relationship:** `1095 / Requirement Analysis And System Architecture Analysis --(ArchiMate_Triggering)--> Implementation`
*   **From View:** `Business`
*   **To View:** `Business - Delivery Lifecycle`
*   **Reason:** `Readability / clutter reduction`
