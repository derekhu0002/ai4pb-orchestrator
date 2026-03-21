# Architecture Audit & Change Report

**Part 1: The Architecture Change Report**

### [TRACEABILITY - UPDATE]
*   **Element Name:** `Open Code AI Coding Agent`
*   **Code Paths:** `[".opencode/package.json", ".opencode/index.ts", ".opencode/tools/run-tests.ts"]`
*   **Reason:** The structural files for the OpenCode package implementation are present, but their paths were entirely missing from the component mapping in the design JSON.

*   **Element Name:** `Executor_Router`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** Implemented inside `src/extension.ts` (marked with `@ArchitectureID: 1227`) but `code_paths` attribute was unassigned.

*   **Element Name:** `OpenCode CLI 适配器`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** Functions (e.g., `executeOpenCodeSpawn`, `buildOpenCodeInvocation`) exist within `src/extension.ts` (`@ArchitectureID: 1232`), missing `code_paths` property.

*   **Element Name:** `Post-Tools Utilities`
*   **Code Paths:** `["script/post-tools/compare_json.py", "script/post-tools/merge_pdfs.py", "script/post-tools/prompt.py", "script/post-tools/scan_tasks.py", "script/post-tools/sync_skills.py"]`
*   **Reason:** Discovered orphaned file `sync_skills.py`, logically belongs to this ApplicationComponent but was omitted.

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Summary:** `26 elements verified as already aligned and omitted from [TRACEABILITY - UPDATE]`.

### [ELEMENT - ADD]
*   **Name:** `WSL Build Tools`
*   **Type:** `ArchiMate_ApplicationComponent`
*   **Parent View:** `AI4PB VS插件-infrustracture`
*   **Description:** `Extracts and manipulates configurations required for WSL environments.`
*   **Attributes:** `code_paths = ["script/building-tools/extract_configs_wsl.py"]`


**Part 2: Business Gap Analysis**
*   **Implemented Processes:** `Requirement Analysis And System Architecture Analysis` (Supported via EA extraction and Git hooks) and `Implementation` (via Github Copilot and OpenCode prompt orchestration).
*   **Missing Capabilities:** `TestAndVerification` (Id: 1178) remains largely manual. Although isolated test runners exist (e.g., `.opencode/tools/run-tests.ts`), there is zero closed-loop feedback code syncing fail states back to EA JSON as `BugOrIssue` tags automatically.
*   **Suggestions:** Implement an automated test listener that parses XML/JSON test reports and automatically maps failed spec assertions to the `SystemArchitecture.json` via EA `Issue` injection.


**Part 3: Documentation & README Synchronization**
*   **Reviewed READMEs:**
    *   **File:** `README.md`
    *   **File:** `script/EA-jsscript/README.md`
*   **Discrepancies:** `README.md` (root) predominantly emphasizes GitHub Copilot (e.g., "深度融合 Copilot 语言模型工具" and "Copilot 专属扩展工具"). However, reading `Open Code AI Coding Agent` and new configurations reveals OpenCode is now equally prioritized as a runtime.
*   **Recommended Updates (Not Applied):** Update the root README's feature list and conceptual introduction to reflect a generic "AI Coding Agent" framework capable of orchestrating *both* Copilot and OpenCode CLI (via `.aicodingconfig`'s `task_specific_agents` fields).


**Part 4: Strategy & Architecture Compliance Report**
*   **Compliance:** PARTIAL
*   **Violations:** Implementation deviates conceptually from Architectural Separation of Concerns. Within the architecture graph, `Executor_Router`, `OpenCode CLI 适配器`, `AUTO Skill Router`, and `WorkflowViewProvider` are explicitly modeled as separate Application Components. In reality, they are completely coupled logically inside the monolithic `src/extension.ts` file without structural folder isolation. (Context acknowledges this via `AGENTS.md`, but it represents an architectural penalty.)
*   **Recommendations:** Proceed with a refactoring cycle dedicated to splintering `src/extension.ts` into a dedicated folder tree (`src/routers/`, `src/adapters/`, `src/views/`) matching the exact taxonomy specified in standard Views.


**Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)**

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** PARTIAL.
*   **Separation of Concerns:** PARTIAL.
*   **Hotspots:** View `AI4PB VS插件` (Id: 159) is cluttered because it conflates UI rendering components with dispatch routing mechanics and CLI interface adaptation. Too much internal cognitive load spanning presentation and infrastructure domains.

### [VIEW - ADD]
*   **View Name:** `Agent Command Routing`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/Agent Command Routing`
*   **Purpose:** Explain how requests from the webview are dispatched to either Copilot or an OpenCode environment dynamically.
*   **Description:**
    Stakeholders: System Engineers, Extension Maintainers
    Concerns: Understanding the flow of prompts parsing and routing config checking before agent execution.
    Purpose: Isolate the execution and routing backend concepts exclusively.
    Scope: `Executor_Router`, `AUTO Skill Router`, `OpenCode CLI 适配器`.
*   **Included Elements:** `["1213", "1225", "1227", "1232", "1231"]`
*   **Included Relationships:** `["1058" (AI Coding Agent -> SKILLS ... (assumed ID representations for layout resolution))]`
*   **Reason:** Reduces cognitive load on the overall plugin model, extracting dispatching concerns to their own focused diagram.

### [VIEW - MODIFY]
*   **View Name:** `AI4PB VS插件`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PB VS插件`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PB VS插件`
*   **Change:** Narrow Scope
*   **Before Scope:** Complete interior mix of all features, routers, UI, wrappers, and files.
*   **After Scope:** High-level boundary framing only (extension host connection, configuration, main agent interaction interfaces).
*   **Description Update:**
    Stakeholders: Enterprise Architects, Developers
    Concerns: System boundary, integration endpoints.
    Purpose: Demonstrate the AI4PB extension boundaries without drowning in code flow paths.
    Scope: Macroscopic Application view.
