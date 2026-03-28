# 任务执行简报

- 任务名称：完成子图(Conceptual Architecture_running on opencode framework)所示各AGENT和SKILL、工具在OPENCODE上的部署
- 任务类型：ToDo
- 当前状态：Active
- 负责人：未分配
- 优先级：Low
- 起止时间：2026-3-28 至 2026-3-28
- 关联架构对象名称与 ID：Business(1155)、ProjectOrchestrator(1391)、SystemArchitect(1286)、Implementation(1182)、QualityAssurance(1287)、Audit & Compliance Agent(1292)、Release Agent(1293)

## 1. LLM执行摘要

- 当前任务目标是补齐 OPENCODE 运行子图所需的 AGENT、SKILL、工具与配置交付物，交付重点在 `.opencode` 相关资产。
- 严格限定范围为 OPENCODE 相关新增配置与资产，不得把任务扩展成对现有非 OPENCODE 架构元素的大范围重构。
- 触发入口必须支持两类输入：OPENCODE TUI 中的一句话需求，或指定目录下的 SDD 文档。
- 最关键验收条件是：OPENCODE 相关配置、技能镜像、工具包和扩展侧适配关系能够与视图 189 的角色编排闭环对齐。
- ProjectOrchestrator(1391) 是业务流程中心，相关交付需要保证它到 Implementation(1182)、QualityAssurance(1287)、Audit & Compliance Agent(1292)、Release Agent(1293) 的协作路径不被破坏。
- Open Code AI Coding Agent(1228) 与 OpenCode CLI 适配器(1232) 是 OPENCODE 落地的关键应用层对象，相关实现应保持由扩展侧进行调度与适配。
- `.aicodingconfig`(1231) 中的 AGENT_ROUTER_CONFIG 是任务路由控制点，若实现需要切换 task-list 或其他阶段到 opencode，必须在该配置边界内完成。
- 主要风险是 KG 描述的 `.opencode/plugins/*`、`.opencode/tools/*` 路径是否已在仓库完整存在；若不存在，需要按 KG 目标结构补齐，但不得虚构未在 KG 中体现的业务职责。
- 另一个风险是任务未分配负责人，且 task markdown 中没有 ResolverNotes，可执行细节需优先以 KG 为准，缺失部分标记为需人工确认。

## 2. 已确认事实

- Business(1155) 挂载了当前唯一 Active 任务，任务描述明确要求“交付 `.opencode` 下的所有配置文件和工具等”，且“不影响任何已有架构元素”。
- 视图 `Conceptual Architecture_running on opencode framework`(189) 包含 ProductManager(1394)、ProjectOrchestrator(1391)、SystemArchitect(1286)、Implementation(1182)、QualityAssurance(1287)、Audit & Compliance Agent(1292)、Release Agent(1293)。
- 视图 189 已确认存在从 ProjectOrchestrator(1391) 到 SystemArchitect(1286) 的架构设计委派、到 Implementation(1182) 的实现委派、到 QualityAssurance(1287) 的测试请求、到 Audit & Compliance Agent(1292) 的审计请求，以及到 Release Agent(1293) 的发布日志生成请求。
- Implementation(1182) 被定义为负责编码实现、缺陷修复与完成后回报的执行角色，并明确依赖任务上下文与架构约束工作。
- Open Code AI Coding Agent(1228) 被定义为 AI4PB 支持的可选执行器，其 code paths 指向 `src/extension.ts`、`.opencode/package.json`、`.opencode/index.ts`、`.opencode/opencode.json`、`.opencode/plugins/index.ts`、`.opencode/tools/index.ts`。
- OpenCode CLI 适配器(1232) 被定义为扩展侧集成组件，负责构造 OpenCode 调用、处理 CLI/Server 传输、归一化 Windows/WSL 细节，并将运行反馈回传工作流界面。
- `.aicodingconfig`(1231) 在 KG 中被定义为承载 `AGENT_ROUTER_CONFIG` 的配置对象，且其中包含 `opencode.transport=server`、`executionHost=wsl`、`server.baseUrl=http://127.0.0.1:4096` 等配置线索。
- Business --(uses)--> OpencodeAgentApplication(1237) 的关系描述确认业务层可以通过 opencode cli 或 opencode web 使用 OpencodeAgentApplication。
- OpencodeAgentApplication(1237) --(uses)--> Opencode(1248) 的关系确认应用包装层负责封装底层 Opencode 引擎。
- KG 中唯一显式架构原则元素为“架构设计必须考虑遵守SOLID原则”(1282)。
- 仓库当前不具备 KG 描述的 `.opencode/package.json`、`.opencode/index.ts`、`.opencode/opencode.json`、`.opencode/plugins/*`、`.opencode/tools/*`。建议先按 KG code paths 逐项核对；若缺失，则按 KG 结构补齐最小可运行骨架。
- 当前工作区中 `.aicodingconfig` 的 `task_specific_agents.task-list` 当前为 `copilot`，而 KG 描述为 `opencode` ，保持copilot。
-  OPENCODE TUI 的一句话需求入口就是用户在终端命令行中输入；
- “指定目录下的 SDD 文档” 的目录约定、文件命名规则、解析入口建议暂按 `workspaceRoot` 下可配置目录处理。

