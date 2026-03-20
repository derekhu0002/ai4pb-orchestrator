# 任务执行简报

- 任务名称：implement a router to adapt different ai coding agent.
- 任务类型：ToDo
- 当前状态：Active
- 负责人：llm
- 优先级：Low
- 起止时间：2026-3-18 至 2026-3-18
- 关联架构对象名称与 ID：Executor_Router (1227)、AI4PB VS插件 (1209)、AI Coding Agent (1230)、Github Copilot (1187)、Open Code AI Coding Agent (1228)、OpenCode CLI 适配器 (1232)、.aicodingconfig (1231)

## 1. LLM执行摘要

- 当前任务的主线不是从零重做路由，而是基于现有实现收口 `OpenCode CLI` 真实环境验收并补齐剩余阻塞。
- `ResolverNotes` 已给出执行上下文：`src/extension.ts`、`.aicodingconfig` 已完成路由改造，`npm run compile` 已通过，但本机未安装 `opencode`，尚未完成真实 CLI 成功执行验收。
- 首要核对对象是 `.aicodingconfig` 中 `AGENT_ROUTER_CONFIG` 与 `src/extension.ts` 中的统一路由入口，确认默认代理、按技能覆盖与回退行为仍一致。
- `Copilot` 路径必须继续沿用现有 prompt reference 与 `Prompt Tool Registry` 服务边界，不能借本任务改造提示词资产体系。
- `OpenCode` 路径本轮只允许一次性命令执行、错误透传和工作目录适配，不允许扩展为会话态代理或新增编排协议。
- 最关键验收条件是：当技能命中 `opencode` 且本机 CLI 可用时，能完成一次真实调用；当 CLI 缺失或失败时，stderr/stdout 与退出码可被上层诊断。
- 当前最大阻塞不是 KG 缺少组件，而是运行环境契约未落地：真实命令名、参数、认证方式和 Windows 路径细节仍需人工补齐。
- 如无需修改现有实现逻辑，则下一步重点是补充环境、执行端到端验证，并把验证结论回写到任务支撑材料。

## 2. 已确认事实

- `Executor_Router` (1227) 是 `AI4PB VS插件` (1209) 的组成部分，关系为 `1116`：`AI4PB VS插件 --(ArchiMate_Composition)--> Executor_Router`。
- `Executor_Router` (1227) 的 KG 描述明确为“根据 `.aicodingconfig` 中存储的配置将任务派发给不同 AI coding agent”。
- `Executor_Router` (1227) 的任务记录在 `project_info.tasks` 中，状态为 `Active`，负责人为 `llm`，开始与截止日期均为 `2026-3-18`，优先级为 `Low`。
- `.aicodingconfig` (1231) 在 KG 中已给出最小配置样例，包含 `AGENT_ROUTER_CONFIG.default_agent` 与 `AGENT_ROUTER_CONFIG.task_specific_agents`。
- `Github Copilot` (1187) 是 `AI Coding Agent` (1230) 的特化实现，关系为 `1126`；`Open Code AI Coding Agent` (1228) 也是 `AI Coding Agent` (1230) 的特化实现，关系为 `1125`。
- `Application` 视图 (`152`) 同时纳入 `AI4PB VS插件` (1209)、`Executor_Router` (1227)、`AI Coding Agent` (1230) 与 `Task Help Infomation` (1229)，并包含关系 `1116`、`1100`、`1122`，说明本任务位于扩展执行分发主链路中。
- `AI Coding Agent` 视图 (`165`) 纳入 `AI Coding Agent` (1230)、`Github Copilot` (1187)、`Open Code AI Coding Agent` (1228)，并包含关系 `1125`、`1126`，确认 Copilot 与 OpenCode 在架构上是并列代理特化实现。
- `Open Code AI Coding Agent` 视图 (`166`) 纳入 `OpenCode CLI 适配器` (1232)，说明 KG 已为 OpenCode 命令适配预留独立组件位。
- `AI4PB VS插件` (1209)、`Github Copilot` (1187) 与 `WorkflowViewProvider` (1213) 的 `code_paths` 均指向 `src/extension.ts`/`package.json` 相关落点，表明本任务的主要代码边界仍在扩展主实现内。

