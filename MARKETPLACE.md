# AI4PB Orchestrator

AI4PB Orchestrator 是一款 VS Code 扩展，用于把 Sparx EA（ArchiMate）架构建模与 GitHub Copilot 研发执行串成可落地的闭环流程。

核心价值：让 AI 基于架构约束执行开发，而不是脱离上下文地生成代码。

## Why AI4PB

传统痛点：架构图与代码实现割裂，需求变化后难以持续对齐。

AI4PB 方法：
- 使用 EA + ArchiMate 维护架构与任务（Task/Issue）。
- 导出机器可读上下文（design/KG/SystemArchitecture.json 与 design/tasks/taskandissues_for_LLM.md）。
- 在 VS Code 侧边栏按 SCRUM 节奏驱动 Copilot 执行。
- 通过 Design Audit、Wrap-up、Weekly Report 保持交付与治理闭环。

## Core Features

- 模型驱动开发（MDA）：架构、任务、问题统一在 EA 建模并持续导出。
- SCRUM 流程编排：Task List -> Init -> Iteration Issues -> Audit -> Wrap-up -> Iteration Summary -> Weekly Report。
- Copilot Prompt Tools：内置 AI4PB 专用工具，支持一键触发与自动路由。
- 架构-代码追踪：审计输出到 design/temp/audit.md，支撑持续对齐。
- 交付物分层：业务产物与运行过程工件目录分离，便于团队协作。

## Prompt Tools

在 Copilot Chat 中可直接使用：
- #ai4pb-init
- #ai4pb-audit
- #ai4pb-wrapup
- #ai4pb-task-list
- #ai4pb-task-support
- #ai4pb-weekly-report
- #ai4pb-iteration-issues
- #ai4pb-iteration-summary

## Included Commands

命令面板（Ctrl+Shift+P / Cmd+Shift+P）支持：
- AI4PB: Initialize EA Template
- AI4PB: Refresh Architecture Context
- AI4PB: Start Iteration from Model
- AI4PB: Run Design-Code Alignment
- AI4PB: Generate Wrap-up Report
- AI4PB: Open Next Action
- AI4PB: Run All (Guided)
- Open Copilot（Init / Design Audit / Wrap-up / Task List / Task Support / Weekly Report / Iteration Issues / Iteration Summary）

## Prerequisites

- Sparx Enterprise Architect（建议 15+）
- VS Code（建议 1.95+）
- GitHub Copilot + Copilot Chat（已授权）
- AI4PB Orchestrator 扩展（本地 VSIX 或 Marketplace）

可选：
- Node.js / npm（维护扩展时使用）
- MS Word（部分 EA 原生脚本可能用到 COM 生成 PDF）

## Quick Start

1. 在 VS Code 打开项目目录，进入 AI4PB 侧边栏。
2. 点击 Initialize EA Template，生成 EA-model-template.feap。
3. 在 EA 中按 Strategy / Business / Application / Technology 分层建模。
4. 在架构元素上挂载 Task/Issue，Assigned To 建议设为 llm。
5. 从 EA 导出：
   - design/KG/SystemArchitecture.json
   - design/tasks/taskandissues_for_LLM.md
6. 回到 VS Code 按工作流执行：Task List -> Init -> Task Support/Iteration Issues -> Audit -> Wrap-up -> Iteration Summary -> Weekly Report。

## SCRUM Workflow (Operational)

- Step 0: System Design & Modeling（EA 建模与任务挂载）
- Step 1: Task List（输出实施看板 implementation/task-list.md）
- Step 2: Init（建立当前迭代上下文与边界）
- Step 3: Manual Acceptance Gate（人工阶段验收）
- Step 4: Iteration Issues（针对问题单继续修复）
- Step 5: Design Audit（架构-代码一致性审计）
- Step 6: Wrap-up + Iteration Summary（收尾与提交信息）
- Step 7: Weekly Report（管理层周报）

## Outputs

业务交付物（implementation/*）：
- implementation/task-list.md
- implementation/taskhelpinfos/*.md
- implementation/reports/*.md

过程工件（TEMP/*、debug/*、design/temp/*）：
- TEMP/iteration-state.json
- design/temp/audit.md
- debug/iteration-commit-message.md

## Best Practices

- 任务要细粒度，避免“大而全”描述。
- 每轮开发后执行 Design Audit，及时回写 code_paths 到 EA。
- 遇到模型与实现偏差时，先更新 EA 再导出 JSON，保持图码一致。
- 对 Verified 项保留验收证据，便于 Wrap-up 与周报复盘。

## Documentation

完整上手文档位于 docs/getting-started：
- docs/getting-started/README.md
- docs/getting-started/01-introduction.md
- docs/getting-started/02-prerequisites.md
- docs/getting-started/03-modeling-and-export.md
- docs/getting-started/04-orchestrator-extension.md
- docs/getting-started/05-scrum-workflow.md
- docs/getting-started/06-best-practices.md