## 3. 需人工确认 / 未知项


## 4. 约束与边界

- 必须遵守的 Principle / Constraint：
  - Progressive Disclosure：交付结构应从顶层入口配置到插件、工具、技能逐层展开，避免把路由、技能定义、工具实现混在单一文件中。
  - Separation of Concerns：扩展侧调度、OPENCODE 资产包、技能镜像、工具实现、路由配置必须分层处理，避免把传输适配逻辑和任务语义配置耦合。
  - SOLID 原则(1282)：尤其需要保持单一职责、开闭原则与依赖倒置，避免把所有 OPENCODE 集成功能硬编码进单个模块。
- 必须保持不变的模块或边界：
  - 非 OPENCODE 的现有架构元素与既有业务流程不得被本任务顺带改造。
  - 视图 189 中的角色协作链路只允许做 OPENCODE 接入相关补齐，不应改变角色职责定义。
  - Task / Issue 源数据文件仅作为输入，不应在本任务里被改写为新的架构意图。
- 明确禁止的实现方式或越界修改：
  - 禁止为满足交付而重写现有 GitHub Copilot 主流程。
  - 禁止把与 OPENCODE 无关的通用工作流、审计逻辑、发布逻辑作为本任务一并重构。
  - 禁止虚构 KG 中不存在的业务职责或新增未经确认的代理角色。
- Progressive Disclosure 的强制落地要求：
  - 先定义根级配置入口，再连接执行器适配，再补齐插件、工具、技能镜像，不应反向从具体工具实现倒推顶层配置。
  - 输出目录和文件命名应让下游 LLM 可按层级快速定位。
- Separation of Concerns 的强制落地要求：
  - `src/extension.ts` 仅承载扩展侧路由/调度/适配协调，不应堆积技能文本或工具实现细节。
  - `.opencode/skills` 保持技能镜像职责，`.opencode/tools` 保持工具职责，`.opencode/plugins` 保持插件职责，配置文件保持声明式配置职责。

## 5. 架构元素级任务拆解

| 子任务名称             | 对应架构元素                                                                                                                   | 技术目的                                                    | 与其他子任务的依赖关系          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | -------------------- |
| 补齐 OPENCODE 根配置骨架 | Open Code AI Coding Agent(1228)、.aicodingconfig(1231)                                                                    | 明确 OpenCode 的执行入口、路由策略、服务端配置和资产清单入口                     | 先于插件、工具和技能镜像任务       |
| 实现扩展侧传输适配         | OpenCode CLI 适配器(1232)、ProjectOrchestrator(1391)                                                                         | 让扩展可以把工作流阶段请求稳定路由到 OpenCode CLI/Server                  | 依赖根配置骨架；为插件/工具接入提供入口 |
| 补齐 OPENCODE 技能镜像  | Implementation(1182)、SystemArchitect(1286)、QualityAssurance(1287)、Audit & Compliance Agent(1292)、Release Agent(1293)     | 将视图 189 涉及的多角色技能以 OpenCode 可消费的方式组织在 `.opencode/skills` | 依赖根配置骨架；与工具包可并行      |
| 补齐 OPENCODE 工具包   | Open Code AI Coding Agent(1228)                                                                                          | 提供运行测试、覆盖率、安全审计、格式化、Lint、Git 摘要等工具出口                    | 依赖根配置骨架；与技能镜像可并行     |
| 校验多角色编排闭环         | ProjectOrchestrator(1391)、Implementation(1182)、QualityAssurance(1287)、Audit & Compliance Agent(1292)、Release Agent(1293) | 确保视图 189 的委派、回报、修复、审计、发布链路与 OPENCODE 接入一致               | 依赖前述所有子任务完成          |

## 6. 推荐实施顺序

1. 动作说明：核对并补齐 OPENCODE 入口配置与路由声明。
   目标文件 / 模块 / 目录：`.aicodingconfig`、`.opencode/`、`需结合代码仓进一步定位`
   对应架构元素 ID：1228、1231、1232
   完成判定标准：存在可解析的 OpenCode 路由配置，且能映射到 OPENCODE 资产包目录。

