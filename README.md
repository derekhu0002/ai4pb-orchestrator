# 🚀 AI4PB: Model Driven AI for Project Building

**AI4PB** 是一个基于 **OpenCode 框架** 构建的企业级多智能体（Multi-Agent System, MAS）软件工程平台。

传统 AI 编程助手依赖脆弱的“自然语言上下文”，极易在复杂项目中产生“架构幻觉”、代码腐化以及意图脱节。**AI4PB** 创造性地引入了 **ArchiMate 3.1 架构知识图谱** 作为智能体团队的“通信总线”与“单一事实来源 (Single Source of Truth)”。通过将人类的高维架构设计无损降维成 AI 可执行的结构化契约，实现了 **“左手 AI 自动生成代码，右手人类把控 EA 架构”** 的终极人机共驾愿景。

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
## 🧠 核心引擎：ArchiMate 3.1 架构知识图谱 (The Knowledge Graph Engine)

AI4PB 之所以能超越传统的 Auto-Coding 工具，根本原因在于它**彻底抛弃了“用长文本 Prompt 传递项目上下文”的脆弱做法**。取而代之的是一个严格遵循 **The Open Group ArchiMate 3.1 Exchange Model** 标准的 JSON 知识图谱（`SharedKnowledgeGraph.archimate3.1.json`）。

这个图谱是整个 MAS 系统的**中枢神经**和**唯一事实来源 (Single Source of Truth)**。

### 1. 严谨的本体论设计 (Ontology & Schema)
图谱不仅仅是简单的 Key-Value 存储，它是一个具备严密语义约束的有向图：
*   **四层架构基线**：强制要求包含 `Strategy` (如 Goal, Capability)、`Business` (如 BusinessProcess, BusinessActor)、`Application` (如 ApplicationComponent, DataObject) 和 `Technology` (如 Node, Artifact) 四个维度的节点。
*   **语义化连线**：节点之间必须使用 ArchiMate 标准的连线类型（如 `Realization`, `Serving`, `Access`, `Flow`），清晰表达组件间的控制流与数据流。
*   **MAS 专属扩展 (Extensions)**：在标准的 ArchiMate Schema 基础上，我们通过 `extensions.ai4pb` 字段，将多智能体运行时的状态（如 `Task`, `Issue`, `ReleaseLog`, `retryCount`, `managedBy`）无缝挂载到架构节点上。

### 2. 智能体协作的“通信总线” (The Communication Bus)
在 AI4PB 中，Agent 之间**极少直接对话**。它们通过读写图谱来完成协作：
*   **PM Agent** 将需求转化为 `Requirement` 节点写入图谱。
*   **Architect Agent** 读取 `Requirement`，生成 `ApplicationComponent`，并派生出挂载在组件上的 `WorkPackage` (Task) 节点。
*   **Implementation Agent** 认领状态为 `ToDo` 的 Task 节点，阅读其关联的架构上下文，写完代码后将 Task 状态更新为 `Done`，并附上 Git Commit ID。
*   **QA / Audit Agent** 扫描图谱中 `Done` 状态的 Task，提取其关联的 `ApplicationComponent`，进行精准的局部验证。

### 3. 物理级的“意图与现实对齐” (Traceability)
知识图谱是“意图 (Intention)”，代码仓是“现实 (Reality)”。
*   **正向约束**：开发者（或 AI）在编写代码时，必须在核心类/函数上添加 `@ArchitectureID: ELM-APP-NEWS` 注释，或者在 `architecture-mapping.yaml` 中声明映射。
*   **逆向扫描**：`Reality Scanner` 会解析代码的 AST，提取出所有的物理符号（类名、函数签名），并与图谱中的 `ApplicationComponent` 进行比对。如果发现代码中存在未在图谱中定义的越权调用，或者图谱中定义的组件在代码中找不到对应实现，系统将立即抛出 `ARCH_IMPL_GAP` 异常。

### 4. 捍卫人类主权 (Defending Human Sovereignty)
图谱是人机共驾的终极桥梁。
*   当人类在 Sparx EA 中手动修改架构并导出 JSON 时，脚本会自动为这些节点打上 `managedBy: "human-architect"` 的标签。
*   **SystemArchitect Agent** 的底层 Skill 被严格限制：**绝对禁止覆盖、删除或篡改带有 `human-architect` 标记的节点**。AI 只能在人类画好的骨架上进行填空和派发任务。这确保了在极其复杂的企业级项目中，人类架构师始终拥有最高控制权。

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

