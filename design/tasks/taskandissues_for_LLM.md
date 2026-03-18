# Task And Issues For LLM

| Name | Problem | ProblemNotes | ResolverNotes | ProblemType | Status | Object_ID |
| --- | --- | --- | --- | --- | --- | --- |
| Executor_Router | implement a router to adapt different ai coding agent. | - .aicodingconfig 配置字段的具体 schema (有关 Agent 选择)配置字段为：{"AGENT_ROUTER_CONFIG": {"default_agent": "copilot", "task_specific_agents": {}}}，后续供人工核对。<br>- 新代理明确使用OpenCode(见https://opencode.ai/docs/zh-cn/)，我希望使用它的CLI对它进行调用； |  | ToDo | Active | 1227 |
