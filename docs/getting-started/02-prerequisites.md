# 2. 环境与前置准备 (Prerequisites)

为了能够顺利跑通 AI4PB 闭环，你的开发工作站必须具备以下软硬件和配置前置条件。

## 2.1 架构设计端

- **Sparx Enterprise Architect (EA)**：推荐版本 15+ 或更高。用于加载 AI4PB 模板 `.feap` 并创建、维护架构图和任务体系。
- **EA JScript 支持**：默认内置。需确保你可以调用 EA 内置脚本来一键抽取 JSON。
- **(可选) MS Word 环境**：EA 中的原生部分脚本可能会涉及利用 Word 的 COM 接口生成 PDF 文档。

## 2.2 开发与 AI 终端

- **Visual Studio Code (VS Code)**：至少需要支持 LLM API 的高版本 (例如 `>=1.95.0`)。
- **GitHub Copilot & Copilot Chat**：必须安装且使用具有 Copilot 服务授权的账号进行登录。此乃引擎驱动的核心。
- **AI4PB Orchestrator 拓展**：通过本地构建 (`npm run release:vsix`) 并安装，或者从 Marketplace 下载最新的正式版（如 0.0.36+）。
- **Node.js与包管理工具**（可选但推荐）：若你需要维护 AI4PB-Orchestrator 本身，需确保本地配置 TypeScript、npm 链条环境。

## 2.3 工作区准备 (Workspace Setup)

当你在 VS Code 中打开一个空目录准备利用 AI4PB 开始新项目时，首先需要在侧边栏操作：

1. 打开 AI4PB 工作流侧边栏。
2. 点击 **初始化 EA 模板 (Initialize EA Template)** 命令。
3. 该操作将会自动向你的工作区根源释放 `EA-model-template.feap`，作为标准的企业架构建模起手点。

---
完成环境检测后，即可进入 [第三章：基于 EA 的架构建模与数据导出](03-modeling-and-export.md)。