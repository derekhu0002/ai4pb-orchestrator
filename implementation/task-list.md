# AI4PB 综合任务清单

## 头部信息

- 报告生成日期：2026-03-19
- 总任务数：1
- 状态分布：Active 1
- 优先级分布：Low 1

## 任务列表

| Task Name | Associated Component | Assignee(s) | Priority | Status | Start Date | Due Date | Days Until Due | Key Deliverable | Task Help Link |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| implement a router to adapt different ai coding agent. | Executor_Router (1227) | llm | Low | Active | 2026-3-18 | 2026-3-18 | 21 | 建立基于 .aicodingconfig 的执行路由，使任务可按技能名分发到不同 AI coding agent。保持 Copilot 现有 prompt reference 链路不变，并补齐 OpenCode 的一次性 CLI 适配与错误透传。 | [2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md](taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md) |

## 汇总

- 按状态统计：Active 1
- 按优先级统计：Low 1
- 按负责人统计：llm 1

## 7日内到期任务

- 无

## 无负责人任务

- 无

## 假设说明

- markdown 任务索引仅提供任务行与 ResolverNotes 上下文，负责人、优先级、起止日期等缺失字段已按 design/KG/SystemArchitecture.json 中 Executor_Router (1227) 的 project_info.tasks 回填。
- Days Until Due 严格按提示词指定的基准日期 2026-02-25 计算，因此 2026-3-18 的截止日期对应剩余 21 天。
- 已存在对应任务支撑文件 implementation/taskhelpinfos/2026-3-18_implement_a_router_to_adapt_different_ai_coding_agent.md，因此保留有效 Task Help Link，而非使用 N/A。
