# AI4PB Orchestrator

AI4PB Orchestrator 是面向系统工程师的 VS Code 扩展，用于把 EA（ArchiMate）模型与 Copilot 实施流程衔接起来，形成“建模 -> 导出 -> 实施 -> 审计 -> 总结”的闭环。

## 扩展定位

- 以 `design/KG/SystemArchitecture.json` 作为实现约束。
- 通过侧边栏工作流动作降低操作门槛。
- 通过 Prompt Tool + 报告产物保留迭代可追溯性。

## 当前侧边栏动作

当前 Workflow 动作已经移除“提示词集合”按钮，按 SCRUM 流程组织 Copilot 操作：

1. `初始化 EA 模板`
2. `导出选项`
3. `打开 Copilot（Task List）`
4. `打开 Copilot（Init Prompt）`
5. `打开 Copilot（Task Support）`
6. `打开 Copilot（Iteration Issues）`
7. `打开 Copilot（Design Audit）`
8. `打开 Copilot（Wrap-up）`
9. `打开 Copilot（Iteration Summary）`
10. `打开 Copilot（Weekly Report）`

## Action -> Command 映射

| 侧边栏动作 | Command ID | 说明 |
| --- | --- | --- |
| 初始化 EA 模板 | `ai4pb.initializeFromTemplate` | 复制 EA 模板到工作区根目录并命名为 `<workspace>.feap` |
| 导出选项 | 内部动作 | 维护 `.aicodingconfig` 中维护模式与导出选项 |
| 打开 Copilot（Task List） | `ai4pb.openCopilotWithTaskListPrompt` | 触发 `#ai4pb-task-list` |
| 打开 Copilot（Init Prompt） | `ai4pb.openCopilotWithInitPrompt` | 触发 `#ai4pb-init` |
| 打开 Copilot（Task Support） | `ai4pb.openCopilotWithTaskSupportPrompt` | 触发 `#ai4pb-task-support` |
| 打开 Copilot（Iteration Issues） | `ai4pb.openCopilotWithIterationIssuesPrompt` | 触发 `#ai4pb-iteration-issues` |
| 打开 Copilot（Design Audit） | `ai4pb.openCopilotWithDesignAuditPrompt` | 触发 `#ai4pb-audit` |
| 打开 Copilot（Wrap-up） | `ai4pb.openCopilotWithWrapUpPrompt` | 触发 `#ai4pb-wrapup` |
| 打开 Copilot（Iteration Summary） | `ai4pb.openCopilotWithIterationSummaryPrompt` | 触发 `#ai4pb-iteration-summary` |
| 打开 Copilot（Weekly Report） | `ai4pb.openCopilotWithWeeklyReportPrompt` | 触发 `#ai4pb-weekly-report` |

## Chat 请求路径说明

侧边栏 Webview 的聊天请求由 `WorkflowViewProvider.handleChatRequest` 统一处理，支持两种模式：

- 显式技能选择：用户在 UI 中选择 skill 时，直接使用该 skill（如 `task-list`、`audit`）。
- 自动技能推断：未选择 skill 时，基于输入文本执行技能推断并自动路由到对应 prompt 引用。

最终会拼装种子文本并调用 Copilot 打开流程（`openCopilotWithPromptReference`）。

## Prompt Tools

扩展内置以下可引用工具（Copilot Chat 中可用）：

- `#ai4pb-init`
- `#ai4pb-audit`
- `#ai4pb-wrapup`
- `#ai4pb-iteration-summary`
- `#ai4pb-task-list`
- `#ai4pb-task-support`
- `#ai4pb-weekly-report`
- `#ai4pb-iteration-issues`

## 推荐流程

1. 在 EA 中维护任务并导出 `design/KG/SystemArchitecture.json`。
2. 在 VS Code 点击 `导出选项` 设置维护模式。
3. 按 SCRUM 顺序执行 Copilot 动作：Task List -> Init -> Task Support -> Iteration Issues -> Audit -> Wrap-up -> Iteration Summary -> Weekly Report。
4. 复核 `TEMP/` 中产物并回写 EA。

## 关键路径

- 架构 JSON：`design/KG/SystemArchitecture.json`
- 扩展入口：`src/extension.ts`
- Prompt 资产：`workprompt/*.md`
- 报告输出：`TEMP/`

## 常见命令

- 编译：`npm run compile`
- 本地打包：`npm run release:vsix:nobump`
- 发布打包（patch）：`npm run release:vsix`

## FAQ

### 为什么看不到最新架构内容？

- 请先在 EA 中重新导出。
- 检查 `design/KG/SystemArchitecture.json` 的更新时间。

### Copilot 一键入口无响应怎么办？

- 确保 VS Code 已安装并启用 GitHub Copilot Chat。
- 在命令面板手动执行对应 `AI4PB: Open Copilot with ...` 命令确认可用性。
































