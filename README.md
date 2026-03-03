# AI4PB Orchestrator

AI4PB Orchestrator 是一个面向系统工程师的 VS Code 扩展，用于把 EA（ArchiMate）模型与 AI 实现流程连接起来，形成“建模 → 导出约束 → 实现 → 对齐审计 → 迭代收敛”的工程闭环。

---

## 1. 扩展定位

适用场景：

- 在 EA 中维护架构元素与任务
- 将架构导出为 JSON 作为 AI 开发约束
- 在 VS Code 中执行实现、审计、总结

核心价值：

- 以模型驱动代码实现，减少设计与实现偏差
- 通过工作流按钮降低操作门槛
- 沉淀可追溯的对齐与总结报告

---

## 2. 用户界面（与当前侧边栏一致）

当前侧边栏主按钮为以下 3 项：

1. `Initialize EA Template`
2. `Export Option`
3. `Prompt Set`

说明：README 中所有流程顺序与操作说明均以这 3 个 UI 按钮为主入口。

---

## 3. 命令与按钮映射

### 3.1 侧边栏按钮（推荐）

- `Initialize EA Template`：初始化 EA 模板到工作区
- `Export Option`：设置导出相关选项（mode / browserPath / allMaintenance）
- `Prompt Set`：打开提示词集合（Init Session / Wrap Up / Design Audit）

### 3.2 Copilot Agent Skill（免手工拷贝 Prompt）

扩展已提供 3 个 Language Model Tools（Agent Skill），可直接把主 Prompt 提供给 GitHub Copilot：

- `#ai4pb-init`：Init Session Prompt（`workprompt/initial-prompt.md`）
- `#ai4pb-wrapup`：Wrap-up Prompt（`workprompt/Wrap-up Prompt.md`）
- `#ai4pb-audit`：Design Audit Prompt（`workprompt/reverse-engineer-WHOLE.md`）

使用方式（Copilot Chat Agent 模式）：

1. 在 Chat 输入中直接提问并附带 `#ai4pb-init` / `#ai4pb-wrapup` / `#ai4pb-audit`
2. 或让 Agent 根据任务自动调用上述工具

一键入口：

- 命令面板执行 `AI4PB: Open Copilot with Init Prompt`，自动打开 Copilot Chat 并预填 `#ai4pb-init`

这样无需用户手工打开文件并复制 Prompt 文本。

---

## 4. 标准工作流程（系统工程师）

### Phase 1：EA 建模与任务维护

1. 在 EA 中维护业务/应用/技术架构元素
2. 在相关元素中维护 `project_info.tasks`
3. 为任务设置状态、负责人（AI 任务可设为 `llm`）、优先级与时间信息

### Phase 2：在 EA 中执行导出

当前推荐方式：

- 在 EA 图中右键，使用弹出菜单选择对应导出菜单执行
- 导出完成后确认 `design/KG/SystemArchitecture.json` 已更新

> 不要求最终用户直接运行脚本路径；以 EA 菜单操作为准。

### Phase 3：在 VS Code 中执行 AI 迭代

先使用侧边栏 3 个主按钮（与 UI 对齐）：

1. `Initialize EA Template`
2. `Export Option`
3. `Prompt Set`

### Phase 4：验证与回写

1. 执行测试与验证，识别偏差
2. 使用对齐报告进行设计-代码差距分析
3. 将审计结果回写到 EA，进入下一轮迭代

---

## 5. 关键路径与资产

| 资产       | 路径                                  | 用途               |
| -------- | ----------------------------------- | ---------------- |
| 架构 JSON  | `design/KG/SystemArchitecture.json` | AI 实现约束          |
| 扩展主逻辑    | `src/extension.ts`                  | 工作流编排与侧边栏视图      |
| Prompt 集 | `workprompt/*.md`                   | 迭代启动、审计、总结       |
| 报告输出目录   | `TEMP/`                             | 对齐报告与 Wrap-up 输出 |

---

## 6. 安装与运行

### 本地开发

1. 安装依赖：`npm install`
2. 编译扩展：`npm run compile`
3. 按 `F5` 启动 Extension Development Host
4. 在新窗口打开 AI4PB 侧边栏并执行按钮/命令

### 安装 VSIX（本地分发）

1. 打包：`npx @vscode/vsce package`
2. 安装：`code --install-extension <your-vsix-file>`

---

## 7. 发布到 Marketplace

1. 创建 Publisher
2. 更新 `package.json` 的 `publisher`、`version`
3. 登录：`npx @vscode/vsce login <publisher>`
4. 发布：`npx @vscode/vsce publish`

说明：`.vscodeignore` 已排除 `.feap` 文件，避免进入 VSIX。

---

## 8. 常见问题（FAQ）

### Q1：为什么看不到最新架构内容？

- 先在 EA 中通过右键菜单重新执行导出
- 确认 `design/KG/SystemArchitecture.json` 时间戳已更新

### Q2：Prompt 缺失怎么办？

- 检查 `workprompt/` 下核心文件是否存在
- 使用侧边栏 `Prompt Set` 直接打开并补齐


















