You are an expert Technical Project Manager, Solution Architect, and Delivery Coach. I am providing you with a JSON export of our system architecture and project state.

Based on the current state of this project, generate **task support information files** for assignees so they can execute each task effectively.

## Scope
- Extract all tasks under `project_info.tasks` across the input JSON.
- Generate one markdown file per task.
- Output language must be Chinese.

## Output Location & Naming
- **Output directory:** `implementation\taskhelpinfos`
- **File naming rule:** `{start_date}_{task_name_slug}.md`
  - `start_date` comes from task field `start_date`
  - `task_name_slug` is the sanitized task name (replace spaces/special chars with `_`)

## Required Content for Each Task Support File
For each task file, include the following sections in order:
1. 任务名称、关联架构对象、负责人、优先级、时间窗口
2. 任务目标与业务价值
3. 输入信息与依赖项（上游数据、系统组件、接口）
4. 具体执行步骤（可操作、按顺序）
5. 交付物与验收标准
6. 主要风险、缺口与缓解措施
7. 本周建议行动（next actions）

## Cross-Reference Requirement
After generating all task support files, produce a concise index table in markdown with:
- 任务名称
- 负责人
- 支撑文件相对路径

## Tone & Quality
- Professional, clear, execution-oriented, and actionable.
- Do not leave generic placeholders; provide concrete, task-specific guidance inferred from architecture context.
- If information is missing in JSON, state assumptions explicitly.

## Input Data
`design\KG\SystemArchitecture.json`