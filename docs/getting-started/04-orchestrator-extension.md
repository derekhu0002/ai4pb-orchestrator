# 4. AI4PB Orchestrator 扩展基础 (VS Code Extension)

**AI4PB Orchestrator** 扩展是将模型 JSON 数据与 VS Code 中的 AI 编码执行环境连接起来的核心“桥梁组件”。当前它既对接 GitHub Copilot，也对接 OpenCode，并把两者统一纳入同一套架构驱动工作流。

## 4.1 UI 与侧边栏交互

安装扩展后，VS Code 左侧活动栏将出现 **AI4PB DEV** 图标。点击该图标后，当前界面会显示以下动作分组：

- **环境配置**
  - `EA模板初始化`
  - `初始化AICodingAgent配置`
  - `EA导出参数配置`
  - `参数查询`
- **计划与汇报流程**
  - `提取任务`
  - `待办梳理`
  - `周报输出`
- **执行支持流程**
  - `执行支持`
- **SCRUM敏捷开发流程**
  - `待办梳理`
  - `迭代启动`
  - `问题反馈`
  - `问题处理`
  - `迭代收尾`
  - `提交总结`
- **设计审计流程**
  - `设计审计`
![[Pasted image 20260323222821.png]]

当你点选其中任意节点，扩展会根据动作类型执行不同路径：

- 对 Prompt 型工作流动作，自动拼装技能引用、架构上下文路径和种子指令后发给 Copilot 或 OpenCode
- 对配置型动作，直接打开初始化、参数配置或查询逻辑
- 对 `问题反馈`，打开专用反馈编辑页，等待填写 `ResolverNotes` 后确认写回

## 4.2 导出选项配置 (.aicodingconfig)

位于项目根目录下的 `.aicodingconfig` 或 `.aicodingconfig.json`，是控制扩展、EA 抽取脚本以及 OpenCode 路由行为的统一配置文件。

示例：
```json
{
  "EA_AUTOGEN_CONFIG": {
    "needallmaintenace": "onlyActive",
    "needbrowserlocation": true,
    "maintenacetype": "forllm"
  },
  "AGENT_ROUTER_CONFIG": {
    "default_agent": "copilot",
    "task_specific_agents": {
      "task-list": "opencode"
    },
    "opencode": {
      "transport": "server",
      "executionHost": "wsl",
      "timeoutMs": 600000,
      "server": {
        "baseUrl": "http://127.0.0.1:4096",
        "directory": "{workspaceRoot}",
        "sessionTitle": "AI4PB {label}"
      }
    }
  }
}
```
- `needallmaintenace`: 控制抽取出来的任务状态（`onlyActive` 是主流做法，以缩小发给 Copilot 的 Token 体积并将精力集中于当期 Sprint）。
- `maintenacetype`: 聚焦将 `Assigned To` 为 `forllm`（或等效 `llm`）的任务推送给 AI 进行处理。
- `default_agent`: 默认执行代理，当前支持 `copilot` 与 `opencode`。
- `task_specific_agents`: 为指定工作流阶段单独指定执行代理。
- `opencode.transport`: OpenCode 传输模式，支持 `cli` 和 `server`。
- `opencode.executionHost`: 指定 OpenCode 在本机、WSL 或自动模式下运行。
- `opencode.server.*`: 当走 Server 模式时，用于配置 `opencode serve` 的访问地址、会话标题与工作目录映射。

## 4.3 内置 `.opencode` 集成包

当点击 `初始化AICodingAgent配置` 时，扩展会把一组内置资产复制到当前工作区，包括：

- `.github`：供 Copilot/GitHub 侧读取的镜像技能与配置
- `.opencode`：OpenCode 插件包、工具包、技能镜像与运行配置
- `skills`：AI4PB 源技能资产
- `.agents`、`.claude`、`rules`：配套代理、Claude 资产和规则集

其中 `.opencode` 不只是一个空目录，它包含：

- OpenCode 插件入口与包清单
- ECC hook 插件实现
- 自定义工具包，包含 `run-tests`、`check-coverage`、`security-audit`、`format-code`、`lint-check`、`git-summary`
- 与 OpenCode 对齐的技能镜像和 `opencode.json`

这意味着 AI4PB 支持的是“带内置资产的 OpenCode 接入”，而不是仅靠用户手工安装一个外部 CLI。

## 4.4 OpenCode 双传输模型

扩展当前对 OpenCode 提供两种运行方式：

- **CLI 模式**：直接调用 `opencode` 命令，适合本地命令式执行
- **Server 模式**：调用 `opencode serve` 暴露的 HTTP 接口，适合常驻服务和流式结果展示

两种模式都由扩展宿主统一处理：

- 统一读取 `.aicodingconfig` 中的 `AGENT_ROUTER_CONFIG`
- 自动进行 Windows / WSL 路径归一化
- 统一把执行中的状态和流式输出回显到 AI4PB 面板

## 4.5 提示词模板注册 (Prompt Tools)

扩展本身也是实现了 VS Code 最新的 Language Model Tool API 提供者。它预先注册了一整套 `#ai4pb-xxxx` 提示词工具资产（源码位于代码仓的 `skills/*/SKILL.md`，并在运行/发版时同步到 `.github/skills/*` 与 `.opencode/skills/*`），这些资产区分为：
- **模板型 Prompt (由 LM Tool 读取)**：指引 Copilot 应如何响应、思考。
- **产出型 Prompt**：基于上述模板在会话中真实执行后生成的输出文档（例如：`implementation/task-list.md`）。

当在 Chat 中 @Copilot 并引用 `#ai4pb-xxx` 时，Copilot 相当于获得了这套架构指南和专家级角色设定，不会偏题瞎写。