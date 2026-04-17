# 🚀 Argo (AI4PB): The Ultimate Harness Engineering OS for Project Building

**Argo (原名 AI4PB)** 是一个基于 **[OpenCode 框架](https://opencode.ai/)** 构建的企业级多智能体软件工程操作系统。

在 2026 年的今天，AI 工程的重心已经从最初的 **Prompt Engineering**（提示词工程，解决“怎么说”）、**Context Engineering**（上下文工程，解决“给什么信息”）全面迈向了 **Harness Engineering（控制具工程，解决“如何约束与驾驭”）**。

当大模型能够极速生成数万行代码时，开发者面临的最大挑战不再是“AI 能不能写”，而是 **“在长链路的复杂任务中，系统如何持续约束 AI、验证结果，并防止架构腐化与意图失控”**。

**Argo 专为 AI 时代的复杂软件工程而生，是目前业界最极致的 Harness Engineering 落地实践。** 
它突破了传统 AI 编程助手“靠人类肉眼盯代码”的局限，创造性地引入了国际标准 **ArchiMate 3.1 架构知识图谱** 与 **多语言 AST 物理代码扫描器** 作为系统的核心“约束具（Harness）”。实现了包含 `需求澄清 ➔ 四层架构设计 ➔ 契约化编码 ➔ TDD 驱动验收 ➔ 物理级架构审计 ➔ 产物发布交付` 的端到端全生命周期防腐闭环。

---

## 🆚 行业生态位对比 (Competitive Analysis)

在高度成熟的 AI 编程时代，ARGO 与主流多智能体平台的本质差异在于 **“Harness（控制与驾驭）”的深度**：

| 维度特征 | 👨‍💻 GitHub Copilot (Agent Mode / Fleet) | 💬 Claude Code (Ultra / Agent Teams) | 🛸 **Argo (AI4PB)** |
| :--- | :--- | :--- | :--- |
| **核心定位** | 极速的代码自动化与并行修改引擎 | 终端原生的深度推理与多角色执行团队 | **基于 Harness Engineering 的端到端架构与工程操作系统** |
| **执行编排 (Orchestration)** | 聚焦开发编码阶段的单点任务 | 聚焦局部开发与测试，依赖原生推理 | **全链路状态机**：PRD ➔ 架构 ➔ 编码 ➔ 验收 ➔ 审计 ➔ 交付 |
| **状态与记忆 (State & Memory)** | 隐式工作区上下文与近期聊天记录 | 依赖自然语言通信与 Markdown 记忆文件 | **全局共享知识图谱**（结构化持久化架构、任务、状态、追溯矩阵） |
| **评估与观测 (Evaluation)** | 依赖人类 Review PR 或外部集成 | 内置 Critic Agent 进行自然语言“交叉审查” | **绝对的产验分离**：开发兵写代码，QA兵基于图谱独立TDD，宪兵进行 AST 审计 |
| **约束与纠偏 (Constraint & Recovery)**| 无内置架构约束，偏离靠人类肉眼发现 | 发现错误后通过自然语言尝试重试 | **物理级电网与熔断**：通过 AST 严格比对代码现实与图谱意图，最高 3 次重试后强制触发人类接管 |
| **人类把控力接口** | Chat 界面、Terminal 指令、Pull Request | Terminal 终端干预、共享文本修改 | **架构共驾 (EA Co-Pilot)**：人类通过修改 Enterprise Architect 图形连线实施最高统帅权 |

> *注：Agent = Model + Harness。主流大模型提供了最强的 Model（肌肉），而 ARGO 为其装备了最完美的 Harness（大脑与神经系统）。*

---

## ✨ 核心 Harness 架构与工程理念 (Core System Value)

Argo 的设计哲学是：**人类不写代码，只设计环境与契约；把 AI 当作流水线上的专业工人，把图谱作为约束边界（Harness），而人类是这家软件公司的唯一 CEO 兼总架构师。**

### 1. 🗺️ 上下文与状态管理：终结“上下文焦虑”
大模型在复杂任务中容易“失忆”和产生“幻觉”。ARGO 没有把所有规范塞进 Prompt，而是实现了基于 **ArchiMate 3.1 知识图谱** 的渐进式披露（Progressive Disclosure）。
* 系统拥有清晰的四层架构（战略、业务、应用、技术）。
* 智能体通过 `query_graph` 工具按需拉取当前所需的 IPO（Input/Processing/Output）契约，确保 AI 始终在正确的信息边界内思考。
* 所有的重试次数 (`retryCount`)、验证状态、任务状态全部持久化在底层的 JSON 状态机中，让系统具备真正长期连续工作的能力。

### 2. ⚖️ 评估与观测：绝对的“产验分离”
如同顶尖科技公司的工程最佳实践，ARGO 坚决不让写代码的 AI 自己评估自己，而是将“干活的人”和“打分的人”严格拆分：
* **`SystemArchitect` (架构师)**：负责拆解任务，制定包含严格 `[Acceptance Criteria]` 的黑盒契约。
* **`Implementation` (开发兵)**：只负责根据契约编写逻辑代码。
* **`QualityAssurance` (测试兵)**：作为独立的 Evaluator，强制提取图谱契约生成 TDD 边界测试用例。测试未覆盖架构信标，验收直接判负。
* **`Audit` (宪兵)**：作为最终的架构防线，进行代码物理结构与图谱逻辑设计的交叉拓扑审查。

### 3. 🛡️ 约束与纠偏：物理级防腐与硬核熔断 (Circuit Breaker)
在并行生成时代，AI 极易偏离最初的设计。ARGO 抛弃了用大模型去“看代码找错”的模糊做法，内置了基于硬编码提取的 **`Reality Scanner`**。
* 底层的多语言 AST 引擎（支持 TS/JS, Python, Java, Go, C# 等）会抽取代码的物理符号，并与图谱中的设计节点进行严格的数学集合比对（`Intended IDs ⊆ verifiedIntentIds`）。
* **任何未经图谱批准的越权调用、依赖污染，都会立即触发 `ARCH_IMPL_GAP`（架构实现偏差）异常。**
* 当 AI 在验证环节连续翻车 3 次，系统触发**硬核熔断**，停止无效的 Token 消耗，直接向人类统帅抛出抉择：`[已修复代码] 人类接管` 或 `[架构需重构] 打回重新设计`。

### 4. 🤝 降维打击的图形化架构共驾 (EA Co-Pilot)
大模型无法直观呈现错综复杂的系统拓扑，但 Argo 可以。
作为系统架构师，您只需点击 `SYNC TO EA`，ARGO 的图谱就会在 **Sparx Enterprise Architect** 中化作精美的可视化模型。
当您发现 AI 的架构走向混乱时，**停止闲聊，直接在 EA 画布上删除非法连线、重构组件节点**，点击 `SYNC FROM EA`。底层的 AI 智能体将立刻感知到 `human-architect` 的绝对指令印记，瞬间放弃之前的错误上下文，完全臣服于您画出的物理蓝图重新施工。

### 5. 🔙 遗留系统接管：从代码到意图的“逆向收割” (Architecture Harvesting)
当团队需要接管一个毫无文档、历史包袱沉重的陌生项目时，执行 `opencode run argo-init` 或 `argo-extract`。
ARGO 的逆向工程智能体（`ReverseEngineer` / `IncrementalReverseEngineer`）会利用底层 AST 引擎扫描整个代码库的物理拓扑，**反推并生成架构图谱与 IPO 契约**。将无序的“野生代码（虚线）”收割并凝固为受人类管控的“架构意图（实线）”，让老旧系统瞬间纳入 Harness 控制体系。

---

## 🚀 快速上手 (Get Started)

### 环境要求
*   [OpenCode 框架](https://opencode.ai/) (运行 Agent 引擎)
*   Node.js (>= 18.x)
*   Python (>= 3.9) (用于 Python AST 提取及适配器)
*   Sparx Enterprise Architect (可选，用于图形化架构共驾)

### 安装与运行
1. **注入 Argo 灵魂**：将 Argo 配置放入您的目标项目根目录。
   ```bash
   git clone <ai4pb-repo-url>
   cp -r ai4pb-orchestrator/.opencode <your-project-root>/
   ```
2. **初始化遗留项目 (接管陌生代码) `[✨NEW]`**：
   如果您接手了一个历史项目，请先执行 Argo 逆向初始化：
   ```bash
   opencode run argo-init
   ```
   *`ReverseEngineer` 将自动提取 AST，生成架构图谱，并在终端与您核对业务意图，完成项目接管。*
3. **启动主脑 Orchestrator**：
   ```bash
   opencode start
   ```
4. **下达指令**：在聊天窗口输入原始需求：“我们需要在侧边栏增加一个会话历史清空功能，并同步到云端”。主脑将立即为您拆解并启动从需求到交付的完整流水线。

---

## 👑 统帅法则：人类如何正确地驾驭 ARGO (Usage Guidelines for Human Architects)

在使用 ARGO 时，您必须抛弃传统 AI 编程助手“聊天改 BUG”的思维惯性。在 Harness Engineering 的范式下，**您的核心工作不是“检查代码”，而是“设计约束环境与契约”**。

当遇到 AI 陷入无尽的调试循环（例如：UI 表现始终不对、通信逻辑越改越乱），请严格遵循以下三大统帅法则：

### 法则一：停止“聊代码”，用“架构图与 IPO 契约”进行降维打击 
大模型在处理复杂拓扑时存在天然的空间想象力缺陷。不要用自然语言描述代码细节，ARGO 的底层智能体 100% 依赖图谱契约。
*   **❌ 错误姿势（闲聊式）**：“AI 消息显示的格式还是乱的，你再重新调一下 CSS 和解析逻辑。”
*   **✅ 正确姿势（契约与图形管控）**：
    1. **动用 EA 画布**：点击 `SYNC TO EA`，直接在 Enterprise Architect 画布上删掉混乱的连线，拆分出独立的组件。
    2. **写死 IPO 契约**：双击节点，在 `Notes` 中下达死命令。例如：“**[Input]** 接收完整的或截断的 Markdown 字符流；**[Processing]** 使用 `marked.js` 增量解析，严禁破坏 HTML DOM；**[Output]** 渲染为安全的 HTML 节点并自动滚到底部。”
    3. **一键镇压**：点击 `SYNC FROM EA`。底层 AI 会立刻顺从您的物理蓝图重新施工。

### 法则二：打破“盲目重试”循环，果断实施架构重构或物理接管
当您心里“很清楚自己要什么”，但 AI 调试多轮依然南辕北辙时，**千万不要让它继续猜**。这通常意味着当前的组件职责过载或抽象错误。请立刻在终端打断主脑 (`ProjectOrchestrator`)，实施降维干预：
*   **路径 A（架构重推）**：强制要求系统架构师重新设计。指令示例：*“停止当前开发！触发[架构需重构] 流程。@SystemArchitect，把当前臃肿的消息组件拆分为‘状态拼接引擎’和‘纯 UI 渲染器’两个 Node，重新出具 IPO 契约，我 Review 批准后才能让开发写代码。”*
*   **路径 B（人类物理接管）**：这是您的终极特权。既然脑海中已有完美代码，请直接在 IDE 里手动把核心 UI 或逻辑写好，执行 `git commit`。然后向 ARGO 下达：*“【已修复代码】，这段逻辑我已手动接管，请直接基于我的最新 Commit 进行现实扫描（Reality Scan），更新图谱并执行后续验证。”* 

### 法则三：显式声明特殊测试环境与 Mock 边界
ARGO 的质量防线极度依赖 `QualityAssurance` (测试兵) 提取图谱契约进行 TDD 测试。如果您开发的模块运行在特殊宿主中（如 Chrome 扩展、Android 设备）：
*   **✅ 统帅指令**：“在测试阶段，必须在 Chrome Sandbox 环境（调用 `run_chrome_sandbox` 工具）中 Mock `chrome.runtime.onMessage` 的流式多次触发，以严格验证 UI 组件在接收增量字符时的渲染稳定性。”
> **要诀**：指明测试边界和 Mock 预期，确保 QA 智能体能够生成真实有效的自动化验证屏障。利用极限边界测试（Boundary Tests），把意图转化为硬核的测试用例，让开发兵无法蒙混过关。

---

## 📚 核心战役推演 (System Workflow Scenarios)

### 战役 A：从模糊需求到精密架构的“人机接力” 
业务方抛出一个宏大构想。`ProductManager` 识别出约束冲突，弹出表单请求人类决策。随后 `SystemArchitect` 生成四层架构基线。人类觉得终端文字不直观，通过 `SYNC TO EA` 脚本将架构导入 Sparx EA 查看。人类在 EA 画布上拖出一个新的“Redis缓存节点”并同步回图谱。AI 架构师发现 `human-architect` 标签，立即放弃原有方案，顺从人类思路，向下方的开发兵重新派发任务。

### 战役 B：老旧祖传代码的降维接管 (Brownfield Reverse Engineering)
面对一个 5 年历史、数万行代码的单体项目，开发者运行 `opencode run argo-init`。
`ReverseEngineer` 启动底层引擎，通过 AST 提取出所有的物理类和函数，自动在图谱中生成 `ApplicationComponent`，并反向推导出包含严格 IPO 的契约。人类在终端确认推测的业务流后，系统生成架构映射文件，将“野生混沌的代码”收割凝固为“清晰的图谱实线”，后续重构如履平地。

### 战役 C：架构腐化的自动拦截 (The "Reality Drift" Correction)
程序员或 AI 为了赶进度，直接在代码里引入了核心链路的越权调用，跳过了安全校验组件，且完全没改架构图谱直接提交。
流转至 `Audit` 宪兵扫描时，底层的 `Reality Scanner` 瞬间发现 AST 调用链中出现了“越界连线”。系统立即抛出 `ARCH_IMPL_GAP` 严重异常并触发硬核熔断。主脑警告人类：要么回滚撤销代码，要么人类在图谱中正式画上这根连线批准这次“架构妥协”。

### 战役 D：测试驱动开发 (TDD) 的零门槛闭环
AI 开发兵写完一个极度复杂的算法模块后提交。`QualityAssurance` 拦截到该核心模块缺少测试覆盖。QA 并没有瞎猜，而是调用 `generate_test_template`。底层通过 Compiler 解析源码 AST，瞬间生成一个结构完美的 Jest/Pytest 测试骨架，并在断言处填满架构图谱中的 `Acceptance Criteria` 与边界条件注释。随后大模型依据这些边界条件填入真实的测试逻辑，完成严丝合缝的 TDD 闭环验收。