## � 扩展指南 (Extension Guides)

以下指南详细说明了如何在不修改任何核心 Agent Prompt 的前提下，扩展 AI4PB 的三大可插拔能力：

| 指南 | 说明 |
|------|------|
| [如何扩展抽象语法树提取](docs/guide-extending-ast-providers.md) | 为 Reality Scanner 添加新语言的 AST 解析器，使整个 AI 团队获得该语言的结构透视能力 |
| [如何扩展编码规范](docs/guide-extending-coding-standards.md) | 通过 `project-standards.json` + Skill 文件注入企业或项目专属的编码规范 |
| [如何扩展测试工具](docs/guide-extending-testing-tools.md) | 添加新测试框架支持、自定义测试沙盒环境、配置覆盖率验证规则 |

---

## �📚 核心场景与系统交互 (System Workflow Scenarios)

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


### 场景 E：异构多端项目的多环境沙盒联调 (Polyglot & Multi-Environment Sandbox)
**📝 场景描述**：一个全栈项目包含了一个 Node.js 的管理后台（TypeScript）和一个用于前端采集的 Chrome 插件（JavaScript）。人类要求：“在插件里加个一键把页面数据发给后台的功能”。

**🔄 交互与流转过程**：
1. **智能环境侦测 (Reality Scanner)**：
   * Orchestrator 接收需求后，调用 `run_reality_scanner`。Scanner 遍历文件树，同时发现了 `package.json`（含 Express）和 `manifest.json`（含 V3 声明）。
   * Scanner 返回了两个环境配置：`languageSupport: ['typescript', 'javascript']`，以及 `detectedEnvironments: ['chrome-extension']`。
2. **多端架构切分 (Architect)**：
   * SystemArchitect 读取需求和环境后，在图谱中创建了两个 `ApplicationComponent`：一个标记为 Backend API，一个标记为 Chrome Content Script，并建立了一条 `Flow` 连线。
   * Architect 派发了两个独立的任务：`TASK-01 (Backend)` 和 `TASK-02 (Extension)`。
3. **环境隔离测试 (QA)**：
   * QA Agent 拿到 `TASK-01` 时，识别到它是纯 TS 后端任务，调用 `generate_test_template` 生成了 `jest` 测试骨架，并在普通 Node 环境中运行 `npm test`。
   * QA Agent 拿到 `TASK-02` 时，识别到它属于 `chrome-extension` 环境，其 Prompt 强制它加载了 `chrome-extension-testing` 技能。QA 放弃了 `npm test`，转而调用 `run_chrome_sandbox` 工具。
   * **[效果]**：沙盒自动 Mock 了 `chrome.runtime.sendMessage` API。大模型在沙盒里成功验证了前端发信逻辑，完美避免了“大模型不知道怎么在命令行里测浏览器插件”的死穴。

---

### 场景 F：老旧祖传代码的重构与解耦 (Brownfield Semantic Refactoring)
**📝 场景描述**：人类接手了一个 5 年前写的巨大单体 Java 项目，代码里全是几千行的 God Class（上帝类）。人类下达指令：“把用户扣费逻辑从 `OrderManager.java` 里抽出来，做成独立的结算模块”。

**🔄 交互与流转过程**：
1. **语义追踪与锚点定位 (Architect -> Scanner)**：
   * SystemArchitect 并不急于写代码，它调用了强化后的 `analyze_legacy_modules`。
   * 工具底层调用 AST 解析器，将 `OrderManager.java` 拆解成了几十个 `StructuralSymbol`（方法签名），并将人类的意图（“用户扣费”）转化为 Token 向量。
   * 工具通过余弦相似度（Cosine Similarity），精准计算出 `OrderManager.calculateTax()` 和 `OrderManager.deductBalance()` 这两个方法的得分最高。
2. **手术刀式的任务拆解 (Architect)**：
   * Architect 在图谱中新建了一个 `ApplicationComponent`（`Billing Module`），并生成了 `TASK-101: Extract deductBalance to Billing Module`。
   * 任务描述中精准附带了目标文件的路径和高分函数签名。
