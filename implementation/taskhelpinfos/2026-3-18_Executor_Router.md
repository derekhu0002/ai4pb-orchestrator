# 任务执行简报

- 任务名称：Executor_Router
- 任务类型：ToDo
- 当前状态：Verified
- 负责人：llm
- 优先级：Low
- 起止时间：2026-3-18 至 2026-3-18
- 关联架构对象名称与 ID：Executor_Router (1227)、AI4PB VS插件 (1209)、AI Coding Agent (1230)、Github Copilot (1187)、Open Code AI Coding Agent (1228)、OpenCode CLI 适配器 (1232)、.aicodingconfig (1231)、Prompt Tool Registry (1219)、WorkflowViewProvider (1213)

## 1. LLM执行摘要

- 本任务以 markdown 任务行 `Executor_Router` 为主任务名，目标是为扩展增加多 AI coding agent 路由能力。
- `ResolverNotes` 显示主体改造已完成，当前剩余重点是补齐真实 `OpenCode CLI` 成功执行验收。
- 首要修改对象应限定在 `src/extension.ts`、`.aicodingconfig`、`.aicodingconfig.json` 等直接承载路由与配置的入口。
- `Github Copilot` 分支必须继续沿用既有 prompt reference 与 `Prompt Tool Registry` 链路，不得借此任务重构提示词资产体系。
- `OpenCode` 分支本轮仅允许一次性 CLI 调用、工作目录处理和错误透传，不扩展为会话态或多轮编排。
- 任务名、状态等执行字段优先采用 `design/tasks/taskandissues_for_LLM.md`；负责人、优先级、起止时间等缺失字段回退到 KG 任务数据。
- 最关键验收条件是在已安装真实 `OpenCode CLI` 的环境中完成一次成功执行；失败时也必须保留 stdout、stderr 与退出码。
- 当前主要风险是真实 CLI 契约和本地环境仍未完全确认，特别是命令名、参数、认证方式与 Windows 路径兼容性。

## 2. 已确认事实

- `Executor_Router` (1227) 的 KG 描述明确要求它依据 `.aicodingconfig` (1231) 中的配置，将任务分发给不同 `AI Coding Agent` (1230)。
- `Executor_Router` (1227) 在 KG 的 `project_info.tasks` 中存在对应任务，字段包含：类型 `ToDo`、开始日期 `2026-3-18`、截止日期 `2026-3-18`、优先级 `Low`、负责人 `llm`。
- `AI4PB VS插件` (1209) 通过关系 `1116` 组合 `Executor_Router` (1227)，说明该路由器是扩展内部组成部分。
- `.aicodingconfig` (1231) 在 KG 中已定义最小 schema，包含 `AGENT_ROUTER_CONFIG.default_agent` 与 `AGENT_ROUTER_CONFIG.task_specific_agents`。
- `AI4PB VS插件` (1209) 通过关系 `1100` 触发 `AI Coding Agent` (1230)，表明路由结果最终进入统一 AI 执行主链。
- `Github Copilot` (1187) 通过关系 `1126` 特化自 `AI Coding Agent` (1230)，`Open Code AI Coding Agent` (1228) 通过关系 `1125` 特化自 `AI Coding Agent` (1230)。
- `Github Copilot` (1187) 通过关系 `1104` 访问 `Prompt Tool Registry` (1219)，说明 Copilot 路径依赖既有 prompt tool 注册服务。
- 视图 `166`（`Open Code AI Coding Agent`）包含元素 `OpenCode CLI 适配器` (1232)；视图 `165`（`AI Coding Agent`）包含元素 `AI Coding Agent` (1230)、`Github Copilot` (1187)、`Open Code AI Coding Agent` (1228) 以及关系 `1125`、`1126`，可确认 OpenCode 与 Copilot 是并列代理特化实现。
- 视图 `163`（`Runtime Interaction Flow`）包含 `AI4PB VS插件` (1209)、`WorkflowViewProvider` (1213)、`Prompt Tool Registry` (1219)、`Github Copilot` (1187)、`AUTO Skill Router` (1225) 以及关系 `1098`、`1100`、`1104`、`1112`、`1113`、`1114`，说明运行时交互、路由与提示词服务边界已在 KG 中分层建模。
- `Principle` (1207) 与 `Constrain` (1206) 在 `System Architecture Description` 视图 `155` 中分别通过关系 `1085`、`1084` 特化 `System Requirement` (1162)，可确认原则与约束属于系统需求层面的正式约束机制。

