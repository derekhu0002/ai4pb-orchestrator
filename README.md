# AI4PB Orchestrator（VS Code 扩展）

本项目是一套面向系统工程师的 **模型驱动开发（MDD）协作方案**：

- 使用 EA（ArchiMate）维护架构模型与任务
- 通过导出 JSON 作为 AI 实现约束
- 在 VS Code 中由 AI4PB Orchestrator + Copilot 驱动实现、对齐与收敛

该 README 合并了原有总览文档与系统工程师实操指南，作为统一入口。

---

## 1. 核心理念

AI4PB 的目标不是“只生成代码”，而是建立一个可追踪、可验证、可回环的工程闭环：

1. 原始需求 → 架构建模
2. 架构模型 → 结构化 JSON 约束
3. JSON 约束 → AI 实现与测试
4. 审计与差距分析 → 反馈回架构模型

通过这个闭环，系统工程师与 AI 能持续协同，保证设计与实现一致。

---

## 2. 插件能力概览

### 命令清单

- `AI4PB: Refresh Architecture Context`
- `AI4PB: Start Iteration from Model`
- `AI4PB: Run Design-Code Alignment`
- `AI4PB: Generate Wrap-up Report`
- `AI4PB: Open Next Action`
- `AI4PB: Run All (Guided)`

### 主要能力

- 检查关键工件是否齐全（架构 JSON、Prompt、指南、`.aicodingconfig`）
- 一键打开架构与 Prompt，启动迭代
- 自动生成对齐报告与 wrap-up 报告（输出到 `TEMP/`）
- 在侧边栏提供状态卡片与快捷动作

### 侧边栏工作流

在 Activity Bar 打开 `AI4PB`：

- 状态卡片：架构新鲜度、配置存在性、Prompt 完整性、最新报告
- 快捷动作：Open / Refresh / Create / Generate
- 手动刷新 + 每 15 秒自动刷新

推荐执行顺序：

0. Run All (Guided)
1. Refresh Context
2. Open Next Action
3. Start Iteration
4. Run Alignment
5. Generate Wrap-up

---

## 3. 系统工程师标准流程（EA + VS Code + Copilot）

### Phase 1：建模与任务创建（EA）

1. 在 EA 中维护业务/应用/技术架构元素
2. 在相关元素里维护 `project_info.tasks`
3. 为任务设置状态、负责人（AI 任务可设为 `llm`）、优先级、时间等
4. 保存模型并执行导出

### Phase 2：导出架构约束（EA Bootstrap）

在 EA 中运行：

- `script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js`

导出后确认：

- `design/KG/SystemArchitecture.json` 已更新

说明（当前约定）：

- 不需要在 `.aicodingconfig` 中设置 `sharedScriptPath`
- bootstrap 会自动发现共享脚本（优先项目内候选路径，其次本机 `ai4pb-orchestrator` 路径与 VS Code 扩展目录）

### Phase 3：AI 实现（VS Code）

1. 打开工作区，确认架构 JSON 为最新
2. 按阶段使用 Prompt：
   - `workprompt/initial-prompt.md`
   - `workprompt/reverse-engineer-WHOLE.md`
   - `workprompt/Wrap-up Prompt.md`
3. 结合插件命令完成实现、修复、对齐与总结

### Phase 4：验证与审计

1. 测试工程师执行验证，发现问题进入 Issue 回路
2. 使用对齐报告 + reverse-engineering 做设计-代码差距分析
3. 审计结果反馈到 EA，进入下一迭代

---

## 4. 关键资产与路径

| 资产 | 路径 | 用途 |
|---|---|---|
| 架构 JSON | `design/KG/SystemArchitecture.json` | AI 实现约束 |
| EA Bootstrap | `script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2-bootstrap.js` | EA 导出入口 |
| 共享导出脚本 | `script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js` | EA → JSON 逻辑 |
| 插件逻辑 | `src/extension.ts` | 工作流编排与状态视图 |
| Prompt 集 | `workprompt/*.md` | 初始化、审计、总结 |
| 系统工程指南 | `docs/system-engineer-guidance.md` | 实操参考 |

---

## 5. `.aicodingconfig`（最小示例）

```json
{
  "EA_AUTOGEN_CONFIG": {
    "needallmaintenace": false,
    "needbrowserlocation": true,
    "maintenacetype": "forllm"
  }
}
```

可选覆盖项：

- `architectureJsonPath`（若不使用默认 `design/KG/SystemArchitecture.json`）

---

## 6. 本地开发与运行

1. 安装依赖：`npm install`
2. 编译：`npm run compile`
3. 在扩展工程目录按 `F5` 启动 Extension Development Host
4. 在新窗口通过命令面板运行 AI4PB 命令

---

## 7. 打包与发布

### 本地分发（推荐起步）

1. 打包：`npx @vscode/vsce package`
2. 安装：`code --install-extension <your-vsix-file>`

### Marketplace 发布

1. 创建 Publisher 与 PAT
2. 更新 `package.json` 中 `publisher` / `version`
3. 登录：`npx @vscode/vsce login <publisher>`
4. 发布：`npx @vscode/vsce publish`

说明：`.vscodeignore` 已配置排除 `.feap` 文件，不会进入 VSIX。
