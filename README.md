# AI4PB Orchestrator

AI4PB Orchestrator 是一个 VS Code 扩展，用来把企业架构模型、AI 编码执行、设计审计和迭代复盘串成一条可重复的交付流程。

它面向的不是“随便让 AI 帮我写点代码”的场景，而是“让 AI 在架构约束下参与真实项目交付”的场景。

## 这个项目解决什么问题

很多团队开始用 AI 写代码后，会很快遇到几个问题：

- AI 不知道系统设计边界，只能根据局部上下文生成代码
- 架构图、任务、缺陷、代码和复盘分散在不同工具里
- 代码可能能跑，但不一定符合原始设计职责
- 迭代结束后，缺少可追踪的审计和总结产物

AI4PB 的解决方式是：

1. 在 Sparx EA 中维护架构、Task、Issue。
2. 导出机器可读的架构上下文和任务文档。
3. 在 VS Code 中通过工作流面板驱动 Coding Agent 执行。
4. 在每轮 Sprint 中，按 规划 → 启动 → 执行 → 修复 → 审计 → 收尾 → 总结 → 汇报 的节奏推进，所有阶段均在 AI4PB 侧边栏一键触发。

一句话概括：

> 不是让 AI 自由发挥，而是让 AI 在你的架构和流程里工作。

## 你可以用它做什么

- 从 EA 模型导出当前迭代的 AI 输入
- 让 Copilot/Opencode 基于架构任务启动开发，而不是靠临时提示词
- 为具体任务生成执行说明并进入编码
- 根据 Issue 继续多轮修复
- 审计代码与架构是否偏离
- 自动沉淀任务清单、审计报告、提交说明和周报

## 用这个项目的收益

- 更少跑偏：AI 输入来自架构和任务，不是零散聊天上下文
- 更易协作：架构师、开发、测试、管理看到的是同一条流程
- 更可追踪：从 Task 到代码，再到审计和复盘都有对应产物
- 更易治理：每轮迭代都可以检查代码是否仍符合设计
- 更快复用：常见 SCRUM 阶段已经封装成现成动作

## 它是怎么工作的

AI4PB 把工作分成两端：

- 架构端：在 EA 中建模、挂载 Task/Issue、导出上下文
- 执行端：在 VS Code 中驱动 AI 按流程执行（扩展同时兼容 GitHub Copilot 和 OpenCode，可在 `.aicodingconfig` 中按需切换，详见下方"快速开始"章节）

核心闭环如下：

1. 在 EA 中维护架构和任务
2. 从 EA 导出 `design/KG/SystemArchitecture.json`
3. 在 AI4PB 侧边栏点击 **计划与汇报流** -> **提取任务**，自动生成任务清单（`design/tasks/taskandissues_for_LLM.md`）
4. 按 SCRUM 节奏完成后续迭代阶段：Init（启动）→ Task Support（执行）→ Iteration Issues（问题反馈与修复）
5. 执行 Design Audit 做架构对齐检查
6. 完成 Wrap-up、Iteration Summary、Weekly Report，收尾本轮迭代

## 快速开始

### 1. 准备环境

- Sparx Enterprise Architect 15+
- VS Code 1.95+
- GitHub Copilot
- AI4PB Orchestrator 扩展
- OpenCode（可选，用于替代或补充 Copilot 引擎）：
  - 在 WSL 中安装：`npm install -g opencode-ai`
  - 在 WSL 中启动服务：`opencode serve`（默认监听 `http://127.0.0.1:4096`）
  - 在项目的 `.aicodingconfig` 中配置地址与路由策略，示例如下：

```json
{
  "AGENT_ROUTER_CONFIG": {
    "default_agent": "opencode",
    "opencode": {
      "transport": "server",
      "executionHost": "wsl",
      "server": {
        "baseUrl": "http://127.0.0.1:4096"
      }
    }
  }
}
```

### 2. 安装扩展

如果你是使用者：

- 从 Marketplace 安装，或
- 本地构建 VSIX 后安装

如果你是维护者，在仓库根目录执行：

```bash
npm install
npm run compile
npm run release:vsix:nobump
```

### 3. 初始化工作区

打开 VS Code 后：

1. 打开 AI4PB 侧边栏
2. 在侧边栏中点击 **初始化 EA 模板** 按钮
3. 在工作区中生成模板和流程基础文件

### 4. 在 EA 中准备 AI 输入

在架构元素上挂载 Task / Issue，建议遵循：

- `Status = Active`
- `Assigned To = llm`
- `Name` 写成可执行任务说明

然后从 EA 导出：

- `design/KG/SystemArchitecture.json`

任务清单（`design/tasks/taskandissues_for_LLM.md`）由扩展在执行 **提取任务** 步骤时自动生成，无需从 EA 手动导出。

