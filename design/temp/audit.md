# AI4PB Architecture Audit & Change Report

## Part 1: The Architecture Change Report

### [TRACEABILITY - UPDATE]
*   **Element Name:** `WorkflowViewProvider`
*   **Code Paths:** `["src/extension.ts", "media/workflowView.js"]`
*   **Reason:** The provider implementation is split between the TypeScript host/webview bootstrap and the external webview runtime script. Current `code_paths` omits the actual UI runtime file.

### [TRACEABILITY - UPDATE]
*   **Element Name:** `Executor_Router`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** The router is implemented inside `src/extension.ts` but the element currently has no `code_paths` traceability attribute.

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `9 audited application-layer elements were verified as already aligned and omitted from [TRACEABILITY - UPDATE], including VS Code, Github Copilot, Prompt Tool Registry, SKILLS, Session WrapUp Prompt, Iteration Issues Prompt, Iteration Summary Prompt, ProjectManagement, and EA Script Utility Suite.`

### [ELEMENT - MODIFY]
*   **Name:** `Open Code AI Coding Agent`
*   **Change Summary:** The element exists but lacks implementation-facing metadata. The current codebase now contains concrete OpenCode transport, server, invocation, and streaming logic.
*   **TOBE Name:** `Open Code AI Coding Agent`
*   **TOBE Description:** `Open Code AI Coding Agent is the alternative AI executor supported by AI4PB. It is configured through AGENT_ROUTER_CONFIG, can be selected per skill, and is executed through OpenCode CLI or OpenCode server transport with streamed runtime feedback surfaced back into the workflow webview.`
*   **TOBE Attributes:**
        *   `code_paths = ["src/extension.ts", ".aicodingconfig"]`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Open Code AI Coding Agent`

### [ELEMENT - MODIFY]
*   **Name:** `AI Coding Agent`
*   **Change Summary:** The abstraction is present in the KG but lacks concrete metadata tying it to the current dual-executor implementation and routing configuration.
*   **TOBE Name:** `AI Coding Agent`
*   **TOBE Description:** `AI Coding Agent is the abstract execution role used by AI4PB task dispatch. The current implementation supports Github Copilot and Open Code AI Coding Agent as concrete specializations, with per-skill routing and runtime delegation resolved inside the extension runtime.`
*   **TOBE Attributes:**
        *   `code_paths = ["src/extension.ts", ".aicodingconfig"]`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI Coding Agent`

### [ELEMENT - MODIFY]
*   **Name:** `OpenCode CLI 适配器`
*   **Change Summary:** The adapter element has no description or traceability even though CLI/server invocation, command building, environment templating, WSL path normalization, and event streaming are implemented.
*   **TOBE Name:** `OpenCode CLI 适配器`
*   **TOBE Description:** `OpenCode CLI 适配器 is the extension-side adapter that builds OpenCode invocations, resolves CLI or server transport configuration, normalizes Windows/WSL execution paths, handles timeout and error propagation, and streams OpenCode progress back into the AI4PB workflow runtime.`
*   **TOBE Attributes:**
        *   `code_paths = ["src/extension.ts"]`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Open Code AI Coding Agent/OpenCode CLI 适配器`

### [ELEMENT - MODIFY]
*   **Name:** `.aicodingconfig`
*   **Change Summary:** The stored example content is outdated and no longer reflects the current repository configuration used by the executor router.
*   **TOBE Name:** `.aicodingconfig`
*   **TOBE Description:** `{
    "EA_AUTOGEN_CONFIG": {
        "needallmaintenace": "onlyActive",
        "needbrowserlocation": true,
        "maintenacetype": "forllm"
    },
    "AGENT_ROUTER_CONFIG": {
        "default_agent": "copilot",
        "task_specific_agents": {
            "task-list": "opencode"
        },
        "opencode": {
            "transport": "server",
            "executionHost": "wsl",
            "timeoutMs": 600000,
            "server": {
                "baseUrl": "http://127.0.0.1:4096",
                "directory": "{workspaceRoot}",
                "sessionTitle": "AI4PB {label}"
            }
        }
    }
}`
*   **TOBE Attributes:**
        *   `N/A`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/.aicodingconfig`

