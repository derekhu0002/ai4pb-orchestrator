# AI4PB Orchestrator

AI4PB Orchestrator 是一款 VS Code 扩展，旨在将 Sparx EA (ArchiMate) 的企业架构输出与 GitHub Copilot 的代码实现工作流无缝连接。

它帮助团队在真实的工程实践中跑通一种**模型驱动**的闭环工作流：架构建模 -> 知识图谱 JSON 导出 -> AI 辅助指导编码 -> 架构代码对齐审计 -> 收尾复盘。

## 🌟 核心特性 (Highlights)

- **AI4PB 专属侧边栏**：内置符合 SCRUM 敏捷节奏的动作节点，提供一键引导。
- **架构上下文一致性稽查**：自动检查关联架构文件的有效性，在研发迭代中持续挂载并校验状态。
- **深度融合 Copilot 语言模型工具 (Prompt Tools)**：与最新的 VS Code Language Model API 相结合，无需在聊天窗口四处复制和粘贴复杂模板，直接引用 `#ai4pb-*` 即可调用专家级 Prompt 流程。
- **构建友好的分发环境**：支持标准系统的 VSIX 打包构建和导出工作流。

## 🛠 Copilot 专属扩展工具 (Prompt Tools)

本扩展向 GitHub Copilot 注册了特定工作场景的辅助引擎指令。在 Copilot Chat 对话框中键入即可：

- `#ai4pb-init`：迭代环境启动，为开发锚定总体架构边界。
- `#ai4pb-audit`：执行逆向追踪式的“代码 - 架构”双向强制一致性检查 (Design Audit)。
- `#ai4pb-wrapup`：迭代产出总结梳理与复盘归档处理。
- `#ai4pb-task-list`：自动摄取全局模型下达的 TODO Task，生成待办状态管理看板。
- `#ai4pb-task-support`：针对具体的研发工作子任务，提供极为详尽的上下文设计信息及执行预案。
- `#ai4pb-weekly-report`：针对管理层及所有干系人，生成总结性业务周报报表。
- `#ai4pb-iteration-issues`：承接当前开发或测试反馈中的新增 Issue 缺陷并在多轮对话中修复。

## 💻 内部集成命令 (Included Commands)

除了在左侧边活动面板做全流程式点选操作外，您也可以通过命令面板（Ctrl+Shift+P / Cmd+Shift+P）快速使用：

- `AI4PB: Initialize EA Template` (在当前工作区释放规范的架构项目基础与 EA 模型模板文件)
- `AI4PB: Refresh Architecture Context` (热重载缓存并在内存上下文刷新全局架构状态)
- `AI4PB: Start Iteration from Model` (基于当前架构正式发起新一轮的代码迭代流程)
- `AI4PB: Run Design-Code Alignment` (快速执行单次的设计图纸与实际代码对齐检查)
- `AI4PB: Generate Wrap-up Report` (生成并输出本次循环周期的全维归档复盘包)
- `AI4PB: Open Next Action` (根据现有阶段指引光标操作进入下一个推荐流程)
- `AI4PB: Run All (Guided)` (运行内置操作全流程向导)

## 📌 注意事项 (Notes)

- 维护 Sparx EA 模型并通过本项目的 JScript 实现源数据层传导更新，目前是架构唯一指定的支持项并且经历了最为全面的实战测试环境。
- 如若核心根文件 `design/KG/SystemArchitecture.json` 已显长期荒废缺乏或直接丢失，AI4PB 会在前置状态面板（Precheck）上发出中断级别堵塞提醒通知来制止开发执行，请即时保持架构同频更新。

---

# 📖 完整指南：AI4PB 开发交付方法论实战 (Methodology Guidebook)

欢迎阅读 **AI-For-Project-Building (AI4PB)** 方法论及工具全流程指导书。

