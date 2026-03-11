# Task And Issues For LLM

| Name | Problem | ProblemNotes | ResolverNotes | ProblemType | Status | Object_ID |
| --- | --- | --- | --- | --- | --- | --- |
| AI4PB VS插件 | 在AUTO模式下，插件收到用户在输入框中的输入后，需要通过后台AI大模型进行分析并给出执行建议，当用户确认后自动发送给COPILOT执行 |  | 20260311 10:44 from Developer:<br>建议不够准确，你可以尝试给出多个可能的执行动作。<br>[2026-03-11] from LLM: 已针对 AUTO 模式建议不够准确的问题完成处理，技术方案为将单一技能推荐调整为最多 3 个候选执行动作，并在 Webview 中逐项展示分析依据与独立确认按钮，用户可按候选项直接确认派发到 Copilot。变更文件为 src/extension.ts；已修改 handleChatRequest 的消息载荷、AUTO 建议卡片渲染、模型提示词格式、JSON 解析逻辑，以及新增基于规则的候选排序与去重回退机制。验证证据：npm run compile 通过，src/extension.ts 无类型错误。最终结果：In Progress，当前已满足“给出多个可能执行动作”的反馈要求；剩余后续动作仅为在真实 Copilot 环境下做交互回归，确认多候选建议命中率与文案表现。 | ToDo | Active | 1209 |
