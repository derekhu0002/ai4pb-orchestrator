# 任务执行简报

- 任务名称：implement a router to adapt different ai coding agent.
- 任务类型：ToDo
- 当前状态：Active
- 负责人：llm
- 优先级：Low
- 起止时间：2026-3-18 至 2026-3-18
- 关联架构对象名称与 ID：Executor_Router (1227)、AI4PB VS插件 (1209)、.aicodingconfig (1231)、AI Coding Agent (1230)、Github Copilot (1187)、Open Code AI Coding Agent (1228)、OpenCode CLI 适配器 (1232)、Prompt Tool Registry (1219)

## 1. LLM执行摘要

- 当前任务要交付一个可配置的执行路由层，使 AI4PB 能按技能名把任务分发给不同 AI coding agent。
- 首要修改对象是 Executor_Router (1227) 对应的扩展实现，KG 已将其代码落点绑定到 src/extension.ts。
- 配置入口以 .aicodingconfig (1231) 为准，本轮只接受最小 schema：AGENT_ROUTER_CONFIG.default_agent 与 AGENT_ROUTER_CONFIG.task_specific_agents。
- Copilot 侧必须继续复用现有 prompt reference 与 Prompt Tool Registry (1219)，不能改造成新的提示词分发体系。
- OpenCode 侧仅实现一次性 CLI 调用适配与错误透传，不得扩展到持久会话、复杂状态同步或额外编排。
- task_specific_agents 的键需要按现有技能标识归一化匹配，避免调用链把技能名硬编码在多个位置。
- 最关键验收条件是：同一任务在配置命中 Copilot 时走现有提示词链路，在命中 OpenCode 时能构造 CLI 调用并透传失败信息。
- 当前主要风险是 OpenCode CLI 契约未在 KG 中固化，命令格式、认证、退出码和 Windows 路径转义都需要以适配层封装并保留人工补充位。

## 2. 已确认事实

- Executor_Router (1227) 是 AI4PB VS插件 (1209) 的组成部分，关系为 AI4PB VS插件 --(ArchiMate_Composition)--> Executor_Router，关系 ID 为 1116。
- Executor_Router (1227) 的描述明确指出其职责是“根据 .aicodingconfig 中存储的配置将任务派发给不同 AI coding agent”。
- Executor_Router (1227) 的当前任务记录在其 project_info.tasks 中，任务名为 implement a router to adapt different ai coding agent.，状态为 Active，负责人为 llm，开始与截止日期均为 2026-3-18，优先级为 Low。
- .aicodingconfig (1231) 在 KG 中已给出最小配置样例，其中包含 AGENT_ROUTER_CONFIG.default_agent 与 AGENT_ROUTER_CONFIG.task_specific_agents。
- Github Copilot (1187) 是 AI Coding Agent (1230) 的特化实现，关系为 Github Copilot --(ArchiMate_Specialization)--> AI Coding Agent，关系 ID 为 1126。
- Open Code AI Coding Agent (1228) 是 AI Coding Agent (1230) 的特化实现，关系为 Open Code AI Coding Agent --(ArchiMate_Specialization)--> AI Coding Agent，关系 ID 为 1125。
- Prompt Tool Registry (1219) 负责注册并提供全部 AI4PB prompt 模板，KG 描述中明确其服务 planning、execution、audit、issue continuation、wrap-up、iteration summary 与 weekly report prompts。
- AI4PB VS插件 (1209) 与 WorkflowViewProvider (1213) 已承担工作流编排与用户侧交互职责，因此本任务的新增能力应挂接在现有扩展运行架构之内，而不是旁路实现。
- Executor_Router (1227)、WorkflowViewProvider (1213)、Prompt Tool Registry (1219) 的已确认代码落点都包含 src/extension.ts，说明本轮实现至少需要从该文件切入。

## 3. 需人工确认 / 未知项

- OpenCode CLI 的真实命令名、参数格式、标准输出格式、返回码约定未知。建议当前实现抽象出命令构造与结果解析接口，并以“原样透传 stderr/stdout + 退出码”作为默认假设。
- OpenCode CLI 的认证方式未知。建议适配层不要自行发明认证流程，默认依赖用户本机既有登录态或环境变量，并在缺失时返回可诊断错误。
- Windows 下 OpenCode CLI 对工作目录、引号转义、路径分隔符的精确要求未知。建议统一在适配层集中处理路径拼装，当前按标准 Windows shell quoting 假设执行。
- task_specific_agents 需要映射的“技能名全集”未在当前任务对象内枚举。建议以仓库现有 ai4pb 技能标识作为允许集合，并在无法命中时回退 default_agent。
- OpenCode 适配器 (1232) 的代码文件路径未在 KG 中声明。建议在实现阶段按代码仓结构新增独立模块；若无法独立抽离，至少在现有扩展文件内保持单独职责边界。
- 配置文件读取优先级（.aicodingconfig 与 .aicodingconfig.json）未在本任务中再次声明。建议沿用扩展现有配置读取策略；若代码仓无现成逻辑，则以 .aicodingconfig 优先、.json 作为兼容项的最小假设实现。

