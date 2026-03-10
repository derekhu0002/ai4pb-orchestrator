# 3. 基于 EA 的架构建模与数据导出 (Modeling & Export)

在开发或迭代的最初阶段，所有的需求解析和结构设计均应首先在 Sparx EA 中收口，再流通给后端的 AI 引擎。

## 3.1 架构分层体系 (Architecture Layers)

根据 ArchiMate 标准与 AI4PB 的最佳实践，你需要进行分层次的建模：
- **Strategy & Motivation**：目标与战略。
- **Business Layer**：业务流程 (BusinessProcess)、业务节点；这定义了我们要*做什么*流程。
- **Application Layer**：应用服务 (ApplicationService)、应用组件 (ApplicationComponent) 与数据对象 (DataObject)；这定义了用*什么软件实体*去支撑。
- **Technology Layer**：技术组件系统 (SystemSoftware、Nodes 等)。
![[Pasted image 20260310130404.png]]

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
2. 运行脚本：`project_auto_gen_suitable_for_LLM-V2-bootstrap.js`。
   - 使用 bootstrap 模式可以确保所有模型使用的抽取逻辑一致并自动寻址到 `.vscode` 或者本地扩展安装点中的真实验本。
3. 检查生成产物：
   - 脚本将成功输出带有任务体系的 JSON 至 `design/KG/SystemArchitecture.json` （核心约束路径）。
   - 与此同时导出专门的任务文件 `design/tasks/taskandissues_for_LLM.json`。
![[Pasted image 20260310130733.png]]

至此，大语言模型进行精准“AI生成”所需的前置语料已经储备完毕！接下来可以在开发环境使用插件将这些架构直接注入对话窗口。