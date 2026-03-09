# 6. 最佳实践与输出物管理 (Best Practices)

让 AI 平稳受控地产出企业级价值并不过分天马行空，需要遵守良好的目录隔离、模型管理策略和提问礼仪。

## 6.1 输出物边界 (Directory Separation)

为了维护项目目录整洁与功能明确，应当严格遵循下方隔离边界：

- **业务交付物：`implementation/*`**
  这些是给开发人员、测试或 PM 阅读的内容：如 `task-list.md`, 各个子任务说明 `taskhelpinfos/`, 迭代周报 `reports/`。
- **扩展工时与追踪记录：`TEMP/*` / `debug/*` / `design/temp/`**
  运行产生的状态、代码分析对比文档 (例如审计的 `audit.md`，用于对齐的 `design-code-alignment.md`，或者 git commit message `debug/iteration-commit-message.md`)。 这些文件一般不需要作为业务资产留存和展示给最终客户。

## 6.2 EA 模型维护的黄金法则

- **宁少勿错，细化任务**：与其给模型元素挂一个名为“做完产品中心”的 `Task`，不如拆为 “开发产品中心查询 SQL”、“提供产品详情 API”、“制作产品列表前端组件”。AI 一次只能在有明确边界的小任务下提供稳定的优质生成率。
- **及时更新与再获取**：如果在开发过程中 AI 建议将某个模块分为两半（例如重构解耦：`Separation of Concerns`），工程师应当根据 `Design Audit` 的提议：
  1. 打开 EA 调整模型。
  2. 填写正确的 `code_paths` 至元素的 Tags / Properties 里。
  3. 再次导出 JSON。
  4. 切勿容忍长期“图码不一致”。

## 6.3 提示词 (Prompt) 调优规则

如果你需要调整系统级别的提示资产（比如针对本团队特殊加入测试脚本调用）：

- 找到 `workprompt` 目录下的 `.md` 或者 `.github/skills/` 里的 Skill 文件。
- 确认自己是在编写“模板型 Prompt”还是“产出型 Prompt”。（见 `workprompt/README.md`）
- 保持核心数据抓取锚点 `design/KG/SystemArchitecture.json` 不做破坏。

## 6.4 AI 无法取代的东西：测试与闭环复核

- `TestAndVerification` 节点当前无法由本平台全量全自动处理，这仍然需要 QA 从实际运行时提供 Bug 清单（或单元测试/集成测试未通过清单）。
- 始终把 `AI4PB: Design Audit Prompt` 视为一道闸门。不通过此步，不急于完成发版。架构师审查这份 “Diff / Change” 分析，决定是对代码做让步，还是喝令 AI 重改代码符合预期。