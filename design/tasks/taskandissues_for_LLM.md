# Task And Issues For LLM

| Name | Problem | ProblemNotes | ResolverNotes | ProblemType | Status | Object_ID |
| --- | --- | --- | --- | --- | --- | --- |
| Executor_Router | implement a router to adapt different ai coding agent. | - .aicodingconfig 配置字段的具体 schema (有关 Agent 选择)配置字段按任务说明采用最小假设：{"AGENT_ROUTER_CONFIG":{"default_agent":"copilot","task_specific_agents":{}}}，并保留扩展位。<br>- 新代理明确使用OpenCode(见https://opencode.ai/docs/zh-cn/)，我希望使用它的CLI对它进行调用；<br>-  Copilot 继续使用现有 prompt reference，OpenCode 走独立命令执行链。<br>- task_specific_agents 的键应按技能名进行匹配，以当前扩展已有技能标识为准，并在实现时统一归一化。<br>- OpenCode CLI 的实际调用命令、参数格式、返回码约定、认证方式和 Windows 路径处理先实现命令构造与错误透传的适配层，待人工补充真实 CLI 契约。<br>- OpenCode 适配本轮先支持一次性执行与错误透传；更高级的会话控制标记为后续增强项。 |  | ToDo | Active | 1227 |
