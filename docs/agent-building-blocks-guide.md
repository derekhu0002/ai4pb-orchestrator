# 开发者指南：配置 Agent Framework Building Blocks

本文档旨在指导开发者如何将业务知识（Ontology / Knowledge Graph）转化为各主流 Agent Framework（如 AI4PB/Opencode, Claude Code, GitHub Copilot）能够读取和执行的 Building Blocks（Skill, Tool, MCP, Agent）。

## 一、 跨框架通用的抽象映射逻辑

在具体实施前，开发者需要明白业务资产体系如何映射为系统的可执行模块：

*   **业务规范 / SOP**  => 转化为 **`Skill` (技能) / `Prompt` (提示词)** (通常为 Markdown 格式)
*   **企业 API / 数据库** => 转化为 **`MCP Server` (协议服务)** (遵循 Model Context Protocol 的服务)
*   **本地脚本 / 平台动作** => 转化为 **`Tool` (工具)** (TypeScript/Python 定义的 Callable Functions)
*   **长流程任务调度** => 转化为 **`Agent` (子代理)** (带着特定 Tool 和 Skill 运行配置的 Agent Profile)

---

## 二、 具体框架的操作方法与步骤

### 1. AI4PB / Opencode / 专属 Orchestrator 架构
该范式代表了高度定制化、多代理协同的框架（例如本仓库内架构）。系统底层路由会根据模块描述 (Description) 进行动态匹配。

*   **配置 Skill (业务领域知识栈)**
    *   **设定机制**: 分布式的 `SKILL.md` 文件簇。
    *   **具体步骤**:
        1. 在 `skills/` 目录下创建一个新目录（例如 `skills/enterprise-db-query/`）。
        2. 编写 `SKILL.md`，定义 "When to Use", "How it Works" 等段落以及最佳实践。
        3. 配置 XML/YAML 标记（如 `<skill><name>...</name>...</skill>` 或 frontmatter），以供外部编排器建立索引与检索。
*   **配置 Agent (子代理编排)**
    *   **操作方法**: 定义带有 YAML 头信息的 Agent Profile Markdown 文件。
    *   **具体步骤**:
        1. 在 `agents/` 目录下新建 `my-custom-reviewer.md`。
        2. 在头部写入 YAML Frontmatter（包含关键属性：`name: CustomReviewer`, `description: 专门审查交易逻辑的代码`, `tools: [read_file, search_kg]` 等）。
        3. 主执行流通过调度机制（如 `dmux` 或 `runSubagent`）带参直接拉起该子代理模块。
*   **配置 Tool (动作执行体)**
    *   **操作方法**: 强类型 (TypeScript) 纯函数封装。
    *   **具体步骤**:
        1. 在预定工具目录（如 `.opencode/tools/` 或类似工程目录）下，按规约导出执行函数。
        2. 定义严格的 JSON Schema 描述：`export default tool({ name: "update_kg", description: "...", schema: z.object({...}) })`。
        3. 运行时系统内部会进行读取，将其转换合并给大语言模型（LLM）的系统调用参数列。

