# 5. SCRUM 敏捷执行工作流 (SCRUM Workflow)

AI4PB 最核心的工作模式，即是依据下述按部就班的 SCRUM 步序进行 AI 辅助工程研发：

## 步骤 0: 系统设计与模型构建 (System Design & Modeling)
- **工具**：Sparx Enterprise Architect (EA)
- **动作**：系统工程师或架构师使用 **ArchiMate** 建模语言在 EA 中绘制系统架构图（覆盖业务、应用、技术等各个层面）。
- **任务标记**：在具体的架构元器件（如 Application Component）上，通过挂载 `Task` 或 `Issue` 标签将本期迭代需要完成的需求和修复的缺陷明确标出。
- **产出**：通过定制脚本一键导出 `design/KG/SystemArchitecture.json` 和 `tasks/taskandissues_for_LLM.md` 等防腐模型文件，作为后续 AI 开发的单一事实来源。

> **📸 实践图例**
- 系统建模：
![alt text](docs/getting-started/image-1.png)

- 任务分配：
![alt text](docs/getting-started/image-9.png)

- 项目知识图谱导出：
![alt text](docs/getting-started/image-2.png)

![alt text](docs/getting-started/image-10.png)
在项目导出完成 `design/KG/SystemArchitecture.json` 后，请在 VS Code 侧边栏按顺序点击或向 Copilot 输入如下技能流：

## 步骤 1: Task List (任务清单排期)
- **触发**：`打开 Copilot（Task List）` 或者使用 `ai4pb.openCopilotWithTaskListPrompt`。
![alt text](docs/getting-started/image-12.png)
- **目的**：AI 全览整个项目的 `Active` Todo 和优先级，输出一个用于总览的单个 Markdown 综合看板文件 (`implementation/task-list.md`)。
- **行动**：团队会对 AI 生成的该任务清单进行**人工审核与调整**，确认并筛选出本周 (本 Sprint) 需要攻坚的任务子集。
- **机制**：一旦调整并保存该列表，在后续执行“启动迭代”时，AI 会自动读取这份被修改和确认后的清单去分配上下文并开展编码支持。
- 任务清单分析完成：
![alt text](docs/getting-started/image-13.png)
![alt text](docs/getting-started/image-15.png)
![alt text](docs/getting-started/image-17.png)
- 为每个任务生成任务执行帮助文件：
![alt text](docs/getting-started/image-14.png)
- 帮助文件中会包含LLM对该任务的目标、价值、方案描述，会分解子任务到具体的架构元素：
![alt text](docs/getting-started/image-16.png)
**用户可对该任务描述进行修改直到满意为止，该任务说明会作为迭代启动的输入**

## 步骤 2: Init (迭代启动 / Kickoff)
- **触发**：`打开 Copilot（Init Prompt）`。
![alt text](docs/getting-started/image-18.png)
- **目的**：为新发起的重度组件设定初始上下文与目标边界、并列出风险。
- **行动**：在聊天窗口产出初始目标与范围说明（基于 `initial-prompt.md` 模板），为当前会话奠定认知。
- Copilot执行结果：
![alt text](docs/getting-started/image-19.png)
- 同时Copilot会将当前代码节点打上迭代开始标签（该标签用于最后的迭代总结和代码提交信息生成）：
![alt text](docs/getting-started/image-34.png)


## 步骤 3: 人工验收 (Manual Acceptance Gate)
- **触发**：完成 `Init` 后、进入缺陷修改前。
- **目的**：由系统工程师/测试负责人进行阶段性人工验收，确认当前实现满足任务目标与关键验收条件。
- **行动**：人工检查当前代码与任务说明、核对关键功能点并记录验收结论；若发现问题，先补充为 Issue 并更新 EA 导出，再进入缺陷修改流程。
- 一次性验收成功：
![alt text](docs/getting-started/image-20.png)
假如验收不满意，可以在EA中添加进一步的要求：
![alt text](docs/getting-started/image-21.png)
- 生成后的任务进展列表：
![alt text](docs/getting-started/image-22.png)
![alt text](docs/getting-started/image-23.png)

## 步骤 4: Iteration Issues (缺陷修改)
- **触发**：`打开 Copilot（Iteration Issues）`。
![alt text](docs/getting-started/image-24.png)
- **目的**：当测试人员或代码审查中提出发现的 bug 时（在 EA 中记为 Issue 并重新 Export），AI 继续根据新增加的缺口记录实施多轮迭代修复。
- **行动**：阅读 `taskandissues_for_LLM.md`，解决未完成项。
![alt text](docs/getting-started/image-25.png)
- Copilot完成修复后会总结本次工作到`taskandissues_for_LLM.md`中：
![alt text](docs/getting-started/image-28.png)
- 再次验证通过：
![alt text](docs/getting-started/image-26.png)

## 步骤 5: Design Audit (架构-代码审计 / Traceability)
- **触发**：`打开 Copilot（Design Audit）`。
![alt text](docs/getting-started/image-27.png)

- **目的**：“这批代码改坏了架构没有？”本步骤执行严苛的代码-架构一致性校验。
- **行动**：AI 会读取实际产生的代码与 `SystemArchitecture.json` 里的声明差异，将缺失的 `code_paths` 以及职责越位的部分输出到 `design/temp/audit.md` 审计报告临时文件中。
- **反馈**：系统工程师依据审计文案在 EA 中手工修正模型，从而保持图纸依然 100% 反映代码现状。
审计结果：
![alt text](docs/getting-started/image-29.png)
![alt text](docs/getting-started/image-30.png)//TODO 在下方描述审计结果中包含的内容大类
根据审计结果对架构进行调整补充，如：
![alt text](docs/getting-started/image-31.png)
每验收完成一个任务后，在EA中将该任务标记为`Verified`

## 步骤 6: Wrap-up & Iteration Summary (迭代收尾与 Git 提交)
- **触发**：`打开 Copilot（Wrap-up）` 以及紧接着的 `打开 Copilot（Iteration Summary）`。
所有任务都验收完成后，导出新的任务跟踪表：
![alt text](docs/getting-started/image-32.png)
启动迭代收尾检查和总结：
![alt text](docs/getting-started/image-33.png)
- **目的**：生成结项报告（确认哪些需求通过，哪些存在风险遗留给下期），同时 AI 为代码变更生成标准和专业的 Git Commit Message (`debug/iteration-commit-message.md`)。

- 生成总结报告：
![alt text](docs/getting-started/image-35.png)
- 生成本迭代提交信息：
![alt text](docs/getting-started/image-36.png)
结果(基于迭代起始标签总结得到整个迭代的GIT提交消息)：
![alt text](docs/getting-started/image-37.png)

## 步骤 7: Weekly Report (沟通管理 / 周报)
- **触发**：`打开 Copilot（Weekly Report）`。
![alt text](docs/getting-started/image-38.png)
- **目的**：为干系人生成易于理解的管理层周报 (`implementation/reports/xxx.md`)。涵盖执行摘要和表格级别的任务进展。

- 周报生成结果：
![alt text](docs/getting-started/image-40.png)

---
完成 步骤 7，即宣告本次敏捷 Sprint 从架构发起到收尾的闭环圆满跑过一轮。准备下一次迭代。