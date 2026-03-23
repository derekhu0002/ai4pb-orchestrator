# AI4PB Orchestrator

AI4PB Orchestrator 是一款 VS Code 扩展，用于把 Sparx EA（ArchiMate）架构建模与 AI 执行（GitHub Copilot / OpenCode）连接为可落地的 SCRUM 交付闭环。

核心价值：让 AI 在架构约束下执行，而不是脱离上下文地生成代码。

## Why AI4PB

传统研发中，架构图、任务、缺陷、代码和复盘往往分散在不同工具，导致：

- AI 输出容易偏离设计边界
- 迭代过程缺少统一入口
- 交付后很难做持续的设计-代码对齐

AI4PB 提供一条统一路径：

1. 在 EA 维护模型与任务
2. 导出架构上下文 `design/KG/SystemArchitecture.json`
3. 在 VS Code 侧边栏按流程执行 AI 任务
4. 通过设计审计与迭代收尾完成闭环

## What Is Implemented Now

### 1) 统一工作台（三大菜单）

扩展侧边栏当前提供以下主菜单：

- `智能路由`：根据输入自动匹配合适 SCRUM 环节
- `流程导航`：手动进入明确流程与步骤
- `配置中心`：集中处理初始化与参数配置

### 2) 流程导航（四条流程）

当前流程与步骤如下：

- `SCRUM敏捷开发流程`：`待办梳理 -> 迭代启动 -> 问题反馈 -> 问题处理 -> 迭代收尾 -> 提交总结`
- `设计审计流程`：`设计审计`
- `计划与汇报流程`：`提取任务 -> 待办梳理 -> 周报输出`
- `执行支持流程`：`执行支持`

### 3) 配置中心按钮

当前界面中可直接点击：

- `EA模板初始化`
- `初始化AICodingAgent配置`
- `EA导出参数配置`
- `参数查询`

### 4) AI 执行兼容

支持两种执行方式：

- GitHub Copilot（默认）
- OpenCode（可通过 `.aicodingconfig` 路由切换）

## Prompt Tools

扩展已注册并可在 Copilot 上下文中引用：

- `#ai4pb-init`
- `#ai4pb-audit`
- `#ai4pb-wrapup`
- `#ai4pb-task-list`
- `#ai4pb-task-support`
- `#ai4pb-weekly-report`
- `#ai4pb-iteration-issues`
- `#ai4pb-iteration-summary`

## Included Commands

命令面板（Ctrl+Shift+P / Cmd+Shift+P）当前包含：

- `AI4PB: Open in Editor`
- `AI4PB: Initialize EA Template`
- `AI4PB: Refresh Architecture Context`
- `AI4PB: Start Iteration from Model`
- `AI4PB: Run Design-Code Alignment`
- `AI4PB: Generate Wrap-up Report`
- `AI4PB: Open Next Action`
- `AI4PB: Run All (Guided)`
- `AI4PB: Open Copilot with Init Prompt`
- `AI4PB: Open Copilot with Design Audit Prompt`
- `AI4PB: Open Copilot with Wrap-up Prompt`
- `AI4PB: Open Copilot with Task List Prompt`
- `AI4PB: Open Copilot with Task Support Prompt`
- `AI4PB: Open Copilot with Weekly Report Prompt`
- `AI4PB: Open Copilot with Iteration Issues Prompt`
- `AI4PB: Open Copilot with Iteration Summary Prompt`

## Prerequisites

- Sparx Enterprise Architect（建议 15+）
- VS Code（建议 1.95+）
- GitHub Copilot（默认执行引擎）
- AI4PB Orchestrator 扩展

可选（OpenCode）：

- 在 WSL 中安装：`npm install -g opencode-ai`
- 启动服务：`opencode serve`（默认 `http://127.0.0.1:4096`）
- 在 `.aicodingconfig` 中配置路由

## Quick Start

1. 在 VS Code 打开项目目录，进入 AI4PB 侧边栏。
2. 在 `配置中心` 点击 `EA模板初始化`。
3. 在 EA 中建模并维护 Task / Issue（建议 `Status=Active`，`Assigned To=llm`）。
4. 从 EA 导出 `design/KG/SystemArchitecture.json`。
5. 在 `计划与汇报流程` 点击 `提取任务`，自动生成 `design/tasks/taskandissues_for_LLM.md`。
6. 在 `流程导航` 中按需执行对应步骤。

## OpenCode Routing Example

```json
{
   "AGENT_ROUTER_CONFIG": {
      "default_agent": "opencode",
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
}
```

仅把特定步骤路由到 OpenCode：

```json
{
   "AGENT_ROUTER_CONFIG": {
      "default_agent": "copilot",
      "task_specific_agents": {
         "task-list": "opencode"
      }
   }
}
```

## Outputs

业务交付物（`implementation/*`）：

- `implementation/task-list.md`
- `implementation/taskhelpinfos/*.md`
- `implementation/reports/*.md`

过程工件：

- `design/temp/audit.md`
- `debug/iteration-commit-message.md`

## Documentation

- Getting Started：https://github.com/derekhu0002/ai4pb-orchestrator/blob/main/docs/getting-started/README.md
- Full Guide：https://github.com/derekhu0002/ai4pb-orchestrator/blob/main/docs/getting-started/00-getting-started-overview.md
- Workflow：https://github.com/derekhu0002/ai4pb-orchestrator/blob/main/docs/getting-started/05-scrum-workflow.md

## Summary

AI4PB Orchestrator 并不是“通用聊天式”编码助手，而是面向架构驱动交付的流程化 AI 工作台。

如果你需要在企业项目里把架构、任务、执行、审计与复盘打通，这个扩展就是当前代码仓已经实现并可直接使用的方案。
