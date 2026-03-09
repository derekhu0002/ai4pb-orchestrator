# 5. SCRUM 敏捷执行工作流 (SCRUM Workflow)

AI4PB 最核心的工作模式，即是依据下述按部就班的 SCRUM 步序进行 AI 辅助工程研发：
在项目导出完成 `design/KG/SystemArchitecture.json` 后，请在 VS Code 侧边栏按顺序点击或向 Copilot 输入如下技能流：

### Step 1: Task List (任务清单排期)
- **触发**：`打开 Copilot（Task List）` 或者使用 `ai4pb.openCopilotWithTaskListPrompt`。
- **目的**：AI 全览整个项目的 `Active` Todo 和优先级，输出一个用于总览的单个 Markdown 综合看板文件 (`implementation/task-list.md`)。
- **行动**：团队确认本周 (本 Sprint) 需要攻坚的任务子集。

### Step 2: Init (迭代启动 / Kickoff)
- **触发**：`打开 Copilot（Init Prompt）`。
- **目的**：为新发起的重度组件设定初始上下文与目标边界、并列出风险。
- **行动**：在聊天窗口产出初始目标与范围说明（基于 `initial-prompt.md` 模板），为当前会话奠定认知。

### Step 3: Task Support (具体任务执行与开发)
- **触发**：`打开 Copilot（Task Support）`。
- **目的**：针对 Step 1 确定的特定 `Active Task`，为其分别生成专属的 `执行支撑说明` (`implementation/taskhelpinfos/xxx.md`)，并由 Copilot 开始真实编写代码和配置。
- **行动**：AI 阅读并写出目标代码。

### Step 4: Iteration Issues (缺陷修改)
- **触发**：`打开 Copilot（Iteration Issues）`。
- **目的**：当测试人员或代码审查中提出发现的 bug 时（在 EA 中记为 Issue 并重新 Export），AI 继续根据新增加的缺口记录实施多轮迭代修复。
- **行动**：阅读 `taskandissues_for_LLM.json`，解决未完成项。

### Step 5: Design Audit (架构-代码审计 / Traceability)
- **触发**：`打开 Copilot（Design Audit）`。
- **目的**：“这批代码改坏了架构没有？”本步骤执行严苛的代码-架构一致性校验。
- **行动**：AI 会读取实际产生的代码与 `SystemArchitecture.json` 里的声明差异，将缺失的 `code_paths` 以及职责越位的部分输出到 `design/temp/audit.md` 审计报告临时文件中。
- **反馈**：系统工程师依据审计文案在 EA 中手工修正模型，从而保持图纸依然 100% 反映代码现状。

### Step 6: Wrap-up & Iteration Summary (迭代收尾与 Git 提交)
- **触发**：`打开 Copilot（Wrap-up）` 以及紧接着的 `打开 Copilot（Iteration Summary）`。
- **目的**：生成结项报告（确认哪些需求通过，哪些存在风险遗留给下期），同时 AI 为代码变更生成标准和专业的 Git Commit Message (`debug/iteration-commit-message.md`)。

### Step 7: Weekly Report (沟通管理 / 周报)
- **触发**：`打开 Copilot（Weekly Report）`。
- **目的**：为干系人生成易于理解的管理层周报 (`implementation/reports/xxx.md`)。涵盖执行摘要和表格级别的任务进展。

---
完成 Step 7，即宣告本周敏捷 Sprint 从架构发起到收尾的闭环圆满跑过一轮。然后将代码 Push 并同步 EA 图形库准备下一条。