本指南将旨在分享如何打破**“架构图设计”与“工程实操代码”**之间的真空墙：我们将日常需求梳理、排期、分析数据化为可被读取的图谱 `JSON` 树，大模型 AI 因此直接被输入严苛的高层级约束指导设计原则。这种模式下，GitHub Copilot 不再只是生产一些散装函数的助手，而是直接演变为产出**贴合于架构预期结果代码**的成熟工具。


# 1. 简介与核心概念 (Introduction)

传统的软件开发中，架构图往往停留在 Visio 或企业架构工具中，和代码仓库脱节。当开发人员编写代码时，AI 生成的内容可能会偏离原始的规划。

**AI-For-Project-Building (AI4PB)** 方法论正是为了解决这一痛点，它基于以下三大支柱：

### 1. 模型驱动的架构约束 (Model-Driven Architecture)
使用 **Sparx Enterprise Architect (EA)** 与 **ArchiMate** 语言进行企业级架构建模（涵盖战略、业务、应用、技术层）。AI4PB 突破性地**在架构元素上直接定义 Task（任务）和 Issue（问题）**，使得每一个开发动作都具备明确的架构“归属”。然后将这套模型知识图谱导出为机器（大模型）可读的 JSON 格式。

### 2. SCRUM 敏捷交付流程 (SCRUM Agile Workflow)
AI4PB 并不是把大把任务胡乱扔给 AI，而是严格遵循敏捷的节奏：
- **规划**：梳理待办任务清单（Task List）。
- **启动**：拉齐上下文，对齐架构目标（Init）。
- **执行**：指导个体任务开发（Task Support）。
- **修复**：对测试中发现的缺陷继续跟进（Iteration Issues）。
- **复盘**：迭代总结与产物回顾（Wrap-up & Iteration Summary）。

### 3. AI Copilot 智能辅助 (AI-Assisted Copilot)
借助部署在 VS Code 中的 **AI4PB Orchestrator 扩展** 和 **GitHub Copilot Chat**，我们建立了一套规范的 `Prompt Tool` 体系（如 `#ai4pb-init`, `#ai4pb-audit`）。AI 助手读取先前的架构 JSON 数据与特定的提示词模板，自动输出代码、审计报告和周报，实现自动化与高可控。

---

## 典型角色与分工
- **系统工程师 (System Engineer) / 架构师**：在 EA 中维护业务和应用组件模型，下派 Task；通过 JS 脚本将模型导出；在 VS Code 中点选工作流节点，审核 AI 给出的“架构-代码”审计报告并在 EA 中完成最终修复。
- **AI 助手 (LLM / Copilot) 作为主要执行人**：作为研发执行的 Assistant（责任人指派为 `llm` 时使用本流程最理想），依据指令生成代码和文档。
- **测试工程师 (Test Engineer)**：将测试过程中发现的问题反馈至架构中的 `Issue` ，并通过新一轮迭代由 AI 继续修复。

# 2. 环境与前置准备 (Prerequisites)

为了能够顺利跑通 AI4PB 闭环，你的开发工作站必须具备以下软硬件和配置前置条件。

## 2.1 架构设计端

- **Sparx Enterprise Architect (EA)**：推荐版本 15+ 或更高。用于加载 AI4PB 模板 `.feap` 并创建、维护架构图和任务体系。
- **EA JScript 支持**：默认内置。需确保你可以调用 EA 内置脚本来一键抽取 JSON。
- **(可选) MS Word 环境**：EA 中的原生部分脚本可能会涉及利用 Word 的 COM 接口生成 PDF 文档。

## 2.2 开发与 AI 终端

- **Visual Studio Code (VS Code)**：至少需要支持 LLM API 的高版本 (例如 `>=1.95.0`)。
- **GitHub Copilot & Copilot Chat**：必须安装且使用具有 Copilot 服务授权的账号进行登录。此乃引擎驱动的核心。
- **AI4PB Orchestrator 拓展**：通过本地构建 (`npm run release:vsix`) 并安装，或者从 Marketplace 下载最新的正式版（如 0.0.36+）。
- **Node.js与包管理工具**（可选但推荐）：若你需要维护 AI4PB-Orchestrator 本身，需确保本地配置 TypeScript、npm 链条环境。

