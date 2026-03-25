# Architecture Audit & Change Report

**Part 1: The Architecture Change Report**

### [TRACEABILITY - UPDATE]
*   **Element Name:** `VS Code`
*   **Code Paths:** `["package.json", "src/extension.ts", "media/workflowView.js"]`
*   **Reason:** `code_paths` is missing; the repository implements the VS Code host integration surface through extension contribution metadata, command registration, and webview runtime assets.

*   **Element Name:** `Github Copilot`
*   **Code Paths:** `["package.json", "src/extension.ts"]`
*   **Reason:** `code_paths` is missing; the current repository contains the Copilot tool registration and prompt dispatch integration, even though Copilot itself is an external platform component.

*   **Element Name:** `Sparx EA`
*   **Code Paths:** `["script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active.js"]`
*   **Reason:** `code_paths` is missing; the EA-side integration is implemented by repository JScript automation assets that export architecture JSON and task artifacts.

*   **Element Name:** `AI4PB VS插件`
*   **Code Paths:** `["package.json", "src/extension.ts", "media/workflowView.js"]`
*   **Reason:** `code_paths` is missing; the extension host, command surface, workflow orchestration, and webview integration are implemented here.

*   **Element Name:** `WorkflowViewProvider`
*   **Code Paths:** `["src/extension.ts", "media/workflowView.js"]`
*   **Reason:** `code_paths` is missing; the element is realized by webview host logic in `src/extension.ts` and the extracted front-end runtime in `media/workflowView.js`.

*   **Element Name:** `Prompt Tool Registry`
*   **Code Paths:** `["src/extension.ts", "skills/ai4pb-init/SKILL.md", "skills/ai4pb-audit/SKILL.md", "skills/ai4pb-wrapup/SKILL.md", "skills/ai4pb-task-list/SKILL.md", "skills/ai4pb-task-support/SKILL.md", "skills/ai4pb-weekly-report/SKILL.md", "skills/ai4pb-iteration-issues/SKILL.md", "skills/ai4pb-iteration-summary/SKILL.md"]`
*   **Reason:** `code_paths` is missing; the registry is implemented by language model tool registration in `src/extension.ts` and the bundled skill files it serves.

*   **Element Name:** `AUTO Skill Router`
*   **Code Paths:** `["src/extension.ts", "media/workflowView.js"]`
*   **Reason:** `code_paths` is missing; automatic skill suggestion, confirmation, and dispatch are implemented across the extension host and the workflow webview.

*   **Element Name:** `Executor_Router`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** `code_paths` is missing; executor selection, per-skill routing, and `.aicodingconfig` interpretation are all implemented in the extension host.

*   **Element Name:** `AI Coding Agent`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** `code_paths` is missing; the abstract runtime role is implemented in code as a dispatch target with Copilot and OpenCode as concrete variants.

*   **Element Name:** `Open Code AI Coding Agent`
*   **Code Paths:** `["src/extension.ts", ".opencode/package.json", ".opencode/index.ts", ".opencode/opencode.json", ".opencode/plugins/index.ts", ".opencode/tools/index.ts"]`
*   **Reason:** `code_paths` is missing; the current implementation spans both the extension-side invocation path and the bundled `.opencode` package assets.

*   **Element Name:** `OpenCode CLI 适配器`
*   **Code Paths:** `["src/extension.ts"]`
*   **Reason:** `code_paths` is missing; CLI invocation, server transport, WSL normalization, streaming, timeout handling, and error translation are all implemented in `src/extension.ts`.

*   **Element Name:** `EA Script Utility Suite`
*   **Code Paths:** `["script/EA-jsscript/schema_json_to_diagram.js", "script/EA-jsscript/schema_diagram_to_json.js", "script/EA-jsscript/stix_to_ea.js", "script/EA-jsscript/ea_to_stix.js", "script/EA-jsscript/PUT-all-elements-on-diagram.js"]`
*   **Reason:** `code_paths` is missing; the repository contains a distinct EA utility script family that is not currently linked back to the graph.

*   **Element Name:** `EA SQL Audit Queries`
*   **Code Paths:** `["script/EA-sqlscript/MyToDoIssueSearch.sql", "script/EA-sqlscript/searchalltodoandissues.sql", "script/EA-sqlscript/searchforaudit-withelementid.sql", "script/EA-sqlscript/searchforaudit-withelementname.sql", "script/EA-sqlscript/searchforaudit-withconnectorid.sql"]`
*   **Reason:** `code_paths` is missing; the SQL query assets exist and are explicitly part of the EA audit/export workflow.

