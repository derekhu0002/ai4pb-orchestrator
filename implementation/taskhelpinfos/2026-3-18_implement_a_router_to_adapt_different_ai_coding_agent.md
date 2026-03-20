# 任务执行简报

- 任务名称：implement a router to adapt different ai coding agent.
- 任务类型：ToDo
- 当前状态：Active
- 负责人：llm
- 优先级：Low
- 起止时间：2026-3-18 至 2026-3-18
- 关联架构对象名称与 ID：Executor_Router (1227)、AI4PB VS插件 (1209)、AI Coding Agent (1230)、Github Copilot (1187)、Open Code AI Coding Agent (1228)、OpenCode CLI 适配器 (1232)、.aicodingconfig (1231)、Prompt Tool Registry (1219)、WorkflowViewProvider (1213)

## 1. LLM执行摘要

- 当前任务重点是基于既有实现完成执行路由收口，不是重做整条代理架构。
- `ResolverNotes` 已明确：`src/extension.ts` 与 `.aicodingconfig` 已完成路由改造，`npm run compile` 已通过，剩余阻塞是本机未安装 `opencode` 导致无法做真实成功验收。
- 首要修改对象仍是 `Executor_Router` 所在的 `src/extension.ts` 与 `.aicodingconfig`，必须保证默认代理、技能级覆盖和回退行为一致。
- `Github Copilot` 分支必须继续通过 `Prompt Tool Registry` 提供的 prompt reference 链路工作，不能借此任务改造提示词资产注册方式。
- `Open Code AI Coding Agent` 分支本轮仅允许一次性 CLI 调用、工作目录适配和错误透传，不得扩展为会话态、多轮编排或新增协议栈。
- 最关键验收条件是：命中 `opencode` 时在真实环境完成一次成功执行；命令失败时 stdout、stderr 与退出码可完整回传给上层。
- 当前主要风险是 CLI 真实契约和环境前置条件未落地，尤其是命令名、参数格式、认证方式与 Windows 路径处理细节。
- 若现有实现无需继续改码，则应把工作集中在环境补齐、端到端验证与验证证据回写。

## 2. 已确认事实

- `Executor_Router` (1227) 是 `AI4PB VS插件` (1209) 的组成部分，关系 `1116` 为 `AI4PB VS插件 --(ArchiMate_Composition)--> Executor_Router`。
- `Executor_Router` (1227) 的 KG 描述明确要求其依据 `.aicodingconfig` (1231) 中的配置将任务派发给不同 AI coding agent。
- `Executor_Router` (1227) 的 `project_info.tasks` 中存在唯一活动任务：状态 `Active`、负责人 `llm`、开始日期 `2026-3-18`、截止日期 `2026-3-18`、优先级 `Low`。
- `.aicodingconfig` (1231) 在 KG 中给出了最小 schema，明确包含 `AGENT_ROUTER_CONFIG.default_agent` 与 `AGENT_ROUTER_CONFIG.task_specific_agents`。
- `AI4PB VS插件` (1209) 通过关系 `1100` 触发 `AI Coding Agent` (1230)，说明路由结果会进入统一 AI 执行主链。
- `Github Copilot` (1187) 通过关系 `1126` 特化自 `AI Coding Agent` (1230)，`Open Code AI Coding Agent` (1228) 通过关系 `1125` 特化自 `AI Coding Agent` (1230)。
- `Github Copilot` (1187) 通过关系 `1104` 访问 `Prompt Tool Registry` (1219)，确认 Copilot 分支依赖既有 prompt tool 注册服务。
- `Open Code AI Coding Agent` 视图 (`166`) 纳入 `OpenCode CLI 适配器` (1232)；`AI Coding Agent` 视图 (`165`) 同时纳入 `AI Coding Agent` (1230)、`Github Copilot` (1187)、`Open Code AI Coding Agent` (1228)，说明 OpenCode 是与 Copilot 并列的代理特化实现。
- `Runtime Interaction Flow` 视图 (`163`) 纳入 `AI4PB VS插件` (1209)、`WorkflowViewProvider` (1213)、`Prompt Tool Registry` (1219) 与 `AUTO Skill Router` (1225)，说明本任务必须保持路由、界面交互与 prompt 注册职责边界分离。

