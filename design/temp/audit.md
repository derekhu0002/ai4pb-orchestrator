# AI4PB Architecture Audit & Change Report

## Part 1: The Architecture Change Report

### [TRACEABILITY - UPDATE]
*   **Element Name:** AI4PB VS插件
*   **Code Paths:** ["package.json", "src/extension.ts"]
*   **Reason:** Core extension entry point and manifest needed explicit linking.

### [TRACEABILITY - UPDATE]
*   **Element Name:** WorkflowViewProvider
*   **Code Paths:** ["src/workflowViewProvider.ts"]
*   **Reason:** Missing code path mapping to the view provider implementation.

### [TRACEABILITY - UPDATE]
*   **Element Name:** AUTO Skill Router
*   **Code Paths:** ["src/skillRouter.ts", "src/skillRegistry.ts"]
*   **Reason:** Mapping routing logic to internal code.

### [TRACEABILITY - UPDATE]
*   **Element Name:** Full Audit Prompt
*   **Code Paths:** ["workprompt/reverse-engineer-WHOLE.md"]
*   **Reason:** Align prompt element with its physical file in workspace.

### [TRACEABILITY - UPDATE]
*   **Element Name:** Session WrapUp Prompt
*   **Code Paths:** ["workprompt/Wrap-up Prompt.md"]
*   **Reason:** Align prompt element with its physical file in workspace.

### [TRACEABILITY - ALIGNED (OMITTED)]
*   **Summary:** 45 elements verified as already aligned and omitted from [TRACEABILITY - UPDATE].

### [ELEMENT - ADD]
*   **Name:** Git Automation Tool
*   **Type:** ApplicationComponent
*   **Parent View:** Runtime Interaction Flow
*   **Description:** Internal utility for generating Git commit messages during Iteration Summary.
*   **Attributes:** code_paths = ["src/gitAutomation.ts"]

### [ELEMENT - MODIFY]
*   **Name:** Prompt Tool Registry
*   **Change Summary:** Clarify role to include dynamic loading.
*   **TOBE Name:** Prompt Tool Registry Service
*   **TOBE Description:** Service responsible for registering and dynamically loading LLM tool definitions into the VS Code Copilot Chat runtime context.
*   **TOBE Attributes:**
    *   code_paths = ["src/promptRegistry.ts"]
*   **TOBE Browser Path:** Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Prompt Asset Supply/Prompt Tool Registry Service

### [RELATIONSHIP - ADD]
*   **Source:** WorkflowViewProvider
*   **Target:** Prompt Tool Registry Service
*   **Type:** ArchiMate_Access
*   **Parent View:** Runtime Interaction Flow
*   **Description:** View provider accesses registry to populate available tools list on the UI.


## Part 2: Business Gap Analysis
*   **Implemented Processes:** System Analysis and Architecture Description extraction, automated prompt delivery, AI Copilot initialization via custom prompts.
*   **Missing Capabilities:** Complete end-to-end "TestAndVerification" integration (test outputs exist but automatic parsing and re-triggering of requirement updates lacks robust linkage).
*   **Suggestions:** Implement test result listeners in AI4PB VS插件 to feed TestReport directly into Copilot Context.


## Part 3: Documentation & README Synchronization
*   **Reviewed READMEs:**
    *   **File:** README.md
    *   **File:** MARKETPLACE.md
    *   **File:** docs/getting-started/README.md
*   **Discrepancies:** README.md lacks explicit mention of AUTO Skill Router dynamic dispatching.
*   **Recommended Updates (Not Applied):** Update the Architecture section in README.md to describe how the WorkflowViewProvider triggers the AUTO Skill Router.


## Part 4: Strategy & Architecture Compliance Report
*   **Compliance:** PARTIAL
*   **Violations:** Tight coupling noticed between Prompt Loading (Asset Supply) and typical VS Code Extension Activation logic (in extension.ts).
*   **Recommendations:** Decouple extension.ts from prompt content reading logic by instantiating the Prompt Tool Registry Service entirely behind an interface.


## Part 5: KG Reorganization Plan (Progressive Disclosure + SoC)

### [REORGANIZATION - PRINCIPLES CHECK]
*   **Progressive Disclosure:** PARTIAL. The "Application" model combines prompt data handling and runtime extension logic.
*   **Separation of Concerns:** PARTIAL. Prompt asset views and script views overlap.
*   **Hotspots:** Application view (ID 152) is cluttered with too many cross-domain items (VS Code, Scripts, Prompts).

### [VIEW - SPLIT]
*   **Source View:** Application
*   **Source Browser Path:** Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application
*   **New Views:** ["Application Core", "Extension Infrastructure"]
*   **Target Browser Paths:** ["Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Application Core", "Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Extension Infrastructure"]
*   **Split Logic:** Separate business application logic (e.g. EA interaction, script execution) from VS Code extension container logic.
*   **Description Requirement:** 
    - Application Core: Stakeholders: Developers; Concerns: core extension features; Purpose: app logic.
    - Extension Infrastructure: Stakeholders: Architects; Concerns: external system interaction; Purpose: physical layout.

### [ELEMENT - MOVE]
*   **Element:** EA SQL Audit Queries
*   **Current Browser Path:** Model/AI-For-Project-Building-SystemArchitecture/Application/Application/Sparx EA/EA SQL Audit Queries
*   **Target Browser Path:** Model/AI-For-Project-Building-SystemArchitecture/Data/Queries/EA SQL Audit Queries
*   **Reason:** Ownership clarity. Queries should reside in a Data/Asset layer, not deeply nested inside Sparx EA component logic.