## 3. 需人工确认 / 未知项

- `design/tasks/taskandissues_for_LLM.md` 中任务状态为 `Verified`，而 KG 任务状态为 `Active`。建议按提示词规则优先采用 markdown 状态，并在任务清单中显式说明该冲突。
- `OpenCode CLI` 的真实命令名、参数格式、标准输出格式和非零退出码语义未知。建议继续采用“命令构造 + 原样透传输出/退出码”的最小契约。
- `OpenCode CLI` 的认证方式未知。建议默认依赖本机已有登录态或环境变量，不在扩展内新增认证界面；缺少认证时直接透出诊断错误。
- Windows 下命令引号、工作目录和路径分隔符兼容性未知。建议继续把路径拼装与进程调用集中在 CLI 适配边界处理。
- KG 未给出 `OpenCode CLI 适配器` (1232) 的独立代码文件定位。建议继续以 `src/extension.ts` 为主入口，如需拆分模块再补充架构说明。
- `ResolverNotes` 表明当前机器未安装 `opencode` 命令，因此无法仅凭仓库内容完成真实成功路径验收。建议人工先安装 CLI 或提供明确可执行路径。
- markdown 任务行名称为 `Executor_Router`，KG 任务名为 `implement a router to adapt different ai coding agent.`。建议输出文件名和任务清单使用 markdown 名称，执行目标用 KG 与 markdown 问题描述补充。

## 4. 约束与边界

- 必须遵守的原则：`Progressive Disclosure`、`Separation of Concerns`。
- KG 可确认 `Principle` (1207) 与 `Constrain` (1206) 是系统需求约束机制的一部分，但未发现与 `Executor_Router` 直接绑定的更细化原则实例；因此除基线原则外，其余约束以任务说明和已确认架构关系为准。
- 必须保持不变的模块与边界：`Github Copilot` (1187) 的 prompt reference 链路、`Prompt Tool Registry` (1219) 的提示词注册职责、`WorkflowViewProvider` (1213) 的界面与交互职责。
- 明确禁止的实现方式：不得把 `OpenCode` 调用逻辑散落到多个命令入口；不得在本轮引入持久会话、流式协议、额外 prompt 资产或新的技能匹配体系。
- `Progressive Disclosure` 的强制落地要求：本轮只覆盖默认代理读取、按技能路由、一次性 `OpenCode CLI` 调用、错误透传与真实环境验收，不扩展后续增强项。
- `Separation of Concerns` 的强制落地要求：配置解析、路由决策、Copilot 执行与 OpenCode CLI 适配必须保持职责分离；即使暂存于同一代码文件，也要保持可替换边界。

## 5. 架构元素级任务拆解

| 子任务名称 | 对应架构元素 | 技术目的 | 与其他子任务的依赖关系 |
| --- | --- | --- | --- |
| 核对任务字段与状态冲突 | `Executor_Router` (1227)、`Task Help Infomation` (1229) | 确认 markdown 与 KG 在名称、状态、执行说明上的差异并形成统一口径 | 后续全部步骤依赖此项 |
| 核对路由配置与技能映射 | `.aicodingconfig` (1231)、`Executor_Router` (1227) | 确认默认代理、技能归一化与回退策略符合最小 schema 与任务说明 | 依赖“核对任务字段与状态冲突” |
| 复核 Copilot 保留链路 | `Github Copilot` (1187)、`Prompt Tool Registry` (1219)、`AI Coding Agent` (1230) | 确保命中 `copilot` 时仍走既有 prompt reference 执行链 | 依赖“核对路由配置与技能映射” |
| 验证 OpenCode CLI 适配边界 | `Open Code AI Coding Agent` (1228)、`OpenCode CLI 适配器` (1232) | 在真实 CLI 存在时验证一次性执行、错误透传与工作目录处理 | 依赖“核对路由配置与技能映射” |
| 复核扩展交互边界 | `AI4PB VS插件` (1209)、`WorkflowViewProvider` (1213) | 确保代理切换不会污染界面职责或命令分发入口 | 依赖“复核 Copilot 保留链路” |
| 收口诊断与状态更新 | `Executor_Router` (1227)、`AI4PB VS插件` (1209) | 若验证失败则在路由或适配边界内最小修补；若验证通过则整理证据并更新任务结论 | 依赖前述全部子任务 |

## 6. 推荐实施顺序