## 4. 约束与边界

- 必须遵守的原则：Progressive Disclosure、Separation of Concerns。
- 当前 KG 未将更细粒度的专属 Principle / Constraint 元素显式绑定到 Executor_Router (1227)；因此除基线原则外，额外强制约束来自任务描述与 .aicodingconfig (1231) 的最小 schema。
- 必须保持不变的模块或边界：Github Copilot (1187) 的现有 prompt reference 获取方式、Prompt Tool Registry (1219) 的提示词服务职责、WorkflowViewProvider (1213) 的既有工作流入口语义。
- 明确禁止的实现方式：不得把 OpenCode 调用逻辑散落到多个命令分支；不得把技能名到代理名的映射硬编码在多个位置；不得在本轮引入持久会话控制、流式回传协议或新的 prompt 资产体系。
- Progressive Disclosure 的强制落地要求：仅交付默认代理选择、按技能覆盖、一次性 OpenCode CLI 执行、错误透传四项能力；更高级能力全部保留为后续增强。
- Separation of Concerns 的强制落地要求：至少将配置解析、路由决策、Copilot 执行、OpenCode CLI 适配拆分为独立职责单元；即使暂时共处同一文件，也要保持独立函数或模块边界。

## 5. 架构元素级任务拆解

| 子任务名称 | 对应架构元素 | 技术目的 | 与其他子任务的依赖关系 |
| --- | --- | --- | --- |
| 定义代理路由配置契约 | .aicodingconfig (1231) | 固化 default_agent 与 task_specific_agents 的最小读取模型，并提供技能名归一化输入 | 后续全部子任务依赖该配置契约 |
| 实现执行路由决策 | Executor_Router (1227) | 根据技能名和默认配置选择目标 AI Coding Agent | 依赖“定义代理路由配置契约” |
| 保持 Copilot 执行链路 | Github Copilot (1187)、Prompt Tool Registry (1219) | 在命中 copilot 时继续走既有 prompt reference 获取与触发方式 | 依赖“实现执行路由决策” |
| 增加 OpenCode 单次调用适配 | Open Code AI Coding Agent (1228)、OpenCode CLI 适配器 (1232) | 为命中 opencode 的任务构造 CLI 调用、处理工作目录与错误透传 | 依赖“实现执行路由决策”与“定义代理路由配置契约” |
| 统一代理抽象与回退行为 | AI Coding Agent (1230)、AI4PB VS插件 (1209) | 让执行结果对上层调用方保持一致，并在未知技能或无配置时回退默认代理 | 依赖前述全部子任务 |

## 6. 推荐实施顺序

1. 动作说明：梳理现有扩展中任务触发到执行的入口，定位 Executor_Router 应插入的决策点。
   目标文件 / 模块 / 目录：src/extension.ts
   对应架构元素 ID：1209、1227、1219
   完成判定标准：能明确区分“上层发起执行请求”和“底层具体 agent 执行”两个层次的调用边界。
2. 动作说明：实现 .aicodingconfig 的 AGENT_ROUTER_CONFIG 解析与技能名归一化逻辑。
   目标文件 / 模块 / 目录：src/extension.ts 或 需结合代码仓进一步定位
   对应架构元素 ID：1231、1227
   完成判定标准：给定 default_agent 与 task_specific_agents 时，能够稳定产出目标代理名。
3. 动作说明：把 Copilot 既有执行链路封装为一个显式的 agent executor，保持 prompt reference 触发方式不变。
   目标文件 / 模块 / 目录：src/extension.ts
   对应架构元素 ID：1187、1219、1227
   完成判定标准：配置命中 copilot 时，执行结果与改造前保持等价。
4. 动作说明：新增 OpenCode CLI 适配层，封装命令构造、工作目录、标准输出/错误透传与退出码处理。
   目标文件 / 模块 / 目录：需结合代码仓进一步定位
   对应架构元素 ID：1228、1232、1227
   完成判定标准：配置命中 opencode 时，可生成单次 CLI 调用并把失败信息完整返回上层。
5. 动作说明：补齐默认回退、未知技能处理和配置缺失处理，保证路由失败不会破坏现有扩展行为。
   目标文件 / 模块 / 目录：src/extension.ts 或 需结合代码仓进一步定位
   对应架构元素 ID：1209、1230、1227
   完成判定标准：未知技能、缺失映射、OpenCode 未配置三类场景都有明确且可诊断的结果。

## 7. 建议修改目标

