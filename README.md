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

## 3. Action → Command 映射

### 3.1 侧边栏动作与命令 ID

| 侧边栏动作（Workflow） | VS Code Command ID | 说明 |
| --- | --- | --- |
| Initialize EA Template / 初始化 EA 模板 | `ai4pb.initializeFromTemplate` | 复制 EA 模板到工作区根目录并命名为当前项目名 `.feap` |
| Export Option / 导出选项 | （内部设置动作，无独立命令 ID） | 维护 `.aicodingconfig` 中的维护模式与导出选项 |
| Prompt Set / 提示词集合 | （内部打开动作，无独立命令 ID） | 打开扩展内置 Prompt 文件 |
| 打开 Copilot（Init Prompt） | `ai4pb.openCopilotWithInitPrompt` | 打开 Copilot Chat 并注入 `#ai4pb-init` |
| 打开 Copilot（Design Audit） | `ai4pb.openCopilotWithDesignAuditPrompt` | 打开 Copilot Chat 并注入 `#ai4pb-audit` |
| 打开 Copilot（Wrap-up） | `ai4pb.openCopilotWithWrapUpPrompt` | 打开 Copilot Chat 并注入 `#ai4pb-wrapup` |

### 3.2 命令面板可直接执行的命令

- `ai4pb.initializeFromTemplate`
- `ai4pb.refreshArchitectureContext`
- `ai4pb.startIterationFromModel`
- `ai4pb.runDesignCodeAlignment`
- `ai4pb.generateWrapUpReport`
- `ai4pb.openNextAction`
- `ai4pb.runGuidedWorkflow`
- `ai4pb.openCopilotWithInitPrompt`
- `ai4pb.openCopilotWithDesignAuditPrompt`
- `ai4pb.openCopilotWithWrapUpPrompt`

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
3. 为任务设置状态、负责人（AI 任务设为 `llm`）、优先级与时间信息
4. 本轮希望 Copilot 执行的任务，状态应明确设置为 `Active`

### Phase 2：在 EA 中执行导出

当前推荐方式：

- 在 EA 图中右键，使用弹出菜单选择对应导出菜单执行
- 导出完成后确认固定路径 `design/KG/SystemArchitecture.json` 已更新

> 不要求最终用户直接运行脚本路径；以 EA 菜单操作为准。

### Phase 3：在 VS Code 中执行 AI 迭代

先使用侧边栏 3 个主按钮（与 UI 对齐）：

1. `Initialize EA Template`
2. `Export Option`
3. `Prompt Set`

然后在 Copilot Chat 中按顺序执行：

1. 使用 `#ai4pb-init` 启动本轮任务识别与实现
2. 与 AI 进行多轮交互，逐步完成代码与文档落地
3. 使用 `#ai4pb-wrapup` 输出本轮总结与任务状态同步

### Phase 4：验证与回写

1. 执行测试与验证，识别偏差
2. 使用对齐报告进行设计-代码差距分析
3. 将审计结果回写到 EA，进入下一轮迭代

长时间未同步时建议流程：

1. 先在 EA 重新导出最新 `design/KG/SystemArchitecture.json`
2. 使用 `#ai4pb-audit` 触发设计-实现对齐审计
3. 按审计报告更新 EA 模型，再启动下一轮 `#ai4pb-init`

---

## 4.1 自动化增强与掌控权（OpenClaw 类方案）

可以引入 OpenClaw 类自动化能力来减少手工操作，但建议采用“人定目标、AI 执行、关口确认”的受控模式：

- 可自动化：任务提取、提示词装配、草稿生成、差异比对、会话总结
- 保留人工决策：任务激活（Active）、范围确认、关键改动审批、模型回写
- 强制关口：每轮都要经过 `#ai4pb-wrapup` 与 `#ai4pb-audit` 两个检查点

推荐控制策略：

1. **计划关口**：只允许 `Active + assigned_to=llm` 的任务进入自动执行
2. **实现关口**：AI 仅在架构 JSON 定义范围内改动，超范围变更需人工确认
3. **收敛关口**：必须先有审计报告，再回写 EA，确保“先对齐再沉淀”

按以上策略，通常可以显著降低重复操作，同时不丢失系统工程师对架构边界与交付节奏的主导权。

---

## 5. 关键路径与资产

| 资产       | 路径                                  | 用途               |
| -------- | ----------------------------------- | ---------------- |
| 架构 JSON  | `design/KG/SystemArchitecture.json` | AI 实现约束          |
| 扩展主逻辑    | `src/extension.ts`                  | 工作流编排与侧边栏视图      |
| Prompt 集 | `workprompt/*.md`                   | 迭代启动、审计、总结       |
| 报告输出目录   | `TEMP/`                             | 对齐报告与 Wrap-up 输出 |

### 5.1 运行时生成物（精确文件名与位置）

| 触发动作 / 命令 | 生成物文件名 | 位置 |
| --- | --- | --- |
| `ai4pb.initializeFromTemplate` | `<workspaceName>.feap` | 工作区根目录（例如：`./ai4pb-orchestrator.feap`） |
| `ai4pb.startIterationFromModel` | `iteration-state.json` | `TEMP/iteration-state.json` |
| `ai4pb.runDesignCodeAlignment` | `design-code-alignment-<ISO_TIMESTAMP>.md` | `TEMP/design-code-alignment-*.md` |
| `ai4pb.generateWrapUpReport` | `wrap-up-<ISO_TIMESTAMP>.md` | `TEMP/wrap-up-*.md` |
| 首次/更新导出选项（侧边栏 Export Option） | `.aicodingconfig` | 工作区根目录（`./.aicodingconfig`） |

说明：`<ISO_TIMESTAMP>` 由运行时 `new Date().toISOString()` 生成并做文件名安全替换（`:`/`.` → `-`）。

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


