1. 动作说明：核对 `design/tasks/taskandissues_for_LLM.md` 与 KG 中该任务字段，确认名称以 `Executor_Router` 输出、状态优先采用 markdown 的 `Verified`，并记录与 KG `Active` 的差异。
   目标文件 / 模块 / 目录：`design/tasks/taskandissues_for_LLM.md`、`design/KG/SystemArchitecture.json`
   对应架构元素 ID：1227、1229
   完成判定标准：能够明确写出任务名称、状态、执行目标、负责人和起止时间的统一口径。
2. 动作说明：确认 `.aicodingconfig` / `.aicodingconfig.json` 中的代理配置可表达 `default_agent` 与 `task_specific_agents`，并保留扩展位。
   目标文件 / 模块 / 目录：`.aicodingconfig`、`.aicodingconfig.json`
   对应架构元素 ID：1231、1227
   完成判定标准：配置入口可稳定驱动默认代理与技能级代理匹配，不破坏现有 Copilot 逻辑。
3. 动作说明：在已安装 `OpenCode CLI` 的环境中触发映射到 `opencode` 的技能，验证一次真实命令执行并记录 stdout、stderr 与退出码。
   目标文件 / 模块 / 目录：`src/extension.ts`、需结合代码仓进一步定位的日志或输出通道
   对应架构元素 ID：1227、1232、1228
   完成判定标准：命中 `opencode` 时能完成一次真实执行，或失败时保留完整诊断信息。
4. 动作说明：复核命中 `copilot` 的路径仍通过 `Prompt Tool Registry` 工作，且 `WorkflowViewProvider` 的界面职责未外溢到适配层。
   目标文件 / 模块 / 目录：`src/extension.ts`、`package.json`
   对应架构元素 ID：1187、1219、1213、1209
   完成判定标准：Copilot 路径无回归，代理切换不会改变 prompt 工具注册与界面职责分工。
5. 动作说明：若真实执行失败，仅在 `Executor_Router` / CLI 适配边界内做最小修补，并同步更新任务材料中的阻塞说明。
   目标文件 / 模块 / 目录：`src/extension.ts`、`implementation/taskhelpinfos/2026-3-18_Executor_Router.md`
   对应架构元素 ID：1227、1232、1229
   完成判定标准：问题被限制在调用适配或错误处理层内解决，Copilot 路径与任务材料保持一致。

## 7. 建议修改目标

- 优先检查的文件：`src/extension.ts`、`.aicodingconfig`、`.aicodingconfig.json`。
- 可能需要新增的文件：`未知`；当前 KG 未要求新增独立模块，优先复用现有 `Executor_Router` / `OpenCode CLI` 适配边界。
- 可能需要避免修改的文件：`workprompt/*.md`、`.github/skills/*`、仅承担 `WorkflowViewProvider` 展示职责的代码。

## 8. 交付物与验收标准

- [x] 已明确任务输出名称、状态取值和多源冲突处理口径。
- [x] 已具备默认代理读取与配置保留能力。
- [x] 已具备按技能名选择代理的路由能力。
- [x] 命中 `copilot` 时保留既有 prompt reference 执行链路。
- [x] `OpenCode` 分支已具备命令构造与错误透传逻辑。
- [x] `ResolverNotes` 已给出 `npm run compile` 通过及关键文件无错误的验证证据。
- [ ] 在已安装并配置真实 `OpenCode CLI` 的环境中完成一次成功执行，并记录成功证据。
- [ ] 在真实 CLI 环境下复核 Windows 路径、命令参数与退出码透传是否符合预期。
- [ ] 依据最终验证结果更新任务状态，并补齐最终 closure 说明。

## 9. 风险、阻塞与缓解措施

- 主要阻塞：当前执行环境未安装 `OpenCode CLI`，无法完成成功路径验收。缓解措施：人工先安装 CLI 或在配置中提供明确命令路径，再执行端到端验证。
- 数据冲突风险：markdown 状态为 `Verified`，KG 状态为 `Active`。缓解措施：本轮输出统一按提示词规则优先采用 markdown，并在清单中显式备注。
- 技术风险：真实 CLI 契约可能与当前适配假设不一致。缓解措施：保持适配层只负责命令构造、工作目录处理与错误透传，避免深耦合解析。
- 兼容性风险：Windows 下命令引号与路径转义可能导致仅在特定机器复现的问题。缓解措施：记录完整命令、参数、工作目录与退出码，便于针对性修补。