### [RELATIONSHIP - ADD]
*   **Source:** `AI4PB VS插件`
*   **Target:** `.aicodingconfig`
*   **Type:** `ArchiMate_Access`
*   **Parent View:** `AI4PB VS插件`
*   **Description:** `The extension reads workspace configuration to resolve AGENT_ROUTER_CONFIG and execution settings before dispatching Copilot or OpenCode execution.`

### [RELATIONSHIP - ADD]
*   **Source:** `Open Code AI Coding Agent`
*   **Target:** `OpenCode CLI 适配器`
*   **Type:** `ArchiMate_Composition`
*   **Parent View:** `Open Code AI Coding Agent`
*   **Description:** `The Open Code AI Coding Agent is realized in the extension through the embedded OpenCode adapter logic.`

## Part 2: Business Gap Analysis
*   **Implemented Processes:** `Requirement Analysis And System Architecture Analysis` is supported indirectly through architecture JSON loading and prompt-tool delivery; `Implementation` is strongly supported through task list, init, task support, iteration issues, design audit, wrap-up, and iteration summary flows; `TestAndVerification` is partially supported through issue continuation, audit reporting, and test-report template artifacts.
*   **Missing Capabilities:** `TestAndVerification` has no automated runtime ingestion loop from actual test execution into the extension; there is no automated write-back from audit conclusions into EA; OpenCode success-path execution remains only partially validated because the real OpenCode runtime is environment-dependent and not yet fully exercised in-repo.
*   **Suggestions:** `1) Add a dedicated test-ingestion command that converts test results into issue/update artifacts for the next iteration. 2) Add an explicit architecture-sync workflow that converts audit findings into a structured EA update checklist. 3) Add a lightweight OpenCode connectivity validation command that verifies health/session/prompt execution before task routing is switched to OpenCode.`

## Part 3: Documentation & README Synchronization
*   **Reviewed READMEs:**
        *   **File:** `README.md`
        *   **File:** `docs/getting-started/README.md`
        *   **File:** `workprompt/README.md`
        *   **File:** `script/EA-jsscript/README.md`
*   **Discrepancies:** `README.md` still shows a minimal `.aicodingconfig` example and does not document the current `AGENT_ROUTER_CONFIG.opencode.server` transport fields; `README.md` and `docs/getting-started/README.md` explain workflow routing conceptually but do not mention that the workflow webview runtime is now split between `src/extension.ts` and `media/workflowView.js`; `workprompt/README.md` is largely aligned, but it would benefit from explicitly calling out that design-audit execution writes only to `design/temp/audit.md`; `script/EA-jsscript/README.md` is materially aligned with the current repository state.`
*   **Recommended Updates (Not Applied):** `Update the root and getting-started docs to add the executor-router/OpenCode configuration example, mention the external webview runtime file, and clarify that design-audit output is a temporary architecture-alignment artifact stored at design/temp/audit.md.`

## Part 4: Strategy & Architecture Compliance Report
*   **Compliance:** `PARTIAL`
*   **Violations:** `Separation of Concerns is only partially respected because command registration, prompt-tool registry, workflow HTML generation, auto-skill routing, OpenCode transport handling, and runtime streaming remain concentrated in src/extension.ts. Strategic traceability is also weakened because the StrategyAndMotivation view is empty, so high-level goals are not directly inspectable against implementation decisions. In addition, relationship metadata quality is inconsistent: the descriptions of relationships 1110 and 1111 are swapped relative to their target prompt assets.`
*   **Recommendations:** `Split extension runtime responsibilities into dedicated modules for workflow view, prompt-tool registry, executor routing, and OpenCode transport; populate Strategy/Motivation views with explicit principles and target concerns; correct the swapped relationship descriptions for Iteration Summary Prompt and Iteration Issues Prompt so the KG remains trustworthy as an audit source.`

## Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PARTIAL. The repository already has focused views such as Prompt Asset Supply and Runtime Interaction Flow, but the top-level Application view still mixes extension host, EA automation assets, routing, task data, and agent abstractions in a single diagram.`
*   **Separation of Concerns:** `PARTIAL. Executor routing, prompt delivery, workflow UI runtime, and OpenCode integration are distinguishable in code but are not yet cleanly separated in ownership paths and view structure.`
*   **Hotspots:** `Application (view 152), AI4PB VS插件-infrustracture (view 161), and SKILLS (view 160) are the main cognitive-overload hotspots.`

