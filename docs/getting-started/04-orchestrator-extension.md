# 4. AI4PB Orchestrator 扩展基础 (VS Code Extension)

**AI4PB Orchestrator** 扩展是将模型 JSON 数据与 VS Code 中 GitHub Copilot Chat 相连接的核心“桥梁组件”。

## 4.1 UI 与侧边栏交互

安装扩展后，VS Code 左侧活动栏将出现 **AI4PB DEV** 图标。点击该图标将呈现按 SCRUM 主板编排的动作按钮组：

- `初始化 EA 模板`
- `导出选项` (控制当前上下文策略)
- 一系列依照工作流排布的 Copilot 触发入口（如 `#ai4pb-task-list`, `#ai4pb-init` 提供直接点选）。
![[Pasted image 20260310130829.png]]

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