2. 动作说明：实现或校正扩展侧 OpenCode 传输适配逻辑。
   目标文件 / 模块 / 目录：`src/extension.ts`
   对应架构元素 ID：1232、1391
   完成判定标准：扩展能够按配置选择 CLI 或 Server 方式并把执行反馈回传工作流界面。

3. 动作说明：补齐 `.opencode` 下的插件、工具与入口索引文件。
   目标文件 / 模块 / 目录：`.opencode/package.json`、`.opencode/index.ts`、`.opencode/opencode.json`、`.opencode/plugins/`、`.opencode/tools/`
   对应架构元素 ID：1228
   完成判定标准：KG 指向的 OPENCODE 代码路径全部存在，且目录职责清晰。

4. 动作说明：补齐或刷新 OpenCode 可用的技能镜像，覆盖视图 189 的关键代理角色。
   目标文件 / 模块 / 目录：`.opencode/skills/`
   对应架构元素 ID：1182、1286、1287、1292、1293、1391
   完成判定标准：相关角色技能在 `.opencode/skills` 中可被扫描和使用，名称与职责保持一致。

5. 动作说明：校验任务触发入口覆盖“一句话需求”和“S D D 文档目录”两类输入。
   目标文件 / 模块 / 目录：`src/extension.ts`、`.aicodingconfig`、`.opencode/opencode.json`、需结合代码仓进一步定位
   对应架构元素 ID：1231、1232、1391、1182
   完成判定标准：两类输入都能进入同一条 OPENCODE 执行闭环，且不破坏现有角色消息流。

## 7. 建议修改目标

- 优先检查的文件：`.aicodingconfig`、`src/extension.ts`、`.opencode/opencode.json`
- 可能需要新增的文件：`.opencode/package.json`、`.opencode/index.ts`、`.opencode/opencode.json`、`.opencode/tools/index.ts`、`.opencode/tools/run-tests.ts`、`.opencode/tools/check-coverage.ts`、`.opencode/tools/security-audit.ts`、`.opencode/tools/format-code.ts`、`.opencode/tools/lint-check.ts`、`.opencode/tools/git-summary.ts`
- 可能需要避免修改的文件：与 GitHub Copilot 主流程直接相关但非 OPENCODE 接入必需的现有工作流文件、任务源文件 `design/tasks/taskandissues_for_LLM.md`、架构源文件 `design/KG/SystemArchitecture.json`

## 8. 交付物与验收标准

- [ ] `.opencode` 目录下具备与 KG code paths 对齐的配置文件、入口文件、AGENT和工具目录与技能镜像目录。
- [ ] OpenCode 路由配置能够表达默认代理、按阶段路由、CLI/Server 传输方式和 WSL 执行主机信息。
- [ ] 视图 189 相关角色的执行闭环没有被破坏：设计委派、实现、测试、审计、发布链路仍可被 OPENCODE 侧承接。
- [ ] 任务范围仍然限定在 OPENCODE 相关新增配置与资产，不产生无关架构元素修改。
- [ ] 对“一句话需求”与“指定目录 SDD 文档”两类入口至少形成明确的配置或适配方案。
- [ ] 新增或调整的文件职责分层清晰，满足 Progressive Disclosure 与 Separation of Concerns。
- [ ] 若 KG 与仓库现状存在差异，交付中已明确记录差异与处理假设，而不是静默忽略。

## 9. 风险、阻塞与缓解措施

| 风险 / 阻塞 | 影响 | 缓解措施 |
| --- | --- | --- |
| KG 描述的 `.opencode/plugins/*`、`.opencode/tools/*` 与仓库实际结构不一致 | 可能导致任务边界不清或交付范围失真 | 以 KG 为目标结构，以当前仓库为现实基线，差异处显式记录并逐项补齐 |
| `.aicodingconfig` 当前路由与 KG 不一致 | 可能导致任务清单或执行支持阶段未真正走 opencode | 在实现前确认本轮是否需要把相关阶段改路由到 opencode |
| TUI 输入和 SDD 文档入口协议未明确 | 可能导致配置完成但无法实际触发流程 | 优先在扩展入口和 OPENCODE 配置处补充声明式入口约定，无法确认处标记需人工确认 |
| 任务负责人为空 | 可能导致实现和验收责任边界不清 | 由人工补充分派；未补充前按 ProjectOrchestrator 驱动 Implementation 的默认路径推进 |
| 过度把 OPENCODE 接入逻辑塞入单一模块 | 破坏 SoC，后续难维护 | 严格按配置、适配器、插件、工具、技能镜像分层实现 |
