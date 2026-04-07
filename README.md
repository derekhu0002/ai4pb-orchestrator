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

## 📚 核心场景与系统交互文档 (System Workflow Scenarios)

以下场景展示了 AI4PB 系统中多智能体（MAS）之间、以及人机之间是如何通过 Tool、Skill 和知识图谱进行精密协同的。

### 场景 A：全新结构性特性的开发 (The "Full-Model" Path)
**📝 场景描述**：人类产品所有者输入了一个宏大但模糊的需求：“我们需要一个网络安全新闻聚合门户”。系统需要走完整的架构驱动流程。

**🔄 交互与流转过程**：
1. **触发 (Human -> Orchestrator)**：人类发起需求。
2. **需求澄清 (Orchestrator -> PM)**：Orchestrator 将请求判定为 `Requirement` 且归入 `full-model` 车道，委派给 **AI_ProductManager**。
   * **[Skill/Tool]**: PM 使用 `product-manager-analysis-cycle` 技能，发现需求缺少“用户角色”和“数据源”，调用 `question` 工具在终端弹出选项，要求人类补充。
   * **[图谱落库]**: 达成共识后，PM 调用 `update_graph_model` 将正式 PRD 写入知识图谱。
3. **架构设计 (Orchestrator -> Architect)**：Orchestrator 将目标传递给 **SystemArchitect**。
   * **[Skill/Tool]**: Architect 调用 `analyze_legacy_modules`（基于 AST 语义向量），评估老代码库中是否有合适的模块。发现没有，于是决定新建 `Software Unit`。
   * **[图谱落库]**: Architect 调用 `update_graph_model` 创建四层架构基线，派发开发任务。调用 `question` 让人类审查架构文档。
4. **代码实现 (Orchestrator -> Implementation)**：
   * **[Skill/Tool]**: Implementation 读取图谱进行开发，并在代码头上标注 `@ArchitectureID: ELM-APP-NEWS` 进行物理追踪。
5. **双轨验证 (Orchestrator -> QA & Audit)**：
   * **[QA 侧]**: QA 发现缺少单元测试，调用 `generate_test_template` 生成测试骨架，补全测试逻辑后运行。
   * **[Audit 侧]**: Audit 调用 `run_reality_scanner` 扫描代码库，比对图谱意图，验证架构合规性。
6. **发布 (ReleaseAgent)**：生成 Release Log。

---

### 场景 B：紧急局部 Bug 修复 (The "Fast-Track" Hotfix)
**📝 场景描述**：线上出现紧急问题，用户提交 Issue：“登录按钮在移动端重叠了，改一下 margin”。

**🔄 交互与流转过程**：
1. **触发 (Human -> Orchestrator)**：人类发起 Issue。
2. **智能分流 (Orchestrator)**：Orchestrator 判定这是 `Issue`，且影响极小，归入 `fast-track` (快车道)。
   * **[Tool]**: 直接调用 `decompose_goal(maxTasks=1)` 在图谱中生成一个轻量级任务。
3. **极速修复 (Orchestrator -> Implementation)**：
   * **[Skill]**: Implementation 接收到 `lane: "fast-track"` 指令。直接定位文件修改 CSS，提交代码上报 Done。不需要强行走架构设计。
4. **轻量验证与异常升级 (Escalation)**：
   * Orchestrator **跳过 Audit 审计**，只让 QA 验证。
   * **⚠️ 升级机制**：如果 Implementation 发现改 CSS 会破坏底层公用组件结构，必须停止快车道向 Orchestrator 报错，系统将自动切换为 `full-model` 车道，拉起 Architect 介入重构。

---

### 场景 C：公司专属环境与规范的无缝注入 (Plug-and-Play Discovery)
**📝 场景描述**：接手一个具有特殊环境（如 Chrome Extension）并要求执行 Acme 公司严格 Python 规范的外包项目。

**🔄 交互与流转过程**：
1. **自动侦测 (Reality Scanner)**：
   * 系统在根目录发现 `manifest.json` 和 `.opencode/project-standards.json` 配置。
2. **动态装载 (Orchestrator -> Dev/QA)**：
   * Scanner 向 Orchestrator 返回 `environment: chrome-extension` 以及推荐的技能 `['acme-python-guidelines', 'chrome-extension-testing']` 和测试工具 `['run_chrome_sandbox']`。
   * Orchestrator 充当“上下文路由器”，将这些数组透传给 Dev 和 QA。
3. **被约束的执行 (Implementation / QA)**：
   * **[Skill 强制规则]**: Dev 和 QA 收到数组后，必须强制调用 `skill` 工具加载这些文档。
   * **[效果]**: LLM 在写代码时自动遵循 Acme 规范写类型提示；在 QA 时，不再幻觉去敲 `npm test`，而是聪明地调用了专供 Chrome 插件的 `run_chrome_sandbox` 测试引擎。系统核心代码 0 修改。

---

### 场景 D：架构死锁与人机共驾 (Circuit Breaker & EA Co-Pilot)
**📝 场景描述**：Architect 设计了一个存在循环依赖的架构，代码始终无法通过 Audit 的合规检查。

**🔄 交互与流转过程**：
1. **死锁产生 (Audit <-> Implementation)**：Audit 连续打回重作的代码超过 3 次。
2. **触发熔断 (Orchestrator -> Human)**：
   * **[Skill 机制]**: Orchestrator 拦截到 `retryCount > 3`，触发 **Circuit Breaker** 熔断，弹窗请求人类介入，提供三个选项：`[已修复代码] / [架构需重构] / [忽略偏差]`。
3. **人类 EA 介入 (Human -> EA Tool)**：
   * 人类在 Sparx EA 中点击 **SYNC TO EA**，自动排版显示糟糕的死循环架构。
   * 人类在图形界面中重构节点和连线，点击 **SYNC FROM EA**。
   * **[Tool 响应]**: `export_...js` 脚本采用增量合并，将新画的节点打上 `managedBy: "human-architect"` 标签保存回 JSON。
4. **闭环恢复 (Human -> Orchestrator -> Architect)**：
   * 人类选择 `[架构需重构]`。
   * **[Skill 强制规则]**: Architect 重新唤醒并读取图谱。它的 Prompt 严格禁止其删除带有 `human-architect` 的节点。于是它乖乖地基于人类重构好的图谱网络，重新派发任务，成功解除死锁。

---

### 场景 E：多语言解析架构的动态扩展 (Extending AST Parsers)
**📝 场景描述**：公司决定使用 **Rust** 重构一个高性能模块。系统原本不具备 Rust 的深层语义解析能力，导致 Architect 和 Audit 无法进行有效的 AST 分析和 TDD。

**🔄 交互与流转过程**：
1. **引擎扩展 (DevOps Engineer)**: 开发人员只需在 `lib/realityScanner/providers` 中实现一个基于 Tree-sitter 的 `RustLanguageProvider`。
2. **注册生效 (Registry)**: 在 `languageRegistry.ts` 中将 `.rs` 后缀绑定至新解析器。
3. **智能分析 (Scanner & QA)**:
   * **Audit** 再次扫描时，底层自动调用 Rust 解析器，精准提取 `struct`, `impl`, `fn` 的结构与签名。
   * **QA** 发现缺测试，调用 `generate_test_template`。该工具根据提取的 AST，自动生成完美的 Rust `#[cfg(test)]` 测试骨架。
4. **[零成本适配]**: 从始至终，Orchestrator, SystemArchitect, Implementation, QA 的 Prompt 和主流程逻辑未修改一行代码，彻底践行 OCP（开闭原则）。