## 3. 需人工确认 / 未知项

- `OpenCode CLI` 的真实命令名、参数格式、标准输出结构和非零退出码语义未知。建议以当前“命令构造 + 原样透传输出/退出码”为默认契约，并在获得真实 CLI 文档后再精化解析逻辑。
- `OpenCode CLI` 的认证方式未知。建议默认依赖用户本机既有登录态或环境变量，不在扩展中新增认证流程；若环境缺失，则直接暴露诊断错误。
- Windows 下命令引号、工作目录与路径分隔符细节未知。建议继续把路径拼装和进程调用收敛在适配层，避免在多个命令入口重复处理。
- `ResolverNotes` 指出本机 `Get-Command opencode` 未安装，因此当前无法从仓库侧单独完成真实成功验收。建议人工先安装 CLI 或提供明确命令路径后再触发端到端验证。
- 当前任务状态仍为 `Active`，但 `ResolverNotes` 显示大部分开发工作已完成。建议在真实 CLI 成功跑通后，再决定是否将任务状态更新为 `Verified`/`Completed`。

## 4. 约束与边界

- 必须遵守的原则：`Progressive Disclosure`、`Separation of Concerns`。
- 需保持不变的边界：`Github Copilot` (1187) 的 prompt reference 调用方式、`Prompt Tool Registry` (1219) 的提示词资产服务职责、`WorkflowViewProvider` (1213) 的交互展示职责。
- 明确禁止的实现方式：不得把 `OpenCode` 调用逻辑散落到多个分支；不得为本轮引入持久会话控制、流式协议、额外 prompt 资产或新的技能映射体系。
- `Progressive Disclosure` 的落地要求：仅收口默认代理读取、按技能路由、一次性 `OpenCode CLI` 调用、错误透传与真实环境验收，不扩展后续增强项。
- `Separation of Concerns` 的落地要求：配置解析、路由决策、`Copilot` 执行、`OpenCode CLI` 适配应保持独立职责；即使仍位于同一文件，也不得相互耦合成不可替换的实现。

## 5. 架构元素级任务拆解

| 子任务名称 | 对应架构元素 | 技术目的 | 与其他子任务的依赖关系 |
| --- | --- | --- | --- |
| 核对路由配置与技能映射 | `.aicodingconfig` (1231)、`Executor_Router` (1227) | 确认默认代理、技能归一化与回退策略仍符合最小 schema | 后续所有验证步骤依赖此项 |
| 复核 Copilot 保留链路 | `Github Copilot` (1187)、`Prompt Tool Registry` (1219)、`AI Coding Agent` (1230) | 确保命中 `copilot` 时仍走既有 prompt reference 执行链 | 依赖“核对路由配置与技能映射” |
| 真实环境验证 OpenCode 执行 | `Open Code AI Coding Agent` (1228)、`OpenCode CLI 适配器` (1232) | 在已安装 CLI 的前提下完成一次真实命令执行并确认输出/退出码行为 | 依赖“核对路由配置与技能映射” |
| 收口诊断与状态更新 | `Executor_Router` (1227)、`AI4PB VS插件` (1209) | 若验证失败则最小化修补；若验证通过则整理交付证据并准备关闭任务 | 依赖前述全部子任务 |

## 6. 推荐实施顺序

1. 动作说明：核对 `ResolverNotes` 已声明的改动范围与当前配置入口，确认后续工作聚焦真实环境验收而不是重新设计路由。
   目标文件 / 模块 / 目录：`design/tasks/taskandissues_for_LLM.md`、`.aicodingconfig`、`src/extension.ts`
   对应架构元素 ID：1227、1231、1209
   完成判定标准：能够明确写出默认代理、技能映射、Copilot 分支与 OpenCode 分支当前各自承担的职责。