## 2.3 工作区准备 (Workspace Setup)

当你在 VS Code 中打开一个空目录准备利用 AI4PB 开始新项目时，首先需要在侧边栏操作：

1. 打开 AI4PB 工作流侧边栏。
2. 点击 **初始化 EA 模板 (Initialize EA Template)** 命令。
3. 该操作将会自动向你的工作区根源释放 `EA-model-template.feap`，作为标准的企业架构建模起手点。

---
完成环境检测后，即可进入 [第三章：基于 EA 的架构建模与数据导出](03-modeling-and-export.md)。

# 3. 基于 EA 的架构建模与数据导出 (Modeling & Export)

在开发或迭代的最初阶段，所有的需求解析和结构设计均应首先在 Sparx EA 中收口，再流通给后端的 AI 引擎。

## 3.1 架构分层体系 (Architecture Layers)

根据 ArchiMate 标准与 AI4PB 的最佳实践，你需要进行分层次的建模：
- **Strategy & Motivation**：目标与战略。
- **Business Layer**：业务流程 (BusinessProcess)、业务节点；这定义了我们要*做什么*流程。
- **Application Layer**：应用服务 (ApplicationService)、应用组件 (ApplicationComponent) 与数据对象 (DataObject)；这定义了用*什么软件实体*去支撑。
- **Technology Layer**：技术组件系统 (SystemSoftware、Nodes 等)。

## 3.2 派发任务与指派 LLM (Tasks & Issues)

本流程的独家特色是把敏捷开发与模型元素绑定：
1. 双击模型元素（比如 `FeatureA Component`）。
2. 在该元素的属性 / 项目 (Project) 面板中添加 `Requirement`、`Task` 或 `Issue`。
3. **关键参数配置**：
   - `Name`: 包含针对 AI 的简短可执行指示（如“请帮我实现基于 Flask 的用户查询接口”）。
   - `Type`: 选为 `TODO` (表示新规划) 或 `Issue` (表示缺陷或修改)。
   - `Status`: 必须设定为 `Active` 才会流向处理环节！
   - `Assigned To`: 高度推荐设为 `llm`（代表你要委派给 Copilot 完成）。

## 3.3 导出为机器可读上下文 (知识图谱 JSON)

AI 无法直接阅读二进制 `.feap`。我们需要用附带的 JS 脚本：

1. 在 EA 中，选择你需要抽取的顶层包或关系图。
2. 运行脚本：`project_auto_gen_suitable_for_LLM-V2-bootstrap.js`。
   - 使用 bootstrap 模式可以确保所有模型使用的抽取逻辑一致并自动寻址到 `.vscode` 或者本地扩展安装点中的真实验本。
3. 检查生成产物：
   - 脚本将成功输出带有任务体系的 JSON 至 `design/KG/SystemArchitecture.json` （核心约束路径）。
  - 与此同时导出专门的任务文件 `design/tasks/taskandissues_for_LLM.md`。

至此，大语言模型进行精准“AI生成”所需的前置语料已经储备完毕！接下来可以在开发环境使用插件将这些架构直接注入对话窗口。

# 4. AI4PB Orchestrator 扩展基础 (VS Code Extension)

**AI4PB Orchestrator** 扩展是将模型 JSON 数据与 VS Code 中 GitHub Copilot Chat 相连接的核心“桥梁组件”。

## 4.1 UI 与侧边栏交互

安装扩展后，VS Code 左侧活动栏将出现 **AI4PB DEV** 图标。点击该图标将呈现按 SCRUM 主板编排的动作按钮组：

- `初始化 EA 模板`
- `导出选项` (控制当前上下文策略)
- 一系列依照工作流排布的 Copilot 触发入口（如 `#ai4pb-task-list`, `#ai4pb-init` 提供直接点选）。

