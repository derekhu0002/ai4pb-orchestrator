# 🚀 AI4PB: Model Driven AI for Project Building

**AI4PB** 是一个基于 **OpenCode 框架** 构建的企业级多智能体（Multi-Agent System, MAS）软件工程平台。

传统 AI 编程助手依赖脆弱的“自然语言上下文”，极易在复杂项目中产生“架构幻觉”、代码腐化以及意图脱节。**AI4PB** 创造性地引入了 **ArchiMate 3.1 架构知识图谱** 作为智能体团队的“通信总线”与“单一事实来源 (Single Source of Truth)”。通过将人类的高维架构设计无损降维成 AI 可执行的结构化契约，实现了**“左手 AI 自动生成代码，右手人类把控 EA 架构”**的终极人机共驾愿景。

---

## ✨ 核心优势与特色 (Core Advantages)

### 1. 📐 模型驱动工程 (Model-Driven MAS)
抛弃了“小作坊式”的聊天流，系统内置了一支拥有明确职责边界的专业 AI 团队：
*   **ProductManager**: 负责与人类拉扯、澄清需求，产出结构化 PRD。
*   **SystemArchitect**: 负责四层架构（战略、业务、应用、技术）设计与 Software Unit 任务拆解。
*   **Implementation**: 负责将架构契约转化为带有 `@ArchitectureID` 追踪标记的健壮代码。
*   **QualityAssurance**: 负责基于架构基线推导测试用例，并执行 TDD 闭环。
*   **Audit**: 核心特色守护者。负责严格比对“代码现实”与“架构意图”。

### 2. 🔍 意图与现实对齐 (Intention vs. Reality Audit)
系统内置强大的 `Reality Scanner`。它不仅仅通过正则表达式提取代码注释，更能利用 **Token 向量余弦相似度** 进行隐式语义追踪 (Semantic Tracing)，在无侵入的前提下，精准比对“代码实现符号”对“架构组件设计”的偏离度（ARCH_IMPL_GAP）。