*   **Element Name:** `Post-Tools Utilities`
*   **Code Paths:** `["script/post-tools/compare_json.py", "script/post-tools/merge_pdfs.py", "script/post-tools/prompt.py", "script/post-tools/release-vsix.ps1", "script/post-tools/scan_tasks.py", "script/post-tools/sync_skills.py"]`
*   **Reason:** `code_paths` is missing; the repository contains a coherent post-processing tool set that is currently orphaned from the architecture element.

*   **Element Name:** `MCP_config`
*   **Code Paths:** `["mcp-configs/mcp-servers.json"]`
*   **Reason:** `code_paths` is missing; a concrete MCP configuration asset exists and should be linked to this element.

*   **Element Name:** `Tool_config`
*   **Code Paths:** `["manifests/install-components.json", "manifests/install-modules.json", "manifests/install-profiles.json", "hooks/hooks.json"]`
*   **Reason:** `code_paths` is missing; the repository contains concrete module/tool installation manifests and hook configuration assets for this concern.

*   **Element Name:** `JSON Format of Archimate Model`
*   **Code Paths:** `["design/KG/SystemArchitecture.json", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js", "script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js"]`
*   **Reason:** `code_paths` is missing; the canonical exported architecture artifact and its generating scripts are known and should be traceable.

*   **Element Name:** `Task Help Infomation`
*   **Code Paths:** `["script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-ALL.js"]`
*   **Reason:** `code_paths` is missing; the task and issue extraction family exists but is not linked, and the element metadata also needs correction.

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Rule:** Do not list aligned elements one-by-one.
*   **Summary:** `0 Application Component / Service / Interface elements were verified as already aligned; all reviewed implementation-facing elements require `code_paths` updates.`

### [ELEMENT - ADD]
*   **Name:** `ECC Hooks Plugin`
*   **Type:** `ApplicationComponent`
*   **Parent View:** `Open Code AI Coding Agent`
*   **Description:** `OpenCode plugin module that translates ECC/Claude-style hook behavior into OpenCode event handlers for formatting, type-check, logging, session lifecycle, and tool governance.`
*   **Attributes:** `code_paths = [".opencode/plugins/index.ts", ".opencode/plugins/ecc-hooks.ts"]`

*   **Name:** `ECC Tool Pack`
*   **Type:** `ApplicationComponent`
*   **Parent View:** `Open Code AI Coding Agent`
*   **Description:** `Bundled OpenCode tool pack that exports run-tests, coverage, security, formatting, lint, and git summary tools for delegated execution workflows.`
*   **Attributes:** `code_paths = [".opencode/tools/index.ts", ".opencode/tools/run-tests.ts", ".opencode/tools/check-coverage.ts", ".opencode/tools/security-audit.ts", ".opencode/tools/format-code.ts", ".opencode/tools/lint-check.ts", ".opencode/tools/git-summary.ts"]`

