# Part 1: The Architecture Change Report

### [TRACEABILITY - UPDATE]
*   **Element Name:** `VS Code`
*   **Code Paths:** `["package.json", "src/extension.ts"]`
*   **Reason:** `code_paths missing; extension contribution points (views/commands/tools) and host integration are implemented in these files.`

*   **Element Name:** `Github Copilot`
*   **Code Paths:** `["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md", "workprompt/task-list-prompt.md", "workprompt/task-support-prompt.md", "workprompt/weekly-report-prompt.md", "workprompt/iteration-issues-prompt.md"]`
*   **Reason:** `code_paths missing/incomplete; Copilot integration now includes seven LM tool references and skill-routed chat invocation paths.`

*   **Element Name:** `Sparx EA`
*   **Code Paths:** `["script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js"]`
*   **Reason:** `existing code_paths are incomplete; active EA service behavior includes exporter bootstrap and task/issue extraction scripts.`

*   **Element Name:** `Prompt Tool Registry`
*   **Code Paths:** `["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md", "workprompt/task-list-prompt.md", "workprompt/task-support-prompt.md", "workprompt/weekly-report-prompt.md", "workprompt/iteration-issues-prompt.md"]`
*   **Reason:** `existing code_paths are incomplete; service implementation includes tool registration plus concrete prompt assets delivered by each tool.`

*   **Element Name:** `SKILLS`
*   **Code Paths:** `[".github/skills/ai4pb-workflows/SKILL.md", ".github/skills/ai4pb-init/SKILL.md", ".github/skills/ai4pb-task-list/SKILL.md", ".github/skills/ai4pb-task-support/SKILL.md", ".github/skills/ai4pb-iteration-issues/SKILL.md", ".github/skills/ai4pb-audit/SKILL.md", ".github/skills/ai4pb-wrapup/SKILL.md", ".github/skills/ai4pb-weekly-report/SKILL.md"]`
*   **Reason:** `code_paths missing; current implementation models skills as repository assets consumed by Copilot skill references.`

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `5 elements verified as already aligned and omitted from [TRACEABILITY - UPDATE].`

### [ELEMENT - ADD]
*   **Name:** `Post-Tools Utilities`
*   **Type:** `ApplicationComponent`
*   **Parent View:** `Application`
*   **Description:** `Repository post-processing utilities provide JSON comparison, PDF merge, prompt utility logic, and task scanning support for architecture governance workflows.`
*   **Attributes:** `code_paths = ["script/post-tools/compare_json.py", "script/post-tools/merge_pdfs.py", "script/post-tools/prompt.py", "script/post-tools/scan_tasks.py"]`

*   **Name:** `EA SQL Audit Queries`
*   **Type:** `ApplicationService`
*   **Parent View:** `EA JSSCRIPT`
*   **Description:** `SQL-based audit and task discovery queries support EA-side extraction and architecture audit preparation.`
*   **Attributes:** `code_paths = ["script/EA-sqlscript/MyToDoIssueSearch.sql", "script/EA-sqlscript/Searchforaudit.sql"]`