### 3. 🧩 即插即用的环境、规范与语言解析 (Plug-and-Play Extensibility)
基于**开闭原则 (OCP)** 设计的动态多维扩展架构：
*   **多语言解析引擎 (Extensible AST Providers)**：底层 `Reality Scanner` 支持拔插式的抽象语法树解析器。系统已内置基于 Tree-sitter (Java/Go/C#)、TS Compiler (TS/JS) 和原生进程 (Python AST) 的解析。要支持新语言，只需注入一个实现 `extractSymbols` 的 Provider，整个 AI 团队立刻具备该语言的结构透视能力。
*   **运行环境感知**：自动识别项目类型（如 Chrome Extension, Android），动态为 Agent 加载专用的测试沙盒工具（如 `run_chrome_sandbox`），杜绝 AI 执行测试时的环境幻觉。
*   **企业规范字典**：通过读取 `.opencode/project-standards.json`，动态给 AI 注入特定公司或项目的编码规范约束（Skill）。**上述所有能力扩展，均无需修改任何核心 Agent 的 Prompt。**

### 4. 🔀 智能双轨路由 (Dual-Lane Routing)
*   **Full-Model Lane（全模型重型车道）**：针对结构性需求，严格走完 `PM -> Architect -> Dev -> QA+Audit` 的架构基线推演流程。
*   **Fast-Track Lane（敏捷快车道）**：针对 UI 微调、文案修改等局部任务，一键直达开发与测试，同时赋予 Agent “遇阻向上升级（Escalate）”的能力。

### 5. 🤝 完美的人机视觉闭环 (Human-AI Co-Pilot via EA)
支持与 **Sparx Enterprise Architect (EA)** 的双向同步。人类架构师可以一键导入 AI 生成的架构 JSON 并在 EA 中自动排版查看；也可以在 EA 中手动连线修改架构并导回 JSON。AI 团队会识别并绝对尊重带有 `human-architect` 标记的节点。

---

## 🚀 快速上手 (Get Started)

### 环境要求
*   [OpenCode 框架](https://opencode.ai/) (用于运行 Agent 引擎)
*   Node.js (>= 18.x)
*   Python (>= 3.9) (用于 Python AST 提取)
*   Sparx Enterprise Architect (可选，用于图形化架构查阅与修改)

### 安装与运行
1. **克隆项目并初始化配置**：
   将 AI4PB 的配置放入您的目标项目根目录中。
   ```bash
   git clone <ai4pb-repo-url>
   cp -r ai4pb-orchestrator/.opencode <your-project-root>/
   ```
2. **(可选) 配置企业专属规范**：
   在 `<your-project-root>/.opencode/project-standards.json` 中配置您团队的专属语言规范文件。
3. **启动 Orchestrator**：
   使用 OpenCode CLI 或宿主环境激活系统主脑。
   ```bash
   opencode start
   ```
4. **提交需求**：
   在聊天窗口中输入您的原始需求（Raw Requirement），例如：“我们需要一个可以汇率转换的 Chrome 插件”。Orchestrator 将自动将其路由至 ProductManager 开始分析。

### 与 EA 双向同步 (SYNC TO / FROM EA)
*   **导入到 EA (SYNC TO EA)**：在 EA Project Browser 中选中一个 Package，运行 `script/EA-jsscript/import_archimate31_knowledge_graph.js`。系统将自动生成布局清晰的 ArchiMate 图纸。
*   **导出回系统 (SYNC FROM EA)**：在 EA 中手动添加或修改节点/连线后，运行 `script/EA-jsscript/export_archimate31_knowledge_graph.js`。修改将被合并至知识图谱 JSON 中，并打上 `managedBy: "human-architect"` 标签，供 AI 团队读取。

---

## 📚 核心场景与系统交互 (System Workflow Scenarios)

以下场景展示了 AI4PB 系统中多智能体（MAS）之间、以及人机之间是如何通过 Tool、Skill 和知识图谱进行精密协同的。

### 场景 A：需求澄清与初始架构的“人机接力” (The "Full-Model" Path)
**📝 场景描述**：产品经理输入了一个宏大但模糊的需求：“我们需要一个网络安全新闻聚合门户”。系统不仅需要自动推演，还需要人类在关键节点进行拍板。

**🔄 交互与流转过程**：
1. **[Human 触发]**：人类向 `Orchestrator` 提交需求。
2. **需求澄清 (Orchestrator -> PM -> Human)**：
   * **AI_ProductManager** 发现需求缺少“数据源”定义，调用 `question` 工具在聊天窗口弹出表单。
   * **[Human 决策]**：人类在表单中勾选“使用 RSS 订阅源”，并点击 `Approved` 同意生成的 PRD。PM 随即将正式需求写入 JSON 图谱。
3. **架构初稿与视觉审查 (Architect -> Human via EA)**：
   * **SystemArchitect** 根据 PRD 在图谱中生成了初始的四层架构基线，并派发了初步的开发任务（如 `TASK-001: 抓取服务`）。随后弹出 `question` 等待人类审查。
   * **[Human EA 介入]**：人类觉得纯看 Markdown 架构描述不直观。于是打开 Sparx EA，运行 `SYNC TO EA` 脚本。EA 界面中瞬间生成了一张自动排版好的 ArchiMate 架构图。
   * **[Human EA 修改]**：人类在图中发现 AI 漏掉了一个“新闻缓存层”。人类直接在 EA 画布上拖出一个新的 `ApplicationComponent (Redis Cache)`，并拉了一条 `Serving` 连线指向 `新闻聚合服务`。
   * **[Human 同步]**：人类在 EA 运行 `SYNC FROM EA`。底层脚本对比增量，将新节点打上 `managedBy: "human-architect"` 标签写入 JSON。
4. **架构师顺从与重新拆解 (Human -> Architect -> Implementation)**：
   * 人类在聊天窗口回复：`Needs Revision. 我在 EA 中增加了缓存节点，请重新评估`。
   * **SystemArchitect** 重新读取图谱，看到了人类创建的 `Redis Cache` 节点。因为该节点带有 `human-architect` 标记，AI 架构师的 Skill 严格禁止其覆盖该节点。
   * 于是，AI 架构师**顺着人类的思路**，新增派发了 `TASK-002: 实现 Redis 缓存逻辑`。
5. **后续开发与审计**：代码交由 Implementation 编写，QA 生成测试框架验证，Audit 扫描代码确认代码里确实写了 `@ArchitectureID: Redis Cache`，最终交付。

---

### 场景 B：紧急局部 Bug 的极速放行 (The "Fast-Track" Hotfix)
**📝 场景描述**：线上出现紧急问题：“登录按钮在移动端重叠了，改一下 margin”。

**🔄 交互与流转过程**：
1. **[Human 触发]**：人类向 Orchestrator 发送极短的指令：“修复按钮重叠”。
2. **智能分流 (Orchestrator)**：判定为微小 Issue，将其放入 `fast-track` (快车道)。不再呼叫 PM 澄清，也不呼叫 Architect 画图谱，直接把单行任务丢给 Implementation。
3. **极速修复与异常升级 (Dev -> QA)**：
   * Implementation 直接修改 CSS 并 Commit。
   * QA 进行回归测试。
   * **⚠️ 异常升级边界 (Human Fallback)**：如果在改 CSS 时，Implementation 发现必须重构底层的全局 UI 组件库，它会主动放弃 `fast-track`，告知 Orchestrator：“影响面过大，请求切回全架构车道”。此时，系统将重新唤醒 Architect，并可能需要人类在 EA 中重新评估组件依赖。

---

### 场景 C：复杂死锁下的架构重构 (Circuit Breaker & EA Co-Pilot)
**📝 场景描述**：Architect 设计了一个存在循环依赖的模块，Implementation 怎么写代码都无法通过 Audit 的合规扫描。

**🔄 交互与流转过程**：
1. **死锁产生 (Audit <-> Implementation)**：Audit 连续打回重作的代码超过 3 次。
2. **触发熔断 (Orchestrator -> Human)**：
   * Orchestrator 拦截到 `retryCount > 3`，触发 **Circuit Breaker** 熔断。在终端向人类发出红色警报：“审计连续失败，任务阻塞，请选择恢复方案：`[已修复代码] / [架构需重构] / [忽略偏差]`”。
3. **[Human EA 破局]**：
   * 人类工程师知道大模型陷入了逻辑死胡同。打开 EA，点击 `SYNC TO EA`，看着混乱的连线，大刀阔斧地删除了错误的循环依赖，并手动引入了一个“事件消息总线 (Event Bus)”组件来解耦。
   * 连线完毕后，点击 `SYNC FROM EA`。
4. **闭环恢复 (Human -> Orchestrator -> Architect)**：
   * 人类在聊天窗口点击 `[架构需重构]` 选项。
   * Orchestrator 收到指令，清空受影响 Task 的 Block 状态，将执行权交回给 Architect。
   * Architect 看到人类新画的事件总线，立刻丢弃了之前的循环依赖方案，重新向 Implementation 下发基于消息队列的开发任务。死锁解除。

---

### 场景 D：公司专属环境与规范的无感注入 (Plug-and-Play Discovery)
**📝 场景描述**：人类开发者在一个要求极高（必须全写类型推断、必须符合 Acme 公司标准）的 Python 爬虫项目中启动了 AI4PB。

**🔄 交互与流转过程**：
1. **[Human 预置]**：人类开发者只需在项目根目录丢入一个 `.opencode/project-standards.json` 文件，注明 `python` 使用 `acme-python-guidelines`。
2. **底层扫描与挂载 (Reality Scanner)**：
   * Orchestrator 启动时，底层的 `run_reality_scanner` 扫描到 `.py` 文件，并读取了配置文件。
   * Scanner 在发给下游 Agent 的 Payload 中，默默塞入了 `recommendedSkills: ['acme-python-guidelines']`。
3. **Agent 服从规范 (Implementation / QA)**：
   * Implementation 收到 Payload，其 Prompt 强制它先去读取这篇指南。
   * 结果：大模型在写爬虫代码时，仿佛被“夺舍”了一样，自动为每一个函数加上了 Google-style 的注释和严谨的 type hints。
   * **价值**：人类不需要每次在输入框里对着 AI 咆哮“注意代码规范！！”，一切皆由底层自动调度。