### [ELEMENT - MODIFY]
*   **Name:** `OpenCode CLI 适配器`
*   **Change Summary:** The current implementation no longer represents only CLI invocation; it supports both CLI and server transport, Windows/WSL execution normalization, and streamed server responses.
*   **TOBE Name:** `OpenCode Transport Adapter`
*   **TOBE Description:** `OpenCode Transport Adapter is the extension-side integration component that builds OpenCode invocations, resolves CLI and server transport modes, normalizes Windows and WSL execution details, streams OpenCode progress back into the workflow webview, and converts transport failures into actionable extension errors.`
*   **TOBE Attributes:**
    *   `code_paths = ["src/extension.ts"]`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Open Code AI Coding Agent/OpenCode Transport Adapter`

*   **Name:** `Open Code AI Coding Agent`
*   **Change Summary:** The existing description under-represents the current as-built implementation, which now includes both extension-side execution logic and an embedded `.opencode` package with plugin and tool assets.
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `Open Code AI Coding Agent is the configurable non-Copilot executor used by AI4PB. The as-built implementation combines extension-side routing and transport orchestration in `src/extension.ts` with a bundled `.opencode` package that provides OpenCode plugin, tool, prompt, and hook assets for delegated execution workflows.`
*   **TOBE Attributes:**
    *   `code_paths = ["src/extension.ts", ".opencode/package.json", ".opencode/index.ts", ".opencode/opencode.json", ".opencode/plugins/index.ts", ".opencode/plugins/ecc-hooks.ts", ".opencode/tools/index.ts"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `AI4PBAgentApplicationBundle`
*   **Change Summary:** The current description is empty, but the repository clearly contains a bundled asset set for skills, agents, manifests, rules, hooks, and mirrored prompt packages.
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `AI4PBAgentApplicationBundle is the repository-bundled asset package consumed by AI4PB execution flows. It includes workflow skills, mirrored `.github` and `.opencode` prompt assets, agent definitions, hook configurations, installation manifests, MCP configuration, commands, and supporting orchestration metadata used by Copilot and OpenCode-based delivery workflows.`
*   **TOBE Attributes:**
    *   `code_paths = ["skills/README.md", ".github/skills/README.md", ".opencode/skills/README.md", "agents/architect.md", "commands/plan.md", "hooks/hooks.json", "manifests/install-modules.json", "mcp-configs/mcp-servers.json"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Task Help Infomation`
*   **Change Summary:** The current element name contains a spelling error and its description is too narrow for the current extraction pipeline.
*   **TOBE Name:** `Task Help Information`
*   **TOBE Description:** `Task Help Information is the extracted task and issue context generated from EA maintenance data for AI-assisted planning and execution. The current as-built pipeline is driven by the `GetTasksAndIssuesForLLM-*` script family and feeds downstream task support and issue continuation workflows.`
*   **TOBE Attributes:**
    *   `code_paths = ["script/EA-jsscript/GetTasksAndIssuesForLLM-active.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-active_verified.js", "script/EA-jsscript/GetTasksAndIssuesForLLM-ALL.js"]`
*   **TOBE Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Task Help Information`

*   **Name:** `MCP_config`
*   **Change Summary:** The current description is empty, but a concrete MCP server configuration asset exists in the repository.
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `MCP_config represents repository-level Model Context Protocol server configuration assets that define externally connectable context providers for agent execution environments.`
*   **TOBE Attributes:**
    *   `code_paths = ["mcp-configs/mcp-servers.json"]`
*   **TOBE Browser Path:** `N/A`

*   **Name:** `Tool_config`
*   **Change Summary:** The current description is empty, but the repository contains concrete install manifests and hook/tool governance assets for this concern.
*   **TOBE Name:** `N/A`
*   **TOBE Description:** `Tool_config represents repository-level tool installation and execution-governance configuration, including install manifests, component profiles, and hook policy assets that shape how bundled agent tooling is provisioned and enforced.`
*   **TOBE Attributes:**
    *   `code_paths = ["manifests/install-components.json", "manifests/install-modules.json", "manifests/install-profiles.json", "hooks/hooks.json"]`
*   **TOBE Browser Path:** `N/A`

### [RELATIONSHIP - ADD]
*   **Source:** `WorkflowViewProvider`
*   **Target:** `Executor_Router`
*   **Type:** `Triggering`
*   **Parent View:** `Executor Router & Agent Dispatch`
*   **Description:** `Workflow webview actions and chat requests explicitly trigger executor routing logic in the extension host before any agent is selected.`

*   **Source:** `AI4PB VS插件`
*   **Target:** `AI4PBAgentApplicationBundle`
*   **Type:** `Access`
*   **Parent View:** `Prompt Asset Supply`
*   **Description:** `The extension reads bundled skills, agents, manifests, and mirrored prompt assets from the repository and extension package during workflow execution.`

*   **Source:** `Prompt Tool Registry`
*   **Target:** `AI4PBAgentApplicationBundle`
*   **Type:** `Access`
*   **Parent View:** `Prompt Asset Supply`
*   **Description:** `The registry serves prompt content backed by bundled skill assets rather than generating prompt text inline.`

*   **Source:** `Open Code AI Coding Agent`
*   **Target:** `ECC Hooks Plugin`
*   **Type:** `Composition`
*   **Parent View:** `Open Code AI Coding Agent`
*   **Description:** `The bundled OpenCode executor package structurally contains the ECC hook plugin implementation.`

*   **Source:** `Open Code AI Coding Agent`
*   **Target:** `ECC Tool Pack`
*   **Type:** `Composition`
*   **Parent View:** `Open Code AI Coding Agent`
*   **Description:** `The bundled OpenCode executor package structurally contains the custom tool exports used for delegated execution workflows.`

**Part 2: Business Gap Analysis**
*   **Implemented Processes:** `Implementation` is strongly supported by the current code through the AI4PB sidebar, prompt-tool registration, workflow dispatch, Copilot integration, OpenCode CLI/server transport, and streamed execution feedback. `Requirement Analysis And System Architecture Analysis` is partially supported because EA export and task extraction are automated, but model authoring and strategic analysis still remain manual in Sparx EA. `TestAndVerification` is partially supported because design audit, wrap-up/report surfacing, and issue extraction exist, but the verification loop is not fully automated.`
*   **Missing Capabilities:** `TestAndVerification` lacks an automated test execution and evidence capture loop in the extension workflow; `TestReport` exists in the business model and `doc_template/testreport.md` exists in the repository, but no extension command generates or updates it. There is also no code path that feeds failed test results back into `BugOrIssue` or `Issue`, and the bundled `.opencode/tools/run-tests.ts` capability is not wired into the AI4PB workflow surface.`
*   **Suggestions:** `Add a dedicated verification command that invokes configured test execution, normalizes results into a report artifact, writes a structured test report from `doc_template/testreport.md`, and optionally emits issue-ready output that can be fed back into EA maintenance objects. Model this as an explicit bridge from `TestAndVerification` to `BugOrIssue`/`Issue` and reuse the existing OpenCode tool pack where appropriate.`

**Part 3: Documentation & README Synchronization**
*   **Reviewed READMEs:**
    *   **File:** `README.md`
    *   **File:** `hooks/README.md`
    *   **File:** `plugins/README.md`
    *   **File:** `rules/README.md`
    *   **File:** `script/EA-jsscript/README.md`
    *   **File:** `skills/README.md`
    *   **File:** `docs/getting-started/README.md`
    *   **File:** `.opencode/skills/README.md`
    *   **File:** `.github/skills/README.md`
    *   **File:** `.claude-plugin/README.md`
    *   **File:** `skills/visa-doc-translate/README.md`
*   **Discrepancies:** `The root README still contains an unresolved placeholder row header (`步骤//TODO：下面换成面板中具体按钮名称...`) instead of the real button labels exposed by the current workflow UI. It also understates the as-built `.opencode` package scope, which now includes plugin and tool implementations in addition to executor routing. `hooks/README.md`, `plugins/README.md`, `rules/README.md`, and `.claude-plugin/README.md` accurately describe their bundled asset domains, but they do not clearly signal to new readers that these are auxiliary packaged assets inside a repository whose primary product is the AI4PB VS Code extension. `script/EA-jsscript/README.md` is broadly aligned, but the bootstrap-first path should be emphasized more strongly than the older hardcoded-path script usage patterns.`
*   **Recommended Updates (Not Applied):** `Replace the placeholder workflow table text in the root README with the exact current sidebar action names. Expand the root README and getting-started docs to explicitly describe the embedded `.opencode` plugin/tool pack and the dual CLI/server transport model. Add a short scoping note to the auxiliary ECC/Claude asset READMEs explaining that they are bundled support assets inside the AI4PB repository rather than the primary extension runtime. Re-order the EA JScript README so the bootstrap-based recommended path is the default narrative and older direct-script usage is clearly secondary.`

**Part 4: Strategy & Architecture Compliance Report**
*   **Compliance:** PARTIAL
*   **Violations:** `The implementation aligns well with the strategic goal of making architecture and implementation fit together through machine-readable exports, prompt injection, and audit outputs, and it also aligns with the extensibility goal through configurable executor routing and bundled OpenCode assets. However, Separation of Concerns is only partially respected because `src/extension.ts` currently concentrates extension activation, workflow state, prompt tool registration, skill routing, executor routing, OpenCode transport logic, server streaming, and report handling in one monolithic file, while the KG models several of these concerns as separate components/services. Progressive disclosure is also weak in the KG because existing views rely on `browser_path` while `views[*].name` is blank across the current JSON, and most views lack stakeholder/concern-oriented descriptions. Security/governance is partial as well because OpenCode server authentication is expected in `.aicodingconfig` without a modeled secret-handling boundary.`
*   **Recommendations:** `Refactor the extension host into narrower modules matching the modeled components and services, keep the webview runtime externalized, and preserve the existing command/tool surface. Add a secret-handling strategy for OpenCode credentials or explicitly model the current trust boundary. Update view metadata so the strategy/business/application/technology reading path is explicit and each view declares stakeholders, concerns, purpose, and scope.`

**Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)**

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** `PARTIAL. The graph has the right top-level layers, but several views are overloaded, all current view scope decisions depend on `browser_path` because `views[*].name` is blank, and viewpoint descriptions are largely absent. The analysis below was performed by reverse-looking up every referenced `included_elements` and `included_relationships` ID; no missing relationship IDs were found in the reviewed views.`
*   **Separation of Concerns:** `PARTIAL. The codebase already separates the webview runtime file from the extension host and separates EA scripts and `.opencode` assets, but the current KG still mixes boundary, runtime flow, asset supply, and executor transport concerns across a few broad application views.`
*   **Hotspots:** `System Architecture Description` (20 elements / 23 relationships), `Business` (15 elements / 20 relationships), `OverallAgentFrameworkArchitecture` (17 elements / 19 relationships), and `Application` (9 elements / 10 relationships with multiple concerns). All current view names should be materialized from `browser_path` into explicit `name` values before further curation.`

### [VIEW - ADD]
*   **View Name:** `AI4PB Extension Runtime`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PB Extension Runtime`
*   **Purpose:** `Single concern this view explains: extension-host runtime responsibilities and internal command/routing boundaries.`
*   **Description:** `Stakeholders: extension maintainers, system engineers, architects. Concerns: command registration, workflow orchestration, configuration access, skill routing, dispatch boundaries. Purpose: explain the extension host runtime without mixing EA and executor-specific internals. Scope: AI4PB VS插件, WorkflowViewProvider, AUTO Skill Router, Executor_Router, .aicodingconfig.`
*   **Included Elements:** `["1209", "1213", "1225", "1227", "1231"]`
*   **Included Relationships:** `["1098", "1112", "1113", "1116", "1127"]`
*   **Reason:** `This reduces cognitive load by isolating the extension host boundary and keeping execution-transport detail out of the main application overview.`

*   **View Name:** `OpenCode Runtime Integration`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Open Code AI Coding Agent/OpenCode Runtime Integration`
*   **Purpose:** `Single concern this view explains: how AI4PB integrates OpenCode as a concrete executor.`
*   **Description:** `Stakeholders: extension maintainers, integrators, platform engineers. Concerns: executor specialization, transport adaptation, server/CLI mode, streamed execution. Purpose: explain the OpenCode execution path independently from the Copilot path. Scope: AI Coding Agent, Open Code AI Coding Agent, OpenCode Transport Adapter and, after element creation, the ECC Hooks Plugin and ECC Tool Pack.`
*   **Included Elements:** `["1230", "1228", "1232"]`
*   **Included Relationships:** `["1125", "1128", "1100"]`
*   **Reason:** `The current singleton OpenCode view is too shallow, while the main AI agent view is too broad; this focused view creates a useful drill-down.`

*   **View Name:** `EA Export And Audit Automation`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Sparx EA/EA Export And Audit Automation`
*   **Purpose:** `Single concern this view explains: how EA-side scripts and SQL assets produce machine-readable architecture and task outputs.`
*   **Description:** `Stakeholders: enterprise architects, system engineers, maintainers of EA automation. Concerns: export scripts, SQL lookup assets, model JSON generation, task extraction. Purpose: isolate the EA-side automation pipeline from the rest of the application runtime. Scope: Sparx EA, JSON格式模型提取JS脚本, EA Script Utility Suite, EA SQL Audit Queries, Task Help Information.`
*   **Included Elements:** `["1193", "1210", "1214", "1222", "1229"]`
*   **Included Relationships:** `["1061", "1109", "1121", "1189"]`
*   **Reason:** `This removes EA export mechanics from broader application views and gives the modeling toolchain its own focused drill-down.`

### [VIEW - MODIFY]
*   **View Name:** `Application`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application Overview`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Current concern mix combines repository boundary, data flow artifacts, executor abstraction, and bundle assets.`
*   **After Scope:** `High-level application overview only: VS Code host, AI4PB extension, Sparx EA integration, AI Coding Agent abstraction, architecture JSON, task information, and agent asset bundle.`
*   **Description Update:** `Stakeholders: architects, product owners, new maintainers. Concerns: main system boundary and primary collaboration surfaces. Purpose: give a top-level application map before drilling into runtime, asset supply, and EA automation. Scope: 7-9 macro elements only; detailed routing and transport move to subordinate views.`

*   **View Name:** `Prompt Asset Supply`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Prompt Asset Supply`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Prompt And Asset Supply`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Current concern mix shows only a small subset of asset-serving elements and does not expose the bundle backing those assets.`
*   **After Scope:** `Focused asset supply view covering Prompt Tool Registry, AI4PBAgentApplicationBundle, AI4PB VS插件, Github Copilot, AI Coding Agent, and the key content/data flows among them.`
*   **Description Update:** `Stakeholders: extension maintainers, workflow designers, AI capability owners. Concerns: where prompts and skill assets live, who reads them, and how they reach concrete executors. Purpose: make prompt and bundle delivery explicit. Scope: bundle-backed prompt serving only; no transport or EA export detail.`

*   **View Name:** `Executor Router & Agent Dispatch`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Executor Router & Agent Dispatch`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Executor Router & Agent Dispatch`
*   **Change:** `Narrow Scope / Re-layout`
*   **Before Scope:** `Current concern mix blends abstract executor specialization with runtime triggering and OpenCode adapter structure.`
*   **After Scope:** `Focused dispatch view covering WorkflowViewProvider triggering, AUTO Skill Router decisioning, Executor_Router dispatching, and the abstract AI Coding Agent target.`
*   **Description Update:** `Stakeholders: extension maintainers, architects, troubleshooters. Concerns: who decides executor selection and when dispatch occurs. Purpose: isolate routing semantics from transport semantics. Scope: triggering and dispatch relationships only; concrete OpenCode internals move to a dedicated drill-down.`

*   **View Name:** `Runtime Interaction Flow`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Runtime Interaction Flow`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/User To Agent Runtime Flow`
*   **Change:** `Rename / Narrow Scope / Re-layout`
*   **Before Scope:** `Current concern mix includes UI, routing, prompt access, and executor handoff in a single interaction diagram.`
*   **After Scope:** `User-facing runtime flow only: webview interaction, confirmation, prompt/tool access, and visible agent handoff milestones.`
*   **Description Update:** `Stakeholders: end users, system engineers, support engineers. Concerns: observable runtime journey from user action to agent execution. Purpose: explain the conversation and confirmation flow. Scope: human-visible runtime steps only; internal transport details move out.`

### [VIEW - SPLIT]
*   **Source View:** `System Architecture Description`
*   **Source Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Business/Business/System Architecture Description/System Architecture Description`
*   **New Views:** `["Motivation And Requirement Mapping", "Target Architecture Decomposition"]`
*   **Target Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/Business/Business/System Architecture Description/Motivation And Requirement Mapping", "Model/AI-For-Project-Building-SystemArchitecture/Business/Business/System Architecture Description/Target Architecture Decomposition"]`
*   **Split Logic:** `Separate motivation/requirement reasoning objects (Goal, Driver, Assessment, Stakeholder, Constrain, Principle, Value, Outcome) from target-architecture decomposition objects (Core Gap, Target Core Architecture, Business/Application/Technology Target Architecture, Capability, Value Stream, Course of Action, StrategyBehavior).`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description.`

*   **Source View:** `Business`
*   **Source Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Business/Business/Business`
*   **New Views:** `["Delivery Lifecycle", "Roles And Escalation"]`
*   **Target Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/Business/Business/Delivery Lifecycle", "Model/AI-For-Project-Building-SystemArchitecture/Business/Business/Roles And Escalation"]`
*   **Split Logic:** `Separate process and artifact flow (Raw Requirement, Implementation, Target System, TestAndVerification, Final Target System, BugOrIssue, Issue, TestReport) from actor/responsibility concerns (Developer, AI Copilot, SystemEngineer, TestEngineer).`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description.`

*   **Source View:** `OverallAgentFrameworkArchitecture`
*   **Source Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/StrategyAndMotivation/insight_on_aicodingagent/AgentOrientedSystemArchitecture/OverallAgentFrameworkArchitecture/OverallAgentFrameworkArchitecture`
*   **New Views:** `["Agent Framework Meta-Model", "Knowledge And Extensibility"]`
*   **Target Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/StrategyAndMotivation/insight_on_aicodingagent/AgentOrientedSystemArchitecture/OverallAgentFrameworkArchitecture/Agent Framework Meta-Model", "Model/AI-For-Project-Building-SystemArchitecture/StrategyAndMotivation/insight_on_aicodingagent/AgentOrientedSystemArchitecture/OverallAgentFrameworkArchitecture/Knowledge And Extensibility"]`
*   **Split Logic:** `Keep framework building blocks (AgentFramework, AgentApplication, BusinessApplication, Business, LLM, MCP, Tool, Skill, Agent, GithubCopilot, Opencode, Openclaw, Claude code) separate from knowledge/extensibility support (KnowledgeGraph, Ontology, GraphRag MCP, and related relationships).`
*   **Description Requirement:** `For each new View, include Stakeholders / Concerns / Purpose / Scope in its description.`

### [VIEW - MERGE]
*   **Source Views:** `["AI Coding Agent", "Open Code AI Coding Agent"]`
*   **Source Browser Paths:** `["Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI Coding Agent/AI Coding Agent", "Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Open Code AI Coding Agent/Open Code AI Coding Agent"]`
*   **Target View:** `AI Coding Agent Runtime Variants`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI Coding Agent/AI Coding Agent Runtime Variants`
*   **Merge Logic:** `The current Open Code view is a singleton and does not justify a separate top-level diagram. Merging it into a runtime-variants view preserves the abstract role plus concrete Copilot/OpenCode specialization while reducing redundant navigation.`
*   **Description Requirement:** `Merged target View description must include Stakeholders / Concerns / Purpose / Scope.`

### [ELEMENT - MOVE]
*   **Element:** `Post-Tools Utilities`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Post-Tools Utilities`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Maintenance/Maintenance/Post-Tools Utilities`
*   **Reason:** `Ownership clarity / SoC. The scripts are primarily maintenance and governance utilities rather than core runtime application behavior.`

*   **Element:** `Tool_config`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PBAgentApplicationBundle/Tool_config`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PBAgentApplicationBundle/Configuration/Tool_config`
*   **Reason:** `Ownership clarity / SoC. Tool provisioning manifests belong under an explicit configuration sub-path inside the bundle rather than beside runtime components.`

*   **Element:** `MCP_config`
*   **Current Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PBAgentApplicationBundle/MCP_config`
*   **Target Browser Path:** `Model/AI-For-Project-Building-SystemArchitecture/Application/Application/AI4PB VS插件/AI4PBAgentApplicationBundle/Configuration/MCP_config`
*   **Reason:** `Ownership clarity / SoC. MCP server definitions are configuration assets and should be grouped with other bundle configuration elements.`

### [RELATIONSHIP - MOVE]
*   **Relationship:** `1113 WorkflowViewProvider --(ArchiMate_Triggering)--> AUTO Skill Router`
*   **From View:** `Runtime Interaction Flow`
*   **To View:** `AI4PB Extension Runtime`
*   **Reason:** `Readability / clutter reduction. This is an internal runtime-trigger relationship rather than a user-visible conversational step.`

*   **Relationship:** `1114 AUTO Skill Router --(ArchiMate_Triggering)--> Github Copilot`
*   **From View:** `Runtime Interaction Flow`
*   **To View:** `Executor Router & Agent Dispatch`
*   **Reason:** `Readability / clutter reduction. The relationship expresses dispatch semantics and belongs with routing rather than with the human-facing interaction view.`

*   **Relationship:** `1186 JSON Format of Archimate Model --(ArchiMate_Flow)--> AI Coding Agent`
*   **From View:** `Application`
*   **To View:** `Prompt And Asset Supply`
*   **Reason:** `Readability / clutter reduction. This is a core runtime input flow and should be grouped with other agent input assets.`

*   **Relationship:** `1187 Task Help Information --(ArchiMate_Flow)--> AI Coding Agent`
*   **From View:** `Application`
*   **To View:** `Prompt And Asset Supply`
*   **Reason:** `Readability / clutter reduction. This is also an agent input flow and should sit beside the architecture JSON and bundle supply flows.`

*   **Relationship:** `1188 AI4PBAgentApplicationBundle --(ArchiMate_Flow)--> AI Coding Agent`
*   **From View:** `Application`
*   **To View:** `Prompt And Asset Supply`
*   **Reason:** `Readability / clutter reduction. The relationship is the central asset-supply edge and should be modeled where bundle-backed prompt delivery is explained.`