- 优先检查的文件：src/extension.ts、package.json、工作区根目录下的 .aicodingconfig 或 .aicodingconfig.json。
- 可能需要新增的文件：需结合代码仓进一步定位，优先考虑新增独立的 OpenCode CLI 适配模块与代理路由工具模块。
- 可能需要避免修改的文件：workprompt/*.md、.github/skills/*、与 AUTO Skill Router 业务语义直接相关但不参与 agent 执行分发的提示词资产文件。

## 8. 交付物与验收标准

- [x] 路由层能读取 AGENT_ROUTER_CONFIG.default_agent。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 打开工作区根目录 `.aicodingconfig`，确认存在 `AGENT_ROUTER_CONFIG.default_agent` 字段。
   2. 将 `default_agent` 保持为 `copilot`，执行 `npm run compile`，确认编译通过。
   3. 在 VS Code 中触发任一 `AI4PB: Open Copilot with ... Prompt` 命令，确认仍然进入 Copilot 聊天窗口而不是报配置错误。
- [ ] 路由层能按技能名命中 AGENT_ROUTER_CONFIG.task_specific_agents，并完成统一归一化。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 在 `.aicodingconfig` 中添加示例配置，如 `"task_specific_agents": { "task list": "opencode", "weekly_report": "copilot" }`。
   2. 执行 `npm run compile`，确认编译通过。
   3. 依次触发 `AI4PB: Open Copilot with Task List Prompt` 和 `AI4PB: Open Copilot with Weekly Report Prompt`，观察输出通道中的路由日志，确认前者归一化命中 `task-list`，后者归一化命中 `weekly-report`。
- [ ] 命中 copilot 时仍走现有 prompt reference 执行链路。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 将 `.aicodingconfig` 中 `default_agent` 设为 `copilot`，并清空 `task_specific_agents`。
   2. 触发 `AI4PB: Open Copilot with Init Prompt`。
   3. 确认 Copilot Chat 被打开，输入框中仍包含 `请使用 #ai4pb-init。` 这类原始 prompt reference 文本。
- [ ] 命中 opencode 时能完成单次 CLI 命令构造与执行。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 在 `.aicodingconfig` 中设置 `"task_specific_agents": { "task-list": "opencode" }`，并按需补充 `AGENT_ROUTER_CONFIG.opencode.command` 与 `args`。
   2. 确保本机已安装可执行的 `opencode` 或者配置了真实命令路径。
   3. 触发 `AI4PB: Open Copilot with Task List Prompt`，在 AI4PB 输出通道中检查记录的命令、参数和工作目录，确认命令已被构造并执行一次。
- [ ] OpenCode 执行失败时，stderr/stdout 与退出码能被上层看到，不被吞掉或伪装成成功。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 故意把 `AGENT_ROUTER_CONFIG.opencode.command` 改成不存在的命令，或让 `args` 触发非零退出码。
   2. 触发已映射到 `opencode` 的 prompt 命令。
   3. 确认 VS Code 弹出错误提示，同时 AI4PB 输出通道中能看到失败命令、stderr 或异常信息；如果 CLI 返回非零退出码，应能看到对应 exit code。
- [ ] 配置缺失、技能未命中、OpenCode CLI 不可用三类场景都有明确回退或错误提示。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 删除 `task_specific_agents` 中的目标技能映射，保留 `default_agent: copilot`，触发对应命令，确认回退到 Copilot。
   2. 将某个未知键写入 `task_specific_agents`，执行 `npm run compile` 并触发无对应映射的技能，确认仍按默认代理执行。
   3. 将某个技能映射到 `opencode`，但保持本机无 `opencode` 命令，触发命令后确认收到明确的 CLI 缺失错误提示。
- [ ] 实现没有越界修改 prompt 资产体系，也没有把执行职责重新塞回 WorkflowViewProvider 的展示逻辑。
   ***人工验收测试步骤 (Generated by Copilot):***
   1. 检查本次变更文件，确认核心修改集中在 `src/extension.ts` 与 `.aicodingconfig`，没有修改 `workprompt/*.md` 或 `.github/skills/*`。
   2. 复查 `WorkflowViewProvider`，确认其仍只负责收集输入、触发命令和展示状态，而路由决策已下沉到统一的 prompt 执行函数。
   3. 执行 `npm run compile`，确认没有因路由改造破坏现有视图层命令注册与编译结果。

## 9. 风险、阻塞与缓解措施

- 技术风险：OpenCode CLI 契约未固化，适配层可能与真实工具语义存在偏差。缓解措施：把命令构造、结果解析和错误透传集中在单独适配层，降低后续替换成本。
- 依赖风险：如果现有扩展没有统一的“执行请求对象”，路由层插入点可能分散。缓解措施：先收敛上层调用入口，再挂接 Executor_Router 决策。
- 信息缺口：技能名归一化规则未被显式建模。缓解措施：以现有 ai4pb 技能标识为白名单来源，并在未命中时回退 default_agent。
- 兼容性风险：Windows 路径与 shell quoting 可能导致 OpenCode 调用失败。缓解措施：集中处理路径拼装，并保留原始命令与错误输出用于诊断。