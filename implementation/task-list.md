# AI4PB 综合任务清单

## 头部信息

- 报告生成日期：2026-03-20
- 总任务数：1
- 状态分布：Verified 1
- 优先级分布：Low 1

## 任务列表

| Task Name | Associated Component | Assignee(s) | Priority | Status | Start Date | Due Date | Days Until Due | Key Deliverable | Task Help Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Executor_Router | Executor_Router (1227) | llm | Low | Verified | 2026-3-18 | 2026-3-18 | 21 | 保持 `Github Copilot` 既有 prompt reference 链路不变，并完成面向 `OpenCode CLI` 的一次性路由、错误透传与真实环境验收闭环。 | [2026-3-18_Executor_Router.md](taskhelpinfos/2026-3-18_Executor_Router.md) |

## 汇总

- 按状态统计：Verified 1
- 按优先级统计：Low 1
- 按负责人统计：llm 1

## 7日内到期任务

- 无

## 无负责人任务

- 无

## 假设说明

- 已先刷新 `implementation/taskhelpinfos` 下的任务支撑文件，再生成本清单；因此 `Task Help Link` 使用相对链接而非 `N/A`。
- 已同时使用 `design/tasks/taskandissues_for_LLM.md` 与 `design/KG/SystemArchitecture.json`；任务名称、状态与执行上下文优先取 markdown，负责人、优先级、起止日期与组件映射在 markdown 缺失时回退到 KG。
- `design/tasks/taskandissues_for_LLM.md` 的状态为 `Verified`，而 KG 任务状态为 `Active`；本清单按提示词规则优先采用 markdown 状态，并将该冲突视为已显式声明的源数据不一致。
- `Days Until Due` 与“7日内到期任务”均按提示词指定基准日 `2026-02-25` 计算，因此 `2026-3-18` 的结果为 `21`。
