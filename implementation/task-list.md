# AI4PB 综合任务清单

## 头部信息

- 报告生成日期：2026-03-20
- 总任务数：1
- 状态分布：Active 1
- 优先级分布：Low 1

## 任务列表

| Task Name | Associated Component | Assignee(s) | Priority | Status | Start Date | Due Date | Days Until Due | Key Deliverable | Task Help Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| implement a router to adapt different ai coding agent. | Executor_Router (1227) | llm | Low | Active | 2026-3-18 | 2026-3-18 | 21 | 建立基于 `.aicodingconfig` 的执行路由，使任务可按技能名分发到不同 AI coding agent，并保持 Copilot 原有 prompt reference 链路不变。补齐 OpenCode 的一次性 CLI 适配、命令构造与错误透传。 | [2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md](taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md) |

## 汇总

- 按状态统计：Active 1
- 按优先级统计：Low 1
- 按负责人统计：llm 1

## 7日内到期任务

- `implement a router to adapt different ai coding agent.` 已于 2026-3-18 到期；相对报告生成日 2026-03-20 已逾期 2 天，应优先确认是否需要将状态从 `Active` 更新为 `Verified` 或补录剩余验收阻塞。

## 无负责人任务

- 无

## 假设说明

- 已按要求同时使用 `design/tasks/taskandissues_for_LLM.md` 与 `design/KG/SystemArchitecture.json`；其中任务行内容与 ResolverNotes 取自 markdown，负责人、优先级、起止日期、组件映射取自 KG。
- `implementation/taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md` 已存在，因此 `Task Help Link` 保留有效相对链接，而非 `N/A`。
- `Days Until Due` 严格按提示词规定的基准日期 2026-02-25 计算，因此 2026-3-18 的截止日期对应 21 天；但 7 日内到期判断按本次报告生成日 2026-03-20 识别实际紧急度。