## 3. 需人工确认 / 未知项

- `OpenCode CLI` 的真实命令名、参数格式、标准输出格式和非零退出码语义未知。建议保持当前“命令构造 + 原样透传输出/退出码”的最小契约，待获得真实文档后再补充解析。
- `OpenCode CLI` 的认证方式未知。建议默认依赖本机已有登录态或环境变量，不在扩展内新增认证界面；缺少认证时直接透出诊断错误。
- Windows 下命令引号、工作目录和路径分隔符兼容性未知。建议继续把路径拼装与进程调用集中在 CLI 适配层处理。
- KG 未给出 `OpenCode CLI 适配器` (1232) 的具体代码文件落点。建议按 `Executor_Router` 所在 `src/extension.ts` 为主入口继续定位，若需拆分代码文件再补充架构说明。
- `ResolverNotes` 表明本机 `Get-Command opencode` 未安装，因此当前无法仅凭仓库内容完成真实成功路径验收。建议人工先安装 CLI 或给出可执行文件路径。
- 任务在任务表中仍为 `Active`，但 `ResolverNotes` 显示主要开发已完成。建议在真实 CLI 成功跑通并记录证据后，再决定是否更新为完成态。

## 4. 约束与边界

- 必须遵守的原则：`Progressive Disclosure`、`Separation of Concerns`。
- KG 中未发现与该任务直接绑定的额外 `Principle` / `Constraint` 实体，因此除上述两项基线原则外，其余约束以已确认架构关系和任务说明为准。
- 需保持不变的模块与边界：`Github Copilot` (1187) 的 prompt reference 调用链、`Prompt Tool Registry` (1219) 的提示词注册服务职责、`WorkflowViewProvider` (1213) 的界面与交互职责。
- 明确禁止的实现方式：不得把 `OpenCode` 调用逻辑散落到多个命令入口；不得在本轮引入持久会话、流式协议、额外 prompt 资产或新的技能匹配体系。
- `Progressive Disclosure` 的强制落地要求：本轮只覆盖默认代理读取、按技能路由、一次性 `OpenCode CLI` 调用、错误透传与真实环境验收，不外扩后续增强项。
- `Separation of Concerns` 的强制落地要求：配置解析、路由决策、Copilot 执行与 OpenCode CLI 适配必须保持职责分离；即使代码仍暂存于同一文件，也要维持可替换边界。

## 5. 架构元素级任务拆解

| 子任务名称 | 对应架构元素 | 技术目的 | 与其他子任务的依赖关系 |
| --- | --- | --- | --- |
| 核对路由配置与技能映射 | `.aicodingconfig` (1231)、`Executor_Router` (1227) | 确认默认代理、技能归一化和回退策略符合最小 schema 与任务说明 | 后续所有步骤依赖此项 |
| 复核 Copilot 保留链路 | `Github Copilot` (1187)、`Prompt Tool Registry` (1219)、`AI Coding Agent` (1230) | 确保命中 `copilot` 时仍走既有 prompt reference 执行链 | 依赖“核对路由配置与技能映射” |
| 验证 OpenCode CLI 适配边界 | `Open Code AI Coding Agent` (1228)、`OpenCode CLI 适配器` (1232) | 在真实 CLI 存在时验证一次性执行、错误透传与工作目录处理 | 依赖“核对路由配置与技能映射” |
| 复核扩展交互边界 | `AI4PB VS插件` (1209)、`WorkflowViewProvider` (1213) | 确保代理切换不会污染界面职责或命令分发入口 | 依赖“复核 Copilot 保留链路” |
| 收口诊断与状态更新 | `Executor_Router` (1227)、`AI4PB VS插件` (1209) | 若验证失败则在路由/适配层最小修补；若验证通过则整理证据并准备关闭任务 | 依赖前述全部子任务 |

## 6. 推荐实施顺序

1. 动作说明：核对 `ResolverNotes` 已声明的改动范围与当前配置入口，确认后续工作聚焦真实 CLI 验收而非重新设计路由。
   目标文件 / 模块 / 目录：`design/tasks/taskandissues_for_LLM.md`、`.aicodingconfig`、`src/extension.ts`
   对应架构元素 ID：1227、1231、1209
   完成判定标准：能够清楚写出默认代理、技能映射、Copilot 分支与 OpenCode 分支的职责边界。