### [ELEMENT - MODIFY]
*   **Name:** `VS Code`
*   **Change Summary:** `Host component lacks explicit traceability attributes for implemented contribution points.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `VS Code is the host runtime that loads the AI4PB extension, renders the workflow webview, exposes registered commands, and brokers language model tool execution for Copilot chat.`
*   **TOBE Attributes:**
    *   `code_paths = ["package.json", "src/extension.ts"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Github Copilot`
*   **Change Summary:** `Integration scope expanded to full skill-set tool references but metadata only partially reflects this.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `GitHub Copilot consumes AI4PB language model tools and skill references to execute init, task planning, task support, iteration issue handling, audit, wrap-up, and weekly reporting workflows driven by architecture context.`
*   **TOBE Attributes:**
    *   `code_paths = ["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md", "workprompt/task-list-prompt.md", "workprompt/task-support-prompt.md", "workprompt/weekly-report-prompt.md", "workprompt/iteration-issues-prompt.md"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Sparx EA`
*   **Change Summary:** `Service currently tracks only exporter scripts while active task/issue extraction scripts are also core service behavior.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `Sparx EA executes bootstrap-driven JScript automation to export architecture JSON and to extract active tasks/issues for LLM-driven delivery loops.`
*   **TOBE Attributes:**
    *   `code_paths = ["script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Prompt Tool Registry`
*   **Change Summary:** `Service implementation is correctly present but asset-level prompt traceability is incomplete.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `Prompt Tool Registry is the extension-level language model tool service that registers and serves all AI4PB prompt templates to Copilot by stable tool names and references.`
*   **TOBE Attributes:**
    *   `code_paths = ["package.json", "src/extension.ts", "workprompt/initial-prompt.md", "workprompt/reverse-engineer-WHOLE.md", "workprompt/Wrap-up Prompt.md", "workprompt/task-list-prompt.md", "workprompt/task-support-prompt.md", "workprompt/weekly-report-prompt.md", "workprompt/iteration-issues-prompt.md"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `SKILLS`
*   **Change Summary:** `Component has no code_paths and description does not represent current skill package structure.`
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `SKILLS packages AI4PB workflow and domain skills as reusable prompt engineering assets under .github/skills and is consumed by Copilot skill references in guided workflows.`
*   **TOBE Attributes:**
    *   `code_paths = [".github/skills/ai4pb-workflows/SKILL.md", ".github/skills/ai4pb-init/SKILL.md", ".github/skills/ai4pb-task-list/SKILL.md", ".github/skills/ai4pb-task-support/SKILL.md", ".github/skills/ai4pb-iteration-issues/SKILL.md", ".github/skills/ai4pb-audit/SKILL.md", ".github/skills/ai4pb-wrapup/SKILL.md", ".github/skills/ai4pb-weekly-report/SKILL.md"]`
*   **TOBE Browser Path:** `N/A`

### [RELATIONSHIP - ADD]
*   **Source:** `Github Copilot`
*   **Target:** `Prompt Tool Registry`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `AI4PB VS插件-infrustracture`
*   **Description:** `Copilot requests prompt templates through registered language model tools defined by the extension.`

*   **Source:** `Prompt Tool Registry`
*   **Target:** `Implementation Instructions`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `SKILLS`
*   **Description:** `Tool registry serves init-session prompt template content from the implementation instructions asset.`

*   **Source:** `Prompt Tool Registry`
*   **Target:** `Full Audit Prompt`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `SKILLS`
*   **Description:** `Tool registry serves design-audit prompt template content for architecture alignment workflows.`

*   **Source:** `Prompt Tool Registry`
*   **Target:** `Session WrapUp Prompt`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `SKILLS`
*   **Description:** `Tool registry serves wrap-up prompt content for verified-task session closure.`

*   **Source:** `Prompt Tool Registry`
*   **Target:** `ProjectManagement`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `SKILLS`
*   **Description:** `Tool registry serves task-list, task-support, and weekly-report prompt templates from project management prompt assets.`

*   **Source:** `Sparx EA`
*   **Target:** `EA SQL Audit Queries`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `EA JSSCRIPT`
*   **Description:** `EA automation workflow uses SQL query assets to discover active tasks and audit targets for export.`


# Part 2: Business Gap Analysis
*   **Implemented Processes:**
    *   `Requirement Analysis And System Architecture Analysis` is partially supported by architecture JSON refresh checks, prompt tools, and workflow command orchestration in the extension.
    *   `Implementation` is supported through guided command flow (`startIterationFromModel`, `runDesignCodeAlignment`, `generateWrapUpReport`) and runtime artifacts under `TEMP/`.
    *   `System Architecture Description` is actively consumed from `design/KG/SystemArchitecture.json` as the source of architectural context.

*   **Missing Capabilities:**
    *   `TestAndVerification` has no direct automated test execution/ingestion in extension runtime.
    *   `Issue` and `BugOrIssue` are not automatically synchronized back into architecture task objects from generated reports.
    *   Business-level closure from `Final Target System` to governance feedback is documentation-based, not machine-enforced.


# Part 3: Documentation & README Synchronization
*   **Reviewed READMEs:**
    *   **File:** `README.md`
    *   **File:** `workprompt/README.md`
    *   **File:** `script/EA-jsscript/README.md`

*   **Discrepancies:**
    *   `README.md` action list emphasizes sidebar workflow but does not document that chat mode can auto-infer skills from free text in the webview message flow.
    *   `workprompt/README.md` includes `askprompt.md`, but this file is not present in `workprompt/` and is not registered by tools in `package.json`.
    *   `script/EA-jsscript/README.md` explains broad script families, but architecture currently links only a subset (`Sparx EA`, `JSON格式模型提取JS脚本`) and does not map SQL audit scripts.

*   **Recommended Updates (Not Applied):**
    *   In `README.md`, add one section clarifying chat request path: `WorkflowViewProvider.handleChatRequest` supports explicit skill selection and automatic inference.
    *   In `workprompt/README.md`, remove or mark `askprompt.md` as `[PROPOSED]` unless implemented and registered.
    *   In `script/EA-jsscript/README.md`, add a short mapping table from script families to architecture elements (`Sparx EA`, `EA Script Utility Suite`, `EA SQL Audit Queries`).


# Part 4: Strategy & Architecture Compliance Report
*   **Compliance:** `PARTIAL`
*   **Violations:**
    *   `Separation of Concerns` is partial: `src/extension.ts` centralizes UI rendering, status actions, prompt tool registration, config persistence, and orchestration logic.
    *   `Modularity/Traceability` is partial: several application/service elements still require code_paths completion to satisfy architecture governance.
    *   `Closed-loop delivery` is partial: implementation and reporting exist, but verification automation and issue re-ingestion to model are missing.
*   **Recommendations:**
    *   Split extension runtime into dedicated modules (`toolRegistry`, `workflowView`, `statusActions`, `reporting`, `config`) and map each module to explicit architecture ownership.
    *   Enforce a governance check requiring `code_paths` for every Application Component/Service/Interface before release.
    *   Add verification command integration and structured issue-import path to complete Requirement -> Implementation -> Test -> Issue -> Requirement loop.


# Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PARTIAL` with rationale.
*   **Separation of Concerns:** `PARTIAL` with rationale.
*   **Hotspots:** `Application`, `SKILLS`, `Business`.

### [VIEW - ADD]
*   **View Name:** `Application - Runtime Interaction Flow`
*   **Target Browser Path:** `Model/Application/Application/Application - Runtime Interaction Flow`
*   **Purpose:** `Single concern this view explains`
*   **Description:** `Stakeholders: SystemEngineer, Developer. Concerns: command orchestration, chat handoff, tool invocation boundaries. Purpose: explain runtime collaboration among VS Code host, extension, Copilot, and workflow provider. Scope: 1186, 1209, 1213, 1187, 1219, 1194.`
*   **Included Elements:** `["1186", "1209", "1213", "1187", "1219", "1194"]`
*   **Included Relationships:** `["1056", "1088", "1098", "1099", "1100"]`
*   **Reason:** `Separates runtime behavior from prompt asset and EA extraction concerns.`

*   **View Name:** `Application - Prompt Asset Supply`
*   **Target Browser Path:** `Model/Application/Application/Application - Prompt Asset Supply`
*   **Purpose:** `Single concern this view explains`
*   **Description:** `Stakeholders: Prompt engineers, SystemEngineer. Concerns: source-of-truth prompt ownership and delivery into Copilot tools. Purpose: isolate prompt service and data object dependencies. Scope: 1219, 1190, 1191, 1189, 1211, 1220, 1187.`
*   **Included Elements:** `["1219", "1190", "1191", "1189", "1211", "1220", "1187"]`
*   **Included Relationships:** `["1058", "1103"]`
*   **Reason:** `Reduces clutter in Application and clarifies prompt governance boundaries.`

### [VIEW - MODIFY]
*   **View Name:** `Application`
*   **Current Browser Path:** `Model/Application/Application/Application`
*   **Target Browser Path:** `Model/Application/Application/Application Overview`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Mixes runtime flow, prompt assets, and EA extraction concerns in one diagram.`
*   **After Scope:** `High-level inventory only; drill-down delegated to focused runtime/prompt/extraction views.`
*   **Description Update:** `Stakeholders: Enterprise Architect, delivery leads. Concerns: application landscape and ownership boundaries. Purpose: top-level navigation view before drill-down. Scope: only core components/services and minimal cross-cutting relationships.`

*   **View Name:** `SKILLS`
*   **Current Browser Path:** `Model/Application/Application/VS Code/AI4PB VS插件/SKILLS/SKILLS`
*   **Target Browser Path:** `Model/Application/Application/VS Code/AI4PB VS插件/SKILLS/SKILLS Prompt Catalog`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Prompt data objects are grouped, but service interactions and skill ownership are implicit.`
*   **After Scope:** `Prompt catalog view with explicit service-access relationships and ownership boundaries.`
*   **Description Update:** `Stakeholders: Prompt engineers, SystemEngineer. Concerns: template ownership, versioning, and consumability. Purpose: maintain prompt assets as governed catalog. Scope: prompt data objects, SKILLS component, Prompt Tool Registry access links.`

### [VIEW - SPLIT]
*   **Source View:** `Business`
*   **Source Browser Path:** `Model/Business/Business/Business`
*   **New Views:** `["Business - Delivery Process", "Business - Role Assignment"]`
*   **Target Browser Paths:** `["Model/Business/Business/Business - Delivery Process", "Model/Business/Business/Business - Role Assignment"]`
*   **Split Logic:** `Separate lifecycle trigger/flow relationships from actor assignment relationships to keep each view in cognitive range.`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description`

### [VIEW - MERGE]
*   **Source Views:** `["AI for Business", "Model Driven AI for  Project Building"]`
*   **Source Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/AI for Business/AI for Business", "Model/AI-For-Project-Building-SystemArchitecture/Model Driven AI for  Project Building/Model Driven AI for  Project Building"]`
*   **Target View:** `AI4PB Strategic Overview`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/AI4PB Strategic Overview`
*   **Merge Logic:** `Both views are high-level with sparse relations; one executive overview improves entry-point clarity before layer drill-down.`
*   **Description Requirement:** `Merged target View description must include Stakeholders / Concerns / Purpose / Scope`

### [ELEMENT - MOVE]
*   **Element:** `EA Script Utility Suite`
*   **Current Browser Path:** `Model/Application/Application/EA Script Utility Suite`
*   **Target Browser Path:** `Model/Application/Application/Sparx EA/EA Script Utility Suite`
*   **Reason:** `Ownership clarity / SoC`

*   **Element:** `JSON格式模型提取JS脚本`
*   **Current Browser Path:** `Model/Application/Application/VS Code/AI4PB VS插件/JSON格式模型提取JS脚本`
*   **Target Browser Path:** `Model/Application/Application/Sparx EA/JSON格式模型提取JS脚本`
*   **Reason:** `Ownership clarity / SoC`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1099 / AI4PB VS插件 --(ArchiMate_Access)--> JSON Format of Archimate Model`
*   **From View:** `Application`
*   **To View:** `Application - Runtime Interaction Flow`
*   **Reason:** `Readability / clutter reduction`

*   **Relationship:** `1093 / Sparx EA --(ArchiMate_Access)--> JSON格式模型提取JS脚本`
*   **From View:** `Application`
*   **To View:** `EA JSSCRIPT`
*   **Reason:** `Readability / clutter reduction`

*   **Relationship:** `1103 / AI4PB VS插件 --(ArchiMate_Composition)--> SKILLS`
*   **From View:** `Application`
*   **To View:** `SKILLS`
*   **Reason:** `Readability / clutter reduction`