3. **[Human EA 审查]**：
   * 人类在 EA 中点开同步后的图谱，看到 Architect 将 `Billing Module` 连向了 `Payment Gateway`。人类审查后觉得逻辑非常清晰，点击 `[Approved]` 放行。
4. **受限的实现与审计 (Implementation -> Audit)**：
   * Implementation 根据精确的函数签名进行代码搬运，并在新类上打好 `@ArchitectureID`。
   * Audit Agent 扫描新代码，确认老的 God Class 变瘦了，新模块和架构图完美对应。一次无痛的深水区重构完成。

---

### 场景 G：人类偷懒导致的代码与架构脱节 (The "Reality Drift" Correction)
**📝 场景描述**：半夜服务器报警，人类程序员为了赶时间，直接在 IDE 里改了代码：把原本应该走 `RedisCache` 的数据，直接用硬编码连到了 `MySQLDatabase`，并且直接 `git push` 上线了，完全没改 EA 架构图。

**🔄 交互与流转过程**：
1. **自动审计拦截 (Orchestrator -> Audit)**：
   * 第二天早上，CI/CD 流水线触发了 AI4PB 的日常审查（或者 Orchestrator 被定时唤醒执行 Sprint 总结）。
   * Audit Agent 调用 `run_reality_scanner` 对比最新的 Git Commit 和当前的 JSON 知识图谱。
2. **发现架构偏移 (ARCH_IMPL_GAP)**：
   * Scanner 的 AST 分析显示，代码中出现了从 `UserQueryService` 直接到 `MySQLConnection` 的调用符号（Semantic Trace 或代码依赖分析），而图谱中这两者之间本应该隔着一个 `RedisCache` 节点。
   * 并且，新代码上没有找到任何合法的 `@ArchitectureID` 追踪标记。
3. **警报与逆向修复 (Audit -> Architect -> Human)**：
   * Audit 在图谱中生成了一个严重级别的 `ArchitectureGap` Issue，并将状态抛给 Orchestrator。
   * Orchestrator 将 Issue 路由给 SystemArchitect。
   * Architect 分析后发现代码已经被提交成了“既定事实”。它向人类发出 `question`：“发现未授权的越级数据库访问。方案 A：回滚代码并重新派发开发任务；方案 B：认可该临时修复，我将修改图谱以匹配代码现实”。
4. **[Human 决策]**：
   * 人类心虚地选择了“方案 B”。
   * Architect 随即调用 `update_graph_model`，在图谱中补上了一条 `UserQueryService -> MySQL` 的 `Bypass` 连线，使得“意图”向“现实”妥协，系统恢复一致性。

---

### 场景 H：测试驱动开发 (TDD) 的全自动闭环 (The TDD Zero-to-Hero)
**📝 场景描述**：一个刚转入 TypeScript 栈的新手开发者（或 AI Agent 自己）写完了一个极度复杂的数学算法模块 `src/utils/mathMatrix.ts`，但根本不知道怎么配置 Jest 来写单元测试，直接提交了代码。

**🔄 交互与流转过程**：
1. **覆盖率红线拦截 (QA)**：
   * QA Agent 接收到验证任务，调用 `generate_test_cases` 检查覆盖率。
   * 工具依据“只要是 `@ArchitectureID` 绑定的核心模块，必须有 `.spec.ts` 对应”的硬性规则，抛出阻断异常：“Coverage missing for `mathMatrix.ts`”。
2. **骨架生成 (QA -> Tool)**：
   * QA Agent 没有像无头苍蝇一样自己瞎编测试文件，而是强制调用了 `generate_test_template(sourceFile="src/utils/mathMatrix.ts", testFramework="jest")` 工具。
   * 工具在底层用 TS Compiler 解析了该文件，提取出了导出的 `class Matrix` 和 `function inverse()`，并瞬间返回了一个完美的 Jest 代码骨架（包含正确的 `import` 路径、`describe` 块和带 `// TODO: Mock` 的空测试例）。
3. **填空与跑通 (QA)**：
   * QA Agent 用 `write` 工具把骨架保存为 `mathMatrix.spec.ts`。
   * 随后，QA Agent 的大模型能力