*   **操作参考链接**:
    *   [AI4PB / Opencode 官方文档](https://opencode.ai/docs/zh-cn)
    *   [Model Context Protocol (MCP) 官方规范与文档](https://modelcontextprotocol.io/)

### 2. Anthropic Claude Code (CLI 系统)
极度依赖本地文件系统（File-based）和命令行的代理架构。

*   **配置 Skill (上下文与规范)**
    *   **操作方法**: 在项目目录创建 `CLAUDE.md`或相关文件。
    *   **具体步骤**:
        1. 在项目根目录新建 `CLAUDE.md`。
        2. 将知识图谱中抽取的本体要求转化为自然语言写入该文件（例如：“本项目使用 pnpm，严格遵守 TDD 测试驱动驱动标准”）。
        3. 开发者在终端唤起 `claude` 命令时，引擎会自动将其内容注入底层的第一段 System Prompt 中。
*   **配置 MCP (接入企业本地知识 / API)**
    *   **操作方法**: 修改 CLI 全局配置文件。
    *   **具体步骤**:
        1. 找到该宿主机的全局配置路径 `~/.claude.json`。
        2. 在 `"mcpServers"` JSON 节点下挂载研发好的 MCP 服务进程。例如：
           ```json
           "mcpServers": {
             "enterprise-kg-mcp": {
               "command": "node",
               "args": ["/path/to/your/knowledge-graph-mcp/build/index.js"]
             }
           }
           ```
        3. 重新启动你的工程终端，引擎即可获得查询企业 Knowledge Graph 的能力体系。

*   **操作参考链接**:
    *   [Claude Code 项目配置与 CLAUDE.md 使用指南](https://github.com/ChrisWiles/claude-code-showcase)
    *   [Claude Code MCP Server 配置文档](https://code.claude.com/docs/en/mcp)

### 3. GitHub Copilot (IDE 深度集成)
偏向编辑器宿主环境内的深层次集成，Building Blocks 配置依赖工作区设置与 Extension API 规范。

*   **配置 Skill (上下文预指引)**
    *   **操作方法**: 使用内置约定的指令文件和上下文变量引用 (`#`)。
    *   **具体步骤**:
        1. 在当前工作区根目录创建 `.github/copilot-instructions.md`，对话启动时默认会隐式读取它。
        2. 对于特定领域的技能库（如安全审计），可以保存在 `.github/skills/audit.md` 中，按需在主对话框敲击 `#file audit.md` 动态将规范约束入会话。
*   **配置 Tool / Sub-Agent**
    *   **操作方法**: 作为 VS Code Extension 中的 `Chat Participant` 或 `@Tool` 来开发。
    *   **具体步骤**:
        1. 注册新的会话引擎主体：`vscode.chat.createChatParticipant('my.businessAgent', handler)`。
        2. 为该参与者挂载具体的执行命令和 Callable Tools：利用 `vscode.lm.registerTool()` 等最新 API 实现。
        3. 团队成员可在 IDE 辅助窗通过 `@my.businessAgent` 专属语法来发起专业指令调度。

*   **操作参考链接**:
    *   [配置 GitHub Copilot 自定义指令 (Custom Instructions)](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
    *   [VS Code Extension Chat API 开发指南 (Chat Participants & Tools)](https://code.visualstudio.com/api/extension-guides/chat)

### 4. OpenClaw (通用泛操作与 UI 自动化代理框架)
区别于专门用于生代码的引警，OpenClaw 是通用跨域端侧代理框架（General-purpose UI/task automation agent framework），它将大模型的图谱推理转换为浏览器控制、桌面UI操作和流水线自动化等泛化任务。

*   **配置 Skill (业务 SOP 与工作流规范)**
    *   **操作方法**: 定义面向特定任务的 标准作业程序(SOP) Profile 文件或 YAML/Json 配置。
    *   **具体步骤**:
        1. 将由 Knowledge Graph 或业务专家梳理的步骤（如“财务报表审核流程”）转换为清晰的 Markdown/YAML SOP 清单（例如提取数据 -> 交叉比对 -> 填写表单）。
        2. 将此 SOP 加载到 Agent 的 System Prompt 中，明确其所处业务域的上下文边界和 UI 交互原则。
*   **配置 Tool (端侧与 UI 节点控制套件)**
    *   **操作方法**: 封装基于 Playwright (浏览器) / PyAutoGUI (桌面) / 或 CV (计算机视觉) 的控制器。
    *   **具体步骤**:
        1. 针对各种终端开发暴露原生的 JSON Function 接口，如 `click_element(selector)`, `scan_screen_for_text(text)`, `input_text(field_id, value)`。
        2. 使用严格类型将这些函数的 Schema 注册到 LLM（充当操作世界的手脚），让 OpenClaw 的推理引擎可以在 JSON 模式下安全输出操作指令。
*   **配置 MCP (连接外部系统数据)**
    *   **操作方法**: 创建 MCP Servers 获取企业 CRM、ERP 或其他数据源状态。
    *   **具体步骤**:
        1. 开发 `get_customer_record` 等 MCP 工具。
        2. 在 OpenClaw Agent 尝试执行复杂的 UI 点击（如修改客户状态）之前，框架先通过 MCP 获取背景事实，确保“模拟人工点击 / 输入”完全基于可信数据源（Knowledge Graph）。

---

## 三、 给技术管理者的落地建议：资产转译产线

为了在复杂企业内做到真正的 `业务 Ontology -> 知识图谱 Knowledge Graph -> 执行组件 Agent Execution` 的宏大闭环，强烈建议研发团队搭建标准的 **“资产转译产线 (Asset Translation Pipeline)”**：

1.  **Level 1 (初级注入)**：业务架构师/专家在可视化的知识图谱系统（KG）中更新了某项业务强规则（如“支付服务全链路必须做幂等”）。
2.  **Level 2 (系统同步)**：团队构建自动化 CI/CD 脚本，定期将 KG 中的新规则拉取并转化生成各大引擎都能识别的 `.md` 内容（例如自动覆写合并主干的 `CLAUDE.md` 或者更新对应微服务的 `skills/payment-audit/SKILL.md`）。
3.  **Level 3 (深层挂载)**：利用建立的 MCP 服务器直接代理企业内部的架构知识库系统。此时大模型不再需要低效地阅读所有的 `SKILL.md`，只要在代码分析时遇到包含支付有关的关键词逻辑，模型能够自动决策触发 `mcp_query("企业支付架构约束")` —— 真正实现从**顶层业务本体**到**末端代码执行组件**的自动化、实时化协同体系。