2. 动作说明：在本机补齐 `OpenCode CLI` 可执行环境，至少确认命令名或绝对路径可被扩展调用。
   目标文件 / 模块 / 目录：`.aicodingconfig` 或 `.aicodingconfig.json`
   对应架构元素 ID：1231、1228、1232
   完成判定标准：存在可用的 CLI 命令配置，且人工可确认其认证方式与运行前提。
3. 动作说明：触发映射到 `opencode` 的技能，验证一次真实命令执行是否成功，并记录 stdout/stderr/退出码行为。
   目标文件 / 模块 / 目录：`src/extension.ts`、需结合代码仓进一步定位的输出通道/日志位置
   对应架构元素 ID：1227、1232、1230
   完成判定标准：命中 `opencode` 时能完成一次真实执行，或在失败时保留完整诊断信息。
4. 动作说明：若真实执行失败，仅在 `Executor_Router`/适配层边界内做最小修补，避免牵动 prompt 资产与视图层。
   目标文件 / 模块 / 目录：`src/extension.ts`
   对应架构元素 ID：1227、1232、1187
   完成判定标准：问题被限制在调用适配或错误处理层内解决，`Copilot` 路径行为不回归。
5. 动作说明：补齐最终验收证据并回写任务材料，确认是否可以关闭该任务。
   目标文件 / 模块 / 目录：`implementation/taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md`、`implementation/task-list.md`
   对应架构元素 ID：1227、1229
   完成判定标准：支撑文件、任务清单与实际验证结论一致，剩余阻塞项被明确记录。

## 7. 建议修改目标

- 优先检查的文件：`src/extension.ts`、`.aicodingconfig`、`.aicodingconfig.json`。
- 可能需要新增的文件：`未知`；当前 KG 未要求新增新模块，优先复用现有 `Executor_Router` / `OpenCode CLI` 适配边界。
- 可能需要避免修改的文件：`workprompt/*.md`、`.github/skills/*`、与 `WorkflowViewProvider` 展示职责直接相关但不承担执行分发的代码。

## 8. 交付物与验收标准

- [x] 已具备默认代理读取与配置保留能力。
- [x] 已具备按技能名选择代理的路由能力。
- [x] 命中 `copilot` 时保留既有 prompt reference 执行链路。
- [x] `OpenCode` 分支已具备命令构造与错误透传逻辑。
- [x] `npm run compile` 已通过，且 `get_errors` 对 `src/extension.ts`、`.aicodingconfig`、任务支撑文件返回 0 错误（依据 `ResolverNotes`）。
- [ ] 在已安装并配置真实 `OpenCode CLI` 的环境中完成一次成功执行，并记录成功证据。
- [ ] 在真实 CLI 环境下复核 Windows 路径、命令参数与退出码透传是否仍然符合预期。
- [ ] 依据最终验证结果更新任务状态，并补齐最终 closure 说明。

## 9. 风险、阻塞与缓解措施

- 主要阻塞：当前执行环境未安装 `OpenCode CLI`，无法完成成功路径验收。缓解措施：人工先安装 CLI 或在配置中提供明确命令路径，再执行端到端验证。
- 技术风险：真实 CLI 契约可能与当前适配假设不一致。缓解措施：继续保持适配层只负责命令构造、工作目录和错误透传，避免深耦合解析。
- 兼容性风险：Windows 下命令引号与路径转义可能导致仅在特定机器复现的问题。缓解措施：记录完整命令、参数、工作目录和退出码，便于针对性修补。
- 管理风险：任务状态仍为 `Active`，容易让后续执行者误判为功能未开发。缓解措施：在任务清单与支撑文件中明确“开发已基本完成、剩余为真实 CLI 验收阻塞”。
