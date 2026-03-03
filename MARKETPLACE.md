# AI4PB Orchestrator

AI4PB Orchestrator 是面向系统工程师的 VS Code 扩展，用于把 EA（ArchiMate）建模产物与 GitHub Copilot 工作流连接起来，形成“建模 → 导出 → 实现 → 审计 → 总结”的闭环。

## What’s Included

- 工作流侧边栏（AI4PB Activity Bar）
- 架构上下文检查与迭代状态流转
- Prompt 资产管理（Init / Design Audit / Wrap-up）
- Copilot Agent Tool 集成（无需手工复制 Prompt）

## Sidebar Actions (Current)

打开 AI4PB 侧边栏后，当前可用按钮包括：

1. 初始化 EA 模板
2. 导出选项
3. 提示词集合
4. 打开 Copilot（Init Prompt）
5. 打开 Copilot（Design Audit）
6. 打开 Copilot（Wrap-up）

## Copilot Agent Tools

扩展提供 3 个可被 Agent 调用的工具：

- `#ai4pb-init` → Init Session Prompt
- `#ai4pb-audit` → Design Audit Prompt
- `#ai4pb-wrapup` → Wrap-up Prompt

你也可以使用命令面板的一键入口：

- `AI4PB: Open Copilot with Init Prompt`
- `AI4PB: Open Copilot with Design Audit Prompt`
- `AI4PB: Open Copilot with Wrap-up Prompt`

## Recommended Workflow

### 1) 在 EA 中手动导出（当前推荐）

1. 打开 EA 目标图
2. 在图中右键打开菜单
3. 执行导出菜单（你现有 EA 脚本流程）
4. 确认 `design/KG/SystemArchitecture.json` 已更新

![EA export menu](image.png)
![Architecture JSON updated](image-1.png)

### 2) 在 VS Code 中执行 AI4PB 流程

1. 使用“导出选项”设置维护模式与过滤选项
2. 使用“提示词集合”检查关键 Prompt 资产
3. 使用 Copilot 一键入口直接进入对应会话

## Notes

- 当前版本默认采用 **EA 手动导出** 作为正式流程。
- 当架构 JSON 缺失或过旧时，扩展会给出明确提示。

## Troubleshooting

### 看不到最新架构内容

- 回到 EA 重新执行导出
- 检查 `design/KG/SystemArchitecture.json` 的时间戳是否变化

### Prompt 打不开或缺失

- 确认 `workprompt/` 目录文件完整
- 使用“提示词集合”按钮重新打开
