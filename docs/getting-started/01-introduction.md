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