# 任务支撑信息：在AUTO模式下的智能输入分析与执行分配

## 1. 任务名称、关联架构对象、负责人、优先级、时间窗口
- **任务名称**：在AUTO模式下，插件收到用户在输入框中的输入后，需要通过后台AI大模型进行分析并给出执行建议，当用户确认后自动发送给COPILOT执行
- **关联架构对象**：`AI4PB VS插件` (ID: 1209), `WorkflowViewProvider` (ID: 1213), `Prompt Tool Registry` (ID: 1219)
- **负责人**：llm
- **优先级**：Low
- **时间窗口**：2026-3-11 至 1899-12-30

## 2. 任务目标与业务价值
- **目标**：实现AI4PB扩展的自动模式（AUTO mode）。当用户在侧边栏Webview的聊天输入框输入需求时，扩展不仅能接收输入，还应通过与后台LLM大模型通信解析意图，给出最合适的Copilot Prompt和后续动作建议。在用户确认后，自动路由并将构造好的上下文发往GitHub Copilot去执行下一步操作。
- **业务价值**：极大降低用户的操作认知门槛，系统可以自动推断出需要执行的工作流技能（如`Task List`, `Init`, `Audit`等），形成以AI驱动的高效工作流辅助。

## 3. 输入信息与依赖项
- **前端输入**：VS Code侧边栏Webview中的用户聊天文本。
- **配置与状态**：当前的开发上下文、是否开启AUTO模式。
- **接口依赖**：通过 VS Code API 或 GitHub Copilot API 请求 LLM 对话。
- **输出对象**：将处理后的执行建议呈现到Webview中并等待用户一次点击确认；触发对应的 Copilot Prompt Action 并执行。

## 4. 架构元素级别的任务分解与拆解逻辑
*严格遵循 Progressive Disclosure 与 Separation of Concerns 架构建模原则。*

- **子任务 4.1：前端聊天拦截与模式判断**
  - **关联架构元素**：`WorkflowViewProvider` (ID: 1213)
  - **逻辑**：Webview界面和处理侧需要增加对`AUTO`模式的判断状态。若为手动选择技能则按原链路行走；若未选择技能（进入AUTO推导），则走模型分析逻辑。
- **子任务 4.2：后台意图分析模块 (Intent Analyzer)**
  - **关联架构元素**：`AI4PB VS插件` (ID: 1209) (建议在架构中新增具体的`IntentAnalyzer`组件)
  - **逻辑**：在插件扩展的主进程中扩展`handleChatRequest`。它需要把用户的原输入加上当前阶段信息封装发送给内部的大模型工具（可复用现有的 vscode.lm api），要求大模型推导最匹配的 `AI4PB Prompt`（如 `#ai4pb-init` 或 `#ai4pb-audit`）及执行建议。
- **子任务 4.3：用户确认与Copilot派发逻辑**
  - **关联架构元素**：`WorkflowViewProvider` (ID: 1213) 及 `Github Copilot` (ID: 1187)
  - **逻辑**：收到后台LLM反馈后，向Webview侧返回结构化的建议；Webview渲染为可确认的消息格式；用户点击"确认执行"，发回主进程通过现有入口方法 `openCopilotWithPromptReference` 打开 Copilot。

## 5. 具体执行步骤
1. 修改 Webview UI 层，在发送请求时增加是否明确要求模型分析的参数。
2. 在 `src/extension.ts` (关联元素1209: `AI4PB VS插件`) 内的 `WorkflowViewProvider.handleChatRequest` 中，捕获未显式指定skill的请求。
3. 调用 `vscode.lm.selectChatModels` 以及相应的 API 构建意图识别 prompt，发送给模型进行回答。要求返回一个特定的结构（含目标技能与建议）。
4. 在侧边栏 UI 将上述识别结果以待确认气泡形式展示。
5. Webview 增加确认回调 API（例如：`confirmAutoAction`），主进程监听到该回调后，直接调用 `openCopilotWithPromptReference` 处理后续到 Copilot。

## 6. 交付物与验收标准
- **交付物**：更新的 `src/extension.ts` 代码，修改过的 Webview html/js 前端代码。
- **验收标准**：
  1. 打开AUTO模式（不指明具体skill），向文本框输入“帮我看看现在的业务代码实现了哪些部分”，侧边栏能短暂进行分析并打出“建议执行：AI4PB_DESIGN_AUDIT (架构评估)，是否执行？”。
  2. 点击确认后，成功自动拉起 Copilot 会话窗口并执行 `#ai4pb-audit` 流程指令。不在系统工具外执行未指定的无关操作。

## 7. 主要风险、缺口与缓解措施
- **风险**：vscode.lm 的解析速度太慢导致白屏或前端超时。
  - *缓解措施*：前端加入明确的“大模型正在思考” loading 动画，并将系统 prompt 进行精简以降低 token latency。
- **缺口**：暂无精确评估 LLM 返回的不确定内容的报错兜底机制。
  - *缓解措施*：若 LLM 分析失败或回复的并不是一个预定义的 Skill 标示符，要通过 Webview 回显给用户友好的重新输入提示。

## 8. 本周建议行动（next actions）
1. 立即探索本扩展内是否有封装好的 `chatModels` 调用范例。
2. 梳理并在代码上模拟一次 `WorkflowViewProvider` 给 Webview 下发结构化卡片的方法。