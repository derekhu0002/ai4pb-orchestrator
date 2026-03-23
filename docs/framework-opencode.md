# Opencode: 智能编程与编排框架

## 1. 业务定位
**Opencode** 是 Agent Framework 架构的一个高度可定制的实例化引擎实例。它作为整个 AI Agent 系统的核心调度引擎，专门针对深度二次开发、企业规范落地和代码工程自动化而设计。

## 2. 核心架构与机制
在继承了通用 Agent Framework 所有特性的基础上，Opencode 展现了极强的企业级定制能力：

- **持久化语义记忆 (Memory)**
  - Opencode 支持对用户记忆 (userMemory)、会话记忆 (sessionMemory) 以及仓库代码规范记忆 (repoMemory) 的动态读写。
  - **价值**: 通过持久化沉淀规则和偏好，确保 AI 在跨会话中保持行为一致性，避免在同一项目中重复犯错。
- **定制化宏模板 (Custom Prompts)**
  - 动态读取和执行宏模板 (`.prompt.md`)，用于规范化地初始化会话或格式化输出结构。
  - **价值**: 强制将个人的交互收敛到组织的 标准作业程序 (SOP) 中（例如规范化的周报生成、任务拆解等）。
- **完全解耦的应用外壳 (OpencodeAgentApplication)**
  - 提供 API、CLI 甚至 Web 界面的应用层封装，方便通过 Opencode Serve 等形式与企业的商业应用（Business Application）集成。
- **极致的 MCP 与本体 (Ontology/GraphRAG) 集成**
  - Opencode 设计上对 MCP（模型上下文协议）尤为友好，能够对接企业知识图谱 (Knowledge Graph) 与底层本体 (Ontology)，以此构建极少幻觉的 RAG 检索引擎，让操作完全绑定于企业真实业务域。

## 3. 适用场景
高度定制化的软件研发、私有代码库安全开发、基于图谱的企业级数字资产管理平台构建。