### 5. 在 VS Code 中驱动迭代

在 AI4PB 侧边栏按照 SCRUM 节奏依次点击：

| SCRUM 阶段 | 步骤//TODO：下面换成面板中具体按钮名称，所有按钮都要覆盖不要遗漏 | 说明                    |
| -------- | ----------------------------------- | --------------------- |
| 规划       | Task List                           | AI 读取架构任务，生成本期迭代看板    |
| 启动       | Init                                | 建立本轮迭代的上下文边界与目标       |
| 执行       | Task Support                        | 对每个任务生成执行说明并开始编码      |
| 修复       | Iteration Issues                    | 根据 Issue 记录进行多轮缺陷修复   |
| 审计       | Design Audit                        | 逐项核查代码与架构声明的一致性       |
| 收尾       | Wrap-up                             | 确认本轮交付范围，归档本轮成果       |
| 总结       | Iteration Summary                   | 生成 Git Commit Message |
| 汇报       | Weekly Report                       | 为干系人输出管理层周报           |

**切换 AI 引擎（Copilot / OpenCode）**

扩展默认使用 GitHub Copilot。若需切换为 OpenCode，在项目根目录 `.aicodingconfig` 中修改：

```json
{
  "AGENT_ROUTER_CONFIG": {
    "default_agent": "opencode"
  }
}
```

也可仅对特定阶段路由到 OpenCode，其余阶段保持 Copilot：

```json
{
  "AGENT_ROUTER_CONFIG": {
    "default_agent": "copilot",
    "task_specific_agents": {
      "task-list": "opencode"
    }
  }
}
```

## 核心使用方式：AI4PB 侧边栏

安装扩展后，VS Code 左侧活动栏出现 **AI4PB DEV** 图标，点击后打开工作流面板。

面板按 SCRUM 阶段排列，提供从架构初始化到迭代复盘的全套操作入口：

- 点击任意阶段按钮，扩展自动将架构上下文和专属指令注入 AI 会话
- 使用 GitHub Copilot 时：自动开启新 Chat 对话，架构 JSON 和角色 Prompt 随之注入
- 使用 OpenCode 时：向 OpenCode Server 发起请求，流式响应直接展示在面板内

不需要手动复制 Prompt，不需要记忆命令，每个迭代阶段都有一键操作入口。

## 主要产物

业务交付物：

- `implementation/task-list.md`
- `implementation/taskhelpinfos/*.md`
- `implementation/reports/*.md`

过程工件：

- `design/temp/audit.md`
- `debug/iteration-commit-message.md`

这意味着你得到的不只是代码，还有设计校验、过程记录和管理沟通材料。

## 适合谁

- 已经有 EA / ArchiMate 建模基础的团队
- 想把架构设计和 AI 编码真正打通的团队
- 需要可审计、可复盘、可追踪流程的企业项目
- 希望把 Task / Issue 直接转成 AI 执行输入的团队

如果你只是想要一个通用聊天型代码助手，这个项目会偏重。
如果你要的是“架构驱动的 AI 研发流程”，这个项目就是为这个场景设计的。

## 项目结构一览

- `src/`：VS Code 扩展源码
- `media/`：工作流 webview 前端资源
- `skills/`：AI4PB Prompt Tools 和技能模板
- `script/EA-jsscript/`：EA 导出与辅助脚本
- `design/`：架构上下文、审计和设计过程文件
- `implementation/`：任务说明、报告等交付物
- `.opencode/`：OpenCode 集成实现

## 深入文档

- [快速上手总览](docs/getting-started/README.md)
- [完整上手指南](docs/getting-started/00-getting-started-overview.md)
- [环境准备](docs/getting-started/02-prerequisites.md)
- [EA 建模与导出](docs/getting-started/03-modeling-and-export.md)
- [扩展与工作流说明](docs/getting-started/04-orchestrator-extension.md)
- [SCRUM 执行流程](docs/getting-started/05-scrum-workflow.md)
- [最佳实践](docs/getting-started/06-best-practices.md)

## 开发扩展

仓库根目录常用命令：

```bash
npm install
npm run compile
npx tsc --noEmit
npm run watch
```

构建 VSIX：

```bash
npm run release:vsix
```

说明：当前仓库没有配置正式的自动化测试套件，日常验证以 TypeScript 编译、手动检查扩展行为和流程产物为主。

## 总结

如果你要解决的是“怎么让 AI 更快写几段代码”，这不是最轻量的方案。

如果你要解决的是：

- 如何让 AI 基于架构执行
- 如何把任务、缺陷、代码、审计、总结串成闭环
- 如何让企业项目中的 AI 编码过程更可控、更可追踪

那么 AI4PB Orchestrator 提供的是一套完整且可执行的答案。
























































































































