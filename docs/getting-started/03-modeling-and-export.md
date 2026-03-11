# 3. 基于 EA 的架构建模与数据导出 (Modeling & Export)

在开发或迭代的最初阶段，所有的需求解析和结构设计均应首先在 Sparx EA 中收口，再流通给后端的 AI 引擎。

## 3.1 架构分层体系 (Architecture Layers)

根据 ArchiMate 标准与 AI4PB 的最佳实践，你需要进行分层次的建模，以确保系统的每个关注点（Concern）得到独立且完整的呈现：
![[Pasted image 20260310130404.png]]

- **Archimate建模语言映射的本体结构**:
-实体：
![alt text](docs/getting-started/image-3.png)
-关系：
![alt text](docs/getting-started/image-4.png)

- **Strategy & Motivation (战略与动机层)**：
![alt text](docs/getting-started/image-5.png)
  - **概念模型**：包含 `Goal` (目标), `Requirement` (需求), `Principle` (原则), `Constraint` (约束) 等。
  - **核心作用**：定义系统“为什么”要这么做。AI 助手将遵循其中的 `Principle` 和 `Constraint` 生成代码，以符合架构准则。

- **Business Layer (业务层)**：
![alt text](docs/getting-started/image-6.png)
  - **概念模型**：包含 `BusinessProcess` (业务流程), `BusinessActor` (业务角色), `BusinessService` (业务服务) 等。
  - **核心作用**：定义我们要“做什么”流程以及谁在参与。它勾勒了业务的真实运转脉络，并为后续的应用设计提供边界参考。

- **Application Layer (应用层)**：
![alt text](docs/getting-started/image-7.png)
  - **概念模型**：包含 `ApplicationComponent` (应用组件), `ApplicationService` (应用服务), `ApplicationInterface` (应用接口), `DataObject` (数据对象) 等。
  - **核心作用**：定义用“什么软件实体”去支撑业务运作。这是 AI 助手重点关注的一层，代码中的模块、类、或微服务通常会与 `ApplicationComponent` 直接形成 Traceability（代码追溯）映射。

- **Technology Layer (技术层)**：
![alt text](docs/getting-started/image-8.png)
  - **概念模型**：包含 `Node` (计算节点), `SystemSoftware` (系统软件, 如数据库/中间件), `Artifact` (部署伪影) 等。
  - **核心作用**：定义应用运行在“什么物理或基础软件环境”之上。帮助规划 CI/CD 部署、服务依赖、环境隔离等工程运维诉求。

> **提示：** 架构的分层不仅仅是画图，在 AI4PB 理念下，这些层级上的每一个组件模型都会作为一种“上下文屏障”，控制大模型生成代码时的视野，避免被全局复杂度淹没（即所谓的 *Progressive Disclosure 渐进式揭示* 原则）。

## 3.2 派发任务与指派 LLM (Tasks & Issues)

本流程的独家特色是把敏捷开发与模型元素绑定：
1. 双击模型元素（比如 `FeatureA Component`）。
2. 在该元素的属性 / 项目 (Project) 面板中添加 `Requirement`、`Task` 或 `Issue`。
3. **关键参数配置**：
   - `Name`: 包含针对 AI 的简短可执行指示（如“请帮我实现基于 Flask 的用户查询接口”）。
   - `Type`: 选为 `TODO` (表示新规划) 或 `Issue` (表示缺陷或修改)。
   - `Status`: 必须设定为 `Active` 才会流向处理环节！
   - `Assigned To`: 高度推荐设为 `llm`（代表你要委派给 Copilot 完成）。
![[Pasted image 20260310130656.png]]

## 3.3 导出为机器可读上下文 (知识图谱 JSON)

AI 无法直接阅读二进制 `.feap`。我们需要用附带的 JS 脚本：

1. 在 EA 中，选择你需要抽取的顶层包或关系图。
2. 运行脚本：右键点击顶层`SystemArchitecture`视图，在弹出菜单中点击`project_auto_gen-FOR-LLMV2`子菜单。
3. 检查生成产物：
   - 脚本将成功输出带有任务体系的 JSON 至 `design/KG/SystemArchitecture.json` （核心约束路径）。
   - 与此同时导出专门的任务文件 `design/tasks/taskandissues_for_LLM.md`。
![[Pasted image 20260310130733.png]]

至此，大语言模型进行精准“AI生成”所需的前置语料已经储备完毕！接下来可以在开发环境使用插件将这些架构直接注入对话窗口。