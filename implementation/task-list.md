# AI4PB 综合任务清单

## 头部信息

- 报告生成日期：2026-03-20
- 总任务数：1
- 状态分布：Active 1
- 优先级分布：Low 1

## 任务列表

| Task Name | Associated Component | Assignee(s) | Priority | Status | Start Date | Due Date | Days Until Due | Key Deliverable | Task Help Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| implement a router to adapt different ai coding agent. | Executor_Router (1227) | llm | Low | Active | 2026-3-18 | 2026-3-18 | 21 | 保持 `Github Copilot` 原有 prompt reference 调用链不变，并完成 `OpenCode CLI` 一次性执行链路的真实环境验收；若验收失败，也必须保留完整错误透传与诊断信息。 | [2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md](taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md) |

## 汇总

- 按状态统计：Active 1
- 按优先级统计：Low 1
- 按负责人统计：llm 1

## 7日内到期任务

- **implement a router to adapt different ai coding agent.** 截止日期为 `2026-3-18`；相对报告生成日 `2026-03-20` 已逾期 2 天，当前关键紧急项是补齐真实 `OpenCode CLI` 成功执行验收并回写验证证据。

## 无负责人任务

- 无

## 假设说明

- 已同时使用 `design/tasks/taskandissues_for_LLM.md` 与 `design/KG/SystemArchitecture.json`；任务名称、状态与 `ResolverNotes` 执行上下文取自 markdown，负责人、优先级、起止日期与组件映射取自 KG。
- `Task Help Link` 指向已生成并刷新后的 `implementation/taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md`，因此不使用 `N/A`。
- `Days Until Due` 按提示词指定基准日 `2026-02-25` 计算，因此 `2026-3-18` 的结果为 `21`；紧急度描述按报告生成日 `2026-03-20` 表达实际风险。
- `ResolverNotes` 明确显示路由改造主体已完成、剩余阻塞为真实 CLI 验收，因此本清单将该任务视为“实现基本完成但验证未关闭”的 `Active` 任务。