### [VIEW - ADD]
*   **View Name:** `Executor Router & Agent Dispatch`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Executor Router & Agent Dispatch`
*   **Purpose:** `Isolate agent selection and dispatch concern from prompt-asset and general application overview diagrams.`
*   **Description:** `Stakeholders: SystemEngineer, extension maintainers. Concerns: executor selection, routing policy, OpenCode/Copilot dispatch boundaries, configuration dependency. Purpose: explain how AI4PB chooses and dispatches concrete AI executors. Scope: Executor_Router, AI Coding Agent, Open Code AI Coding Agent, OpenCode CLI 适配器, Github Copilot, and routing/config relationships only.`
*   **Included Elements:** `["1227", "1230", "1228", "1232", "1187", "1231"]`
*   **Included Relationships:** `["1116", "1125", "1126"]`
*   **Reason:** `This removes executor-routing detail from the overloaded Application view and makes the new OpenCode capability readable as a focused concern.`

### [VIEW - MODIFY]
*   **View Name:** `Application`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application Overview`
*   **Change:** `Rename / Narrow Scope`
*   **Before Scope:** `Mixed overview containing host runtime, EA assets, task data, router, and agent abstractions.`
*   **After Scope:** `High-level application ownership map showing only top-level components and their major responsibilities, with detailed routing/prompt/runtime concerns delegated to focused subordinate views.`
*   **Description Update:** `Stakeholders: architects, new contributors. Concerns: high-level application landscape and ownership boundaries. Purpose: provide the first-stop overview before drilling into runtime, prompt, or executor views. Scope: keep 7-10 top-level elements only and reference subordinate views for detail.`

### [VIEW - MODIFY]
*   **View Name:** `AI4PB VS插件-infrustracture`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PB VS插件-infrustracture`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/Prompt Tool Infrastructure`
*   **Change:** `Rename / Narrow Scope`
*   **Before Scope:** `An ambiguously named view that currently only shows Github Copilot and Prompt Tool Registry.`
*   **After Scope:** `A focused prompt-tool delivery view describing Copilot access to the Prompt Tool Registry and prompt assets only.`
*   **Description Update:** `Stakeholders: prompt engineers, extension maintainers. Concerns: prompt serving boundary between Copilot and the extension. Purpose: explain language-model tool registration and prompt asset access. Scope: Github Copilot, Prompt Tool Registry, prompt asset objects, and their access relations.`

### [VIEW - SPLIT]
*   **Source View:** `SKILLS`
*   **Source Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/SKILLS/SKILLS`
*   **New Views:** `["Skill Catalog", "Prompt Asset Binding"]`
*   **Target Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/SKILLS/Skill Catalog", "Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/SKILLS/Prompt Asset Binding"]`
*   **Split Logic:** `Separate repository skill-package ownership from prompt-data-object binding, because the current SKILLS view mixes catalog and prompt assets in one place while Prompt Asset Supply already models prompt-serving concerns.`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description.`

### [ELEMENT - MOVE]
*   **Element:** `Prompt Tool Registry`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Prompt Tool Registry`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/Prompt Tool Registry`
*   **Reason:** `Ownership clarity / SoC. The registry is implemented and owned by the extension runtime, not by the application layer as a floating standalone service.`

### [ELEMENT - MOVE]
*   **Element:** `AUTO Skill Router`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AUTO Skill Router`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AUTO Skill Router`
*   **Reason:** `Ownership clarity / SoC. The router is realized inside the extension and triggered from WorkflowViewProvider, so it should live under extension ownership.`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `Github Copilot --(ArchiMate_Access)--> Prompt Tool Registry`
*   **From View:** `AI4PB VS插件-infrustracture`
*   **To View:** `Prompt Asset Supply`
*   **Reason:** `Readability / clutter reduction. This relationship expresses prompt-serving semantics and belongs with prompt asset delivery rather than generic extension infrastructure.`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `AI4PB VS插件 --(ArchiMate_Composition)--> Executor_Router`
*   **From View:** `Application`
*   **To View:** `Executor Router & Agent Dispatch`
*   **Reason:** `Readability / clutter reduction. Executor composition should be modeled in the dedicated routing view rather than the top-level mixed application overview.`