当你点选其中任意节点，扩展将在后台将特定的“角色 Prompt”、“当前架构的语料路径”以及“行动唤起指令”一并封入 Chat 会话流，以自动形式代你向 Copilot 下达执行指令。

## 4.2 导出选项配置 (.aicodingconfig)

位于项目根目录下的 `.aicodingconfig` 或 `.aicodingconfig.json`，是控制扩展和抽取脚本（如 EA 脚本端如何过滤任务）的配置文件。

示例：
```json
{
  "EA_AUTOGEN_CONFIG": {
    "needallmaintenace": "onlyActive",
    "needbrowserlocation": true,
    "maintenacetype": "forllm"
  }
}
```
- `needallmaintenace`: 控制抽取出来的任务状态（`onlyActive` 是主流做法，以缩小发给 Copilot 的 Token 体积并将精力集中于当期 Sprint）。
- `maintenacetype`: 聚焦将 `Assigned To` 为 `forllm`（或等效 `llm`）的任务推送给 AI 进行处理。

## 4.3 提示词模板注册 (Prompt Tools)

扩展本身也是实现了 VS Code 最新的 Language Model Tool API 提供者。它预先注册了一整套 `#ai4pb-xxxx` 提示词工具资产（存放在代码仓的 `workprompt/*.md` 及 `.github/skills/*`），这些资产区分为：
- **模板型 Prompt (由 LM Tool 读取)**：指引 Copilot 应如何响应、思考。
- **产出型 Prompt**：基于上述模板在会话中真实执行后生成的输出文档（例如：`implementation/task-list.md`）。

当在 Chat 中 @Copilot 并引用 `#ai4pb-xxx` 时，Copilot 相当于获得了这套架构指南和专家级角色设定，不会偏题瞎写。

# 5. SCRUM 敏捷执行工作流 (SCRUM Workflow)

AI4PB 最核心的工作模式，即是依据下述按部就班的 SCRUM 步序进行 AI 辅助工程研发：
在项目导出完成 `design/KG/SystemArchitecture.json` 后，请在 VS Code 侧边栏按顺序点击或向 Copilot 输入如下技能流：

### Step 1: Task List (任务清单排期)
- **触发**：`打开 Copilot（Task List）` 或者使用 `ai4pb.openCopilotWithTaskListPrompt`。
- **目的**：AI 全览整个项目的 `Active` Todo 和优先级，输出一个用于总览的单个 Markdown 综合看板文件 (`implementation/task-list.md`)。
- **行动**：团队确认本周 (本 Sprint) 需要攻坚的任务子集。

### Step 2: Init (迭代启动 / Kickoff)
- **触发**：`打开 Copilot（Init Prompt）`。
- **目的**：为新发起的重度组件设定初始上下文与目标边界、并列出风险。
- **行动**：在聊天窗口产出初始目标与范围说明（基于 `initial-prompt.md` 模板），为当前会话奠定认知。

### Step 3: Task Support (具体任务执行与开发)
- **触发**：`打开 Copilot（Task Support）`。
- **目的**：针对 Step 1 确定的特定 `Active Task`，为其分别生成专属的 `执行支撑说明` (`implementation/taskhelpinfos/xxx.md`)，并由 Copilot 开始真实编写代码和配置。
- **行动**：AI 阅读并写出目标代码。

### Step 4: Iteration Issues (缺陷修改)
- **触发**：`打开 Copilot（Iteration Issues）`。
- **目的**：当测试人员或代码审查中提出发现的 bug 时（在 EA 中记为 Issue 并重新 Export），AI 继续根据新增加的缺口记录实施多轮迭代修复。
- **行动**：阅读 `taskandissues_for_LLM.md`，解决未完成项。

