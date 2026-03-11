# AI4PB 完整上手指南（合并版）

## 目录

- [1. 简介与核心概念](#1-简介与核心概念-introduction)
- [2. 环境与前置准备](#2-环境与前置准备-prerequisites)
- [3. 基于 EA 的架构建模与数据导出](#3-基于-ea-的架构建模与数据导出-modeling--export)
- [4. AI4PB Orchestrator 扩展基础](#4-ai4pb-orchestrator-扩展基础-vs-code-extension)
- [5. SCRUM 敏捷执行工作流](#5-scrum-敏捷执行工作流-scrum-workflow)
- [6. 最佳实践与输出物管理](#6-最佳实践与输出物管理-best-practices)

---

## 1. 简介与核心概念 (Introduction)

传统的软件开发中，架构图往往停留在 Visio 或企业架构工具中，和代码仓库脱节。当开发人员编写代码时，AI 生成的内容可能会偏离原始的规划。

**AI-For-Project-Building (AI4PB)** 方法论正是为了解决这一痛点，它基于以下三大支柱：

### 1.1 模型驱动的架构约束 (Model-Driven Architecture)

使用 **Sparx Enterprise Architect (EA)** 与 **ArchiMate** 语言进行企业级架构建模（涵盖战略、业务、应用、技术层）。AI4PB 突破性地**在架构元素上直接定义 Task（任务）和 Issue（问题）**，使得每一个开发动作都具备明确的架构“归属”。然后将这套模型知识图谱导出为机器（大模型）可读的 JSON 格式。

### 1.2 SCRUM 敏捷交付流程 (SCRUM Agile Workflow)

AI4PB 并不是把大把任务胡乱扔给 AI，而是严格遵循敏捷的节奏：

- **规划**：梳理待办任务清单（Task List）。
- **启动**：拉齐上下文，对齐架构目标（Init）。
- **执行**：指导个体任务开发（Task Support）。
- **修复**：对测试中发现的缺陷继续跟进（Iteration Issues）。
- **复盘**：迭代总结与产物回顾（Wrap-up & Iteration Summary）。

### 1.3 AI Copilot 智能辅助 (AI-Assisted Copilot)

借助部署在 VS Code 中的 **AI4PB Orchestrator 扩展** 和 **GitHub Copilot Chat**，我们建立了一套规范的 `Prompt Tool` 体系（如 `#ai4pb-init`, `#ai4pb-audit`）。AI 助手读取先前的架构 JSON 数据与特定的提示词模板，自动输出代码、审计报告和周报，实现自动化与高可控。

---

## 核心工具：Enterprise Architect (EA)

**Sparx Enterprise Architect (EA)** 是一款顶尖的全生命周期建模工具。在 AI4PB 框架中，EA 绝不是单纯的画图板，而是整个架构分析、需求管理、任务下发（Task）与问题追踪（Issue）的**单一事实来源（Single Source of Truth）**。
通过 EA 强大的扩展性和脚本能力，平台将多层次的模型元素、关联关系及其属性数据，一键导出为机器可读的知识图谱（格式为 JSON 的架构摘要），从而完美桥接“图纸”与“代码”。

## 核心语言：ArchiMate 建模构建系统骨架

**ArchiMate** 是由 The Open Group 发布的开放、标准化的企业架构（EA）建模语言。在 AI4PB 框架中，我们强制要求使用 ArchiMate 语言对系统进行建模（支持对业务层、应用层、技术层的严格划定与关系映射）：

- **认知对齐**：标准化的节点（如 Business Process, Application Component, Device）为人和 AI（LLM）提供了一套无歧义的通用架构词汇。
- **全链路追溯（Traceability）**：结合“渐进式暴露”设计，ArchiMate 能让我们直观地将代码实现映射到上层的应用服务或业务逻辑中，从而实现代码到架构的严密防腐与对齐。

---

## 典型角色与分工

- **系统工程师 (System Engineer) / 架构师**：在 EA 中维护业务和应用组件模型，下派 Task；通过 JS 脚本将模型导出；在 VS Code 中点选工作流节点，审核 AI 给出的“架构-代码”审计报告并在 EA 中完成最终修复。
- **AI 助手 (LLM / Copilot) 作为主要执行人**：作为研发执行的 Assistant（责任人指派为 `llm` 时使用本流程最理想），依据指令生成代码和文档。
- **测试工程师 (Test Engineer)**：将测试过程中发现的问题反馈至架构中的 `Issue`，并通过新一轮迭代由 AI 继续修复。

---

## 参考与学习资源 (References & Learning Resources)

- **Sparx Enterprise Architect**: [官方网站](https://sparxsystems.com/) | [EA 用户指南](https://sparxsystems.com/enterprise_architect_user_guide/)
- **ArchiMate 建模语言**: [The Open Group 官方规范 (ArchiMate 3.2)](https://pubs.opengroup.org/architecture/archimate3-doc/)
- **SCRUM 敏捷开发**: [The Scrum Guide](https://scrumguides.org/)
- **GitHub Copilot**: [官方文档](https://docs.github.com/en/copilot)

---

## 2. 环境与前置准备 (Prerequisites)

为了能够顺利跑通 AI4PB 闭环，你的开发工作站必须具备以下软硬件和配置前置条件。

### 2.1 架构设计端

- **Sparx Enterprise Architect (EA)**：推荐版本 15+ 或更高。用于加载 AI4PB 模板 `.feap` 并创建、维护架构图和任务体系。
- **EA JScript 支持**：默认内置。需确保你可以调用 EA 内置脚本来一键抽取 JSON。
- **(可选) MS Word 环境**：EA 中的原生部分脚本可能会涉及利用 Word 的 COM 接口生成 PDF 文档。

### 2.2 开发与 AI 终端

- **Visual Studio Code (VS Code)**：至少需要支持 LLM API 的高版本 (例如 `>=1.95.0`)。
- **GitHub Copilot & Copilot Chat**：必须安装且使用具有 Copilot 服务授权的账号进行登录。此乃引擎驱动的核心。
- **AI4PB Orchestrator 拓展**：通过本地构建 (`npm run release:vsix`) 并安装，或者从 Marketplace 下载最新的正式版（如 0.0.36+）。
- **Node.js与包管理工具**（可选但推荐）：若你需要维护 AI4PB-Orchestrator 本身，需确保本地配置 TypeScript、npm 链条环境。

### 2.3 工作区准备 (Workspace Setup)

当你在 VS Code 中打开一个空目录准备利用 AI4PB 开始新项目时，首先需要在侧边栏操作：

1. 打开 AI4PB 工作流侧边栏。
2. 点击 **初始化 EA 模板 (Initialize EA Template)** 命令。
3. 该操作将会自动向你的工作区根源释放 `EA-model-template.feap`，作为标准的企业架构建模起手点。

---
完成环境检测后，即可进入 [第三章：基于 EA 的架构建模与数据导出](03-modeling-and-export.md)。

---

## 3. 基于 EA 的架构建模与数据导出 (Modeling & Export)

在开发或迭代的最初阶段，所有的需求解析和结构设计均应首先在 Sparx EA 中收口，再流通给后端的 AI 引擎。

### 3.1 架构分层体系 (Architecture Layers)

根据 ArchiMate 标准与 AI4PB 的最佳实践，你需要进行分层次的建模，以确保系统的每个关注点（Concern）得到独立且完整的呈现：

![架构分层图](<Pasted image 20260310130404.png>)

- **Archimate建模语言映射的本体结构**:
- 实体：

![实体关系](image-3.png)

- 关系：

![关系类型](image-4.png)

- **Strategy & Motivation (战略与动机层)**：

![战略与动机层](image-5.png)

	- **概念模型**：包含 `Goal` (目标), `Requirement` (需求), `Principle` (原则), `Constraint` (约束) 等。
	- **核心作用**：定义系统“为什么”要这么做。AI 助手将遵循其中的 `Principle` 和 `Constraint` 生成代码，以符合架构准则。

- **Business Layer (业务层)**：

![业务层](image-6.png)

	- **概念模型**：包含 `BusinessProcess` (业务流程), `BusinessActor` (业务角色), `BusinessService` (业务服务) 等。
	- **核心作用**：定义我们要“做什么”流程以及谁在参与。它勾勒了业务的真实运转脉络，并为后续的应用设计提供边界参考。

- **Application Layer (应用层)**：

![应用层](image-7.png)

	- **概念模型**：包含 `ApplicationComponent` (应用组件), `ApplicationService` (应用服务), `ApplicationInterface` (应用接口), `DataObject` (数据对象) 等。
	- **核心作用**：定义用“什么软件实体”去支撑业务运作。这是 AI 助手重点关注的一层，代码中的模块、类、或微服务通常会与 `ApplicationComponent` 直接形成 Traceability（代码追溯）映射。

- **Technology Layer (技术层)**：

![技术层](image-8.png)

	- **概念模型**：包含 `Node` (计算节点), `SystemSoftware` (系统软件, 如数据库/中间件), `Artifact` (部署伪影) 等。
	- **核心作用**：定义应用运行在“什么物理或基础软件环境”之上。帮助规划 CI/CD 部署、服务依赖、环境隔离等工程运维诉求。

> **提示：** 架构的分层不仅仅是画图，在 AI4PB 理念下，这些层级上的每一个组件模型都会作为一种“上下文屏障”，控制大模型生成代码时的视野，避免被全局复杂度淹没（即所谓的 *Progressive Disclosure 渐进式揭示* 原则）。

### 3.2 派发任务与指派 LLM (Tasks & Issues)

本流程的独家特色是把敏捷开发与模型元素绑定：

1. 双击模型元素（比如 `FeatureA Component`）。
2. 在该元素的属性 / 项目 (Project) 面板中添加 `Requirement`、`Task` 或 `Issue`。
3. **关键参数配置**：
	 - `Name`: 包含针对 AI 的简短可执行指示（如“请帮我实现基于 Flask 的用户查询接口”）。
	 - `Type`: 选为 `TODO` (表示新规划) 或 `Issue` (表示缺陷或修改)。
	 - `Status`: 必须设定为 `Active` 才会流向处理环节！
	 - `Assigned To`: 高度推荐设为 `llm`（代表你要委派给 Copilot 完成）。

![任务与问题配置](<Pasted image 20260310130656.png>)

### 3.3 导出为机器可读上下文 (知识图谱 JSON)

AI 无法直接阅读二进制 `.feap`。我们需要用附带的 JS 脚本：

1. 在 EA 中，选择你需要抽取的顶层包或关系图。
2. 运行脚本：右键点击顶层`SystemArchitecture`视图，在弹出菜单中点击`project_auto_gen-FOR-LLMV2`子菜单。
3. 检查生成产物：
	 - 脚本将成功输出带有任务体系的 JSON 至 `design/KG/SystemArchitecture.json` （核心约束路径）。
	 - 与此同时导出专门的任务文件 `design/tasks/taskandissues_for_LLM.md`。

![导出结果](<Pasted image 20260310130733.png>)

至此，大语言模型进行精准“AI生成”所需的前置语料已经储备完毕！接下来可以在开发环境使用插件将这些架构直接注入对话窗口。

---

## 4. AI4PB Orchestrator 扩展基础 (VS Code Extension)

**AI4PB Orchestrator** 扩展是将模型 JSON 数据与 VS Code 中 GitHub Copilot Chat 相连接的核心“桥梁组件”。

### 4.1 UI 与侧边栏交互

安装扩展后，VS Code 左侧活动栏将出现 **AI4PB DEV** 图标。点击该图标将呈现按 SCRUM 主板编排的动作按钮组：

- `初始化 EA 模板`
- `导出选项` (控制当前上下文策略)
- 一系列依照工作流排布的 Copilot 触发入口（如 `#ai4pb-task-list`, `#ai4pb-init` 提供直接点选）。

![扩展侧边栏](<Pasted image 20260310130829.png>)

当你点选其中任意节点，扩展将在后台将特定的“角色 Prompt”、“当前架构的语料路径”以及“行动唤起指令”一并封入 Chat 会话流，以自动形式代你向 Copilot 下达执行指令。

### 4.2 导出选项配置 (.aicodingconfig)

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

### 4.3 提示词模板注册 (Prompt Tools)

扩展本身也是实现了 VS Code 最新的 Language Model Tool API 提供者。它预先注册了一整套 `#ai4pb-xxxx` 提示词工具资产（存放在代码仓的 `workprompt/*.md` 及 `.github/skills/*`），这些资产区分为：

- **模板型 Prompt (由 LM Tool 读取)**：指引 Copilot 应如何响应、思考。
- **产出型 Prompt**：基于上述模板在会话中真实执行后生成的输出文档（例如：`implementation/task-list.md`）。

当在 Chat 中 @Copilot 并引用 `#ai4pb-xxx` 时，Copilot 相当于获得了这套架构指南和专家级角色设定，不会偏题瞎写。

---

## 5. SCRUM 敏捷执行工作流 (SCRUM Workflow)

AI4PB 最核心的工作模式，即是依据下述按部就班的 SCRUM 步序进行 AI 辅助工程研发：

### 步骤 0: 系统设计与模型构建 (System Design & Modeling)

- **工具**：Sparx Enterprise Architect (EA)
- **动作**：系统工程师或架构师使用 **ArchiMate** 建模语言在 EA 中绘制系统架构图（覆盖业务、应用、技术等各个层面）。
- **任务标记**：在具体的架构元器件（如 Application Component）上，通过挂载 `Task` 或 `Issue` 标签将本期迭代需要完成的需求和修复的缺陷明确标出。
- **产出**：通过定制脚本一键导出 `design/KG/SystemArchitecture.json` 和 `tasks/taskandissues_for_LLM.md` 等防腐模型文件，作为后续 AI 开发的单一事实来源。

> **📸 实践图例**

- 系统建模：

![系统建模](image-1.png)

- 任务分配：

![任务分配](image-9.png)

- 项目知识图谱导出：

![知识图谱导出 1](image-2.png)

![知识图谱导出 2](image-10.png)

在项目导出完成 `design/KG/SystemArchitecture.json` 后，请在 VS Code 侧边栏按顺序点击或向 Copilot 输入如下技能流：

### 步骤 1: Task List (任务清单排期)

- **触发**：`打开 Copilot（Task List）` 或者使用 `ai4pb.openCopilotWithTaskListPrompt`。

![Task List 触发](image-12.png)

- **目的**：AI 全览整个项目的 `Active` Todo 和优先级，输出一个用于总览的单个 Markdown 综合看板文件 (`implementation/task-list.md`)。
- **行动**：团队会对 AI 生成的该任务清单进行**人工审核与调整**，确认并筛选出本周 (本 Sprint) 需要攻坚的任务子集。
- **机制**：一旦调整并保存该列表，在后续执行“启动迭代”时，AI 会自动读取这份被修改和确认后的清单去分配上下文并开展编码支持。
- 任务清单分析完成：

![任务清单分析 1](image-13.png)

![任务清单分析 2](image-15.png)

![任务清单分析 3](image-17.png)

- 为每个任务生成任务执行帮助文件：

![任务帮助文件生成](image-14.png)

- 帮助文件中会包含LLM对该任务的目标、价值、方案描述，会分解子任务到具体的架构元素：

![任务帮助文件内容](image-16.png)

**用户可对该任务描述进行修改直到满意为止，该任务说明会作为迭代启动的输入**

### 步骤 2: Init (迭代启动 / Kickoff)

- **触发**：`打开 Copilot（Init Prompt）`。

![Init 触发](image-18.png)

- **目的**：为新发起的重度组件设定初始上下文与目标边界、并列出风险。
- **行动**：在聊天窗口产出初始目标与范围说明（基于 `initial-prompt.md` 模板），为当前会话奠定认知。
- Copilot执行结果：

![Init 结果](image-19.png)

- 同时Copilot会将当前代码节点打上迭代开始标签（该标签用于最后的迭代总结和代码提交信息生成）：

![迭代开始标签](image-34.png)

### 步骤 3: 人工验收 (Manual Acceptance Gate)

- **触发**：完成 `Init` 后、进入缺陷修改前。
- **目的**：由系统工程师/测试负责人进行阶段性人工验收，确认当前实现满足任务目标与关键验收条件。
- **行动**：人工检查当前代码与任务说明、核对关键功能点并记录验收结论；若发现问题，先补充为 Issue 并更新 EA 导出，再进入缺陷修改流程。
- 一次性验收成功：

![人工验收通过](image-20.png)

假如验收不满意，可以在EA中添加进一步的要求：

![新增要求](image-21.png)

- 生成后的任务进展列表：

![任务进展 1](image-22.png)

![任务进展 2](image-23.png)

### 步骤 4: Iteration Issues (缺陷修改)

- **触发**：`打开 Copilot（Iteration Issues）`。

![Iteration Issues 触发](image-24.png)

- **目的**：当测试人员或代码审查中提出发现的 bug 时（在 EA 中记为 Issue 并重新 Export），AI 继续根据新增加的缺口记录实施多轮迭代修复。
- **行动**：阅读 `taskandissues_for_LLM.md`，解决未完成项。

![Iteration Issues 处理](image-25.png)

- Copilot完成修复后会总结本次工作到`taskandissues_for_LLM.md`中：

![修复总结](image-28.png)

- 再次验证通过：

![再次验证通过](image-26.png)

### 步骤 5: Design Audit (架构-代码审计 / Traceability)

- **触发**：`打开 Copilot（Design Audit）`。

![Design Audit 触发](image-27.png)

- **目的**：“这批代码改坏了架构没有？”本步骤执行严苛的代码-架构一致性校验。
- **行动**：AI 会读取实际产生的代码与 `SystemArchitecture.json` 里的声明差异，将缺失的 `code_paths` 以及职责越位的部分输出到 `design/temp/audit.md` 审计报告临时文件中。
- **反馈**：系统工程师依据审计文案在 EA 中手工修正模型，从而保持图纸依然 100% 反映代码现状。

审计结果：

![审计结果 1](image-29.png)

![审计结果 2](image-30.png)

`//TODO 在下方描述审计结果中包含的内容大类`

根据审计结果对架构进行调整补充，如：

![架构调整补充](image-31.png)

每验收完成一个任务后，在EA中将该任务标记为`Verified`

### 步骤 6: Wrap-up & Iteration Summary (迭代收尾与 Git 提交)

- **触发**：`打开 Copilot（Wrap-up）` 以及紧接着的 `打开 Copilot（Iteration Summary）`。

所有任务都验收完成后，导出新的任务跟踪表：

![新的任务跟踪表](image-32.png)

启动迭代收尾检查和总结：

![迭代收尾检查](image-33.png)

- **目的**：生成结项报告（确认哪些需求通过，哪些存在风险遗留给下期），同时 AI 为代码变更生成标准和专业的 Git Commit Message (`debug/iteration-commit-message.md`)。

- 生成总结报告：

![总结报告](image-35.png)

- 生成本迭代提交信息：

![迭代提交信息生成](image-36.png)

结果(基于迭代起始标签总结得到整个迭代的GIT提交消息)：

![迭代提交信息结果](image-37.png)

### 步骤 7: Weekly Report (沟通管理 / 周报)

- **触发**：`打开 Copilot（Weekly Report）`。

![Weekly Report 触发](image-38.png)

- **目的**：为干系人生成易于理解的管理层周报 (`implementation/reports/xxx.md`)。涵盖执行摘要和表格级别的任务进展。

- 周报生成结果：

![周报生成结果](image-40.png)

---
完成 步骤 7，即宣告本次敏捷 Sprint 从架构发起到收尾的闭环圆满跑过一轮。准备下一次迭代。

---

## 6. 最佳实践与输出物管理 (Best Practices)

让 AI 平稳受控地产出企业级价值并不过分天马行空，需要遵守良好的目录隔离、模型管理策略和提问礼仪。

### 6.1 输出物边界 (Directory Separation)

为了维护项目目录整洁与功能明确，应当严格遵循下方隔离边界：

- **业务交付物：`implementation/*`**
	这些是给开发人员、测试或 PM 阅读的内容：如 `task-list.md`, 各个子任务说明 `taskhelpinfos/`, 迭代周报 `reports/`。
- **扩展工时与追踪记录：`TEMP/*` / `debug/*` / `design/temp/`**
	运行产生的状态、代码分析对比文档 (例如审计的 `audit.md`，用于对齐的 `design-code-alignment.md`，或者 git commit message `debug/iteration-commit-message.md`)。这些文件一般不需要作为业务资产留存和展示给最终客户。

### 6.2 EA 模型维护的黄金法则

- **宁少勿错，细化任务**：与其给模型元素挂一个名为“做完产品中心”的 `Task`，不如拆为 “开发产品中心查询 SQL”、“提供产品详情 API”、“制作产品列表前端组件”。AI 一次只能在有明确边界的小任务下提供稳定的优质生成率。
- **及时更新与再获取**：如果在开发过程中 AI 建议将某个模块分为两半（例如重构解耦：`Separation of Concerns`），工程师应当根据 `Design Audit` 的提议：
	1. 打开 EA 调整模型。
	2. 填写正确的 `code_paths` 至元素的 Tags / Properties 里。
	3. 再次导出 JSON。
	4. 切勿容忍长期“图码不一致”。

### 6.3 提示词 (Prompt) 调优规则

如果你需要调整系统级别的提示资产（比如针对本团队特殊加入测试脚本调用）：

- 找到 `workprompt` 目录下的 `.md` 或者 `.github/skills/` 里的 Skill 文件。
- 确认自己是在编写“模板型 Prompt”还是“产出型 Prompt”。（见 `workprompt/README.md`）
- 保持核心数据抓取锚点 `design/KG/SystemArchitecture.json` 不做破坏。

### 6.4 AI 无法取代的东西：测试与闭环复核

- `TestAndVerification` 节点当前无法由本平台全量全自动处理，这仍然需要 QA 从实际运行时提供 Bug 清单（或单元测试/集成测试未通过清单）。
- 始终把 `AI4PB: Design Audit Prompt` 视为一道闸门。不通过此步，不急于完成发版。架构师审查这份 “Diff / Change” 分析，决定是对代码做让步，还是喝令 AI 重改代码符合预期。

---

## 原始拆分文档

- [01-introduction.md](01-introduction.md)
- [02-prerequisites.md](02-prerequisites.md)
- [03-modeling-and-export.md](03-modeling-and-export.md)
- [04-orchestrator-extension.md](04-orchestrator-extension.md)
- [05-scrum-workflow.md](05-scrum-workflow.md)
- [06-best-practices.md](06-best-practices.md)