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
- **测试工程师 (Test Engineer)**：将测试过程中发现的问题反馈至架构中的 `Issue` ，并通过新一轮迭代由 AI 继续修复。

---

## 参考与学习资源 (References & Learning Resources)
- **Sparx Enterprise Architect**: [官方网站](https://sparxsystems.com/) | [EA 用户指南](https://sparxsystems.com/enterprise_architect_user_guide/)
- **ArchiMate 建模语言**: [The Open Group 官方规范 (ArchiMate 3.2)](https://pubs.opengroup.org/architecture/archimate3-doc/) 
- **SCRUM 敏捷开发**: [The Scrum Guide](https://scrumguides.org/)
- **GitHub Copilot**: [官方文档](https://docs.github.com/en/copilot)