### Step 5: Design Audit (架构-代码审计 / Traceability)
- **触发**：`打开 Copilot（Design Audit）`。
- **目的**：“这批代码改坏了架构没有？”本步骤执行严苛的代码-架构一致性校验。
- **行动**：AI 会读取实际产生的代码与 `SystemArchitecture.json` 里的声明差异，将缺失的 `code_paths` 以及职责越位的部分输出到 `design/temp/audit.md` 审计报告临时文件中。
- **反馈**：系统工程师依据审计文案在 EA 中手工修正模型，从而保持图纸依然 100% 反映代码现状。

### Step 6: Wrap-up & Iteration Summary (迭代收尾与 Git 提交)
- **触发**：`打开 Copilot（Wrap-up）` 以及紧接着的 `打开 Copilot（Iteration Summary）`。
- **目的**：生成结项报告（确认哪些需求通过，哪些存在风险遗留给下期），同时 AI 为代码变更生成标准和专业的 Git Commit Message (`debug/iteration-commit-message.md`)。

### Step 7: Weekly Report (沟通管理 / 周报)
- **触发**：`打开 Copilot（Weekly Report）`。
- **目的**：为干系人生成易于理解的管理层周报 (`implementation/reports/xxx.md`)。涵盖执行摘要和表格级别的任务进展。

---
完成 Step 7，即宣告本周敏捷 Sprint 从架构发起到收尾的闭环圆满跑过一轮。然后将代码 Push 并同步 EA 图形库准备下一条。

# 6. 最佳实践与输出物管理 (Best Practices)

让 AI 平稳受控地产出企业级价值并不过分天马行空，需要遵守良好的目录隔离、模型管理策略和提问礼仪。

## 6.1 输出物边界 (Directory Separation)

为了维护项目目录整洁与功能明确，应当严格遵循下方隔离边界：

- **业务交付物：`implementation/*`**
  这些是给开发人员、测试或 PM 阅读的内容：如 `task-list.md`, 各个子任务说明 `taskhelpinfos/`, 迭代周报 `reports/`。
- **扩展工时与追踪记录：`TEMP/*` / `debug/*` / `design/temp/`**
  运行产生的状态、代码分析对比文档 (例如审计的 `audit.md`，用于对齐的 `design-code-alignment.md`，或者 git commit message `debug/iteration-commit-message.md`)。 这些文件一般不需要作为业务资产留存和展示给最终客户。

## 6.2 EA 模型维护的黄金法则

- **宁少勿错，细化任务**：与其给模型元素挂一个名为“做完产品中心”的 `Task`，不如拆为 “开发产品中心查询 SQL”、“提供产品详情 API”、“制作产品列表前端组件”。AI 一次只能在有明确边界的小任务下提供稳定的优质生成率。
- **及时更新与再获取**：如果在开发过程中 AI 建议将某个模块分为两半（例如重构解耦：`Separation of Concerns`），工程师应当根据 `Design Audit` 的提议：
  1. 打开 EA 调整模型。
  2. 填写正确的 `code_paths` 至元素的 Tags / Properties 里。
  3. 再次导出 JSON。
  4. 切勿容忍长期“图码不一致”。

## 6.3 提示词 (Prompt) 调优规则

如果你需要调整系统级别的提示资产（比如针对本团队特殊加入测试脚本调用）：

- 找到 `workprompt` 目录下的 `.md` 或者 `.github/skills/` 里的 Skill 文件。
- 确认自己是在编写“模板型 Prompt”还是“产出型 Prompt”。（见 `workprompt/README.md`）
- 保持核心数据抓取锚点 `design/KG/SystemArchitecture.json` 不做破坏。

## 6.4 AI 无法取代的东西：测试与闭环复核

- `TestAndVerification` 节点当前无法由本平台全量全自动处理，这仍然需要 QA 从实际运行时提供 Bug 清单（或单元测试/集成测试未通过清单）。
- 始终把 `AI4PB: Design Audit Prompt` 视为一道闸门。不通过此步，不急于完成发版。架构师审查这份 “Diff / Change” 分析，决定是对代码做让步，还是喝令 AI 重改代码符合预期。