2. 动作说明：在本机补齐 `OpenCode CLI` 可执行环境，至少确认命令名或绝对路径可被扩展调用。
   目标文件 / 模块 / 目录：`.aicodingconfig` 或 `.aicodingconfig.json`
   对应架构元素 ID：1231、1228、1232
   完成判定标准：存在可用 CLI 命令配置，且人工可确认其认证方式与运行前提。
3. 动作说明：触发映射到 `opencode` 的技能，验证一次真实命令执行是否成功，并记录 stdout、stderr 与退出码。
   目标文件 / 模块 / 目录：`src/extension.ts`、需结合代码仓进一步定位的输出通道或日志位置
   对应架构元素 ID：1227、1232、1230
   完成判定标准：命中 `opencode` 时能完成一次真实执行，或失败时保留完整诊断信息。
4. 动作说明：复核 `copilot` 命中路径仍通过 `Prompt Tool Registry` 工作，且界面交互职责未从 `WorkflowViewProvider` 外溢到适配层。
   目标文件 / 模块 / 目录：`src/extension.ts`、`package.json`、需结合代码仓进一步定位的 webview 交互入口
   对应架构元素 ID：1187、1219、1213、1209
   完成判定标准：Copilot 路径无回归，代理切换不会改变 prompt 工具注册与界面职责分工。
5. 动作说明：若真实执行失败，仅在 `Executor_Router` / CLI 适配边界内做最小修补，避免牵动 prompt 资产与界面层。
   目标文件 / 模块 / 目录：`src/extension.ts`
   对应架构元素 ID：1227、1232、1187
   完成判定标准：问题被限制在调用适配或错误处理层内解决，Copilot 路径行为不回归。
6. 动作说明：补齐最终验收证据并回写任务材料，确认是否可以关闭该任务。
   目标文件 / 模块 / 目录：`implementation/taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md`、`implementation/task-list.md`
   对应架构元素 ID：1227、1229
   完成判定标准：支撑文件、任务清单与实际验证结论一致，剩余阻塞项被明确记录。

## 7. 建议修改目标

- 优先检查的文件：`src/extension.ts`、`.aicodingconfig`、`.aicodingconfig.json`。
- 可能需要新增的文件：`未知`；当前 KG 未要求新增独立模块，优先复用现有 `Executor_Router` / `OpenCode CLI` 适配边界。
- 可能需要避免修改的文件：`workprompt/*.md`、`.github/skills/*`、仅承担 `WorkflowViewProvider` 展示职责的代码。

## 8. 交付物与验收标准

- [x] 已具备默认代理读取与配置保留能力。
- [x] 已具备按技能名选择代理的路由能力。
- [x] 命中 `copilot` 时保留既有 prompt reference 执行链路。
- [x] `OpenCode` 分支已具备命令构造与错误透传逻辑。
- [x] `npm run compile` 已通过，且 `get_errors` 对 `src/extension.ts`、`.aicodingconfig`、任务支撑文件返回 0 错误（依据 `ResolverNotes`）。
- [ ] 在已安装并配置真实 `OpenCode CLI` 的环境中完成一次成功执行，并记录成功证据。
- [ ] 在真实 CLI 环境下复核 Windows 路径、命令参数与退出码透传是否符合预期。
- [ ] 依据最终验证结果更新任务状态，并补齐最终 closure 说明。

## 9. 风险、阻塞与缓解措施

- 主要阻塞：当前执行环境未安装 `OpenCode CLI`，无法完成成功路径验收。缓解措施：人工先安装 CLI 或在配置中提供明确命令路径，再执行端到端验证。
- 技术风险：真实 CLI 契约可能与当前适配假设不一致。缓解措施：继续保持适配层只负责命令构造、工作目录和错误透传，避免深耦合解析。
- 兼容性风险：Windows 下命令引号与路径转义可能导致仅在特定机器复现的问题。缓解措施：记录完整命令、参数、工作目录和退出码，便于针对性修补。
- 管理风险：任务状态仍为 `Active`，容易让后续执行者误判为功能尚未开发。缓解措施：在任务清单与支撑文件中明确“开发已基本完成、剩余为真实 CLI 验收阻塞”。
