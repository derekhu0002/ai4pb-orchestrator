# 任务执行简报

- 任务名称：请帮我实现Architecture Reality Scanning & Reconciliation视图中的应用
- 任务类型：ToDo
- 当前状态：Active
- 负责人：llm
- 优先级：Low
- 起止时间：2026-3-25 至 未知
- 关联架构对象名称与 ID：Application（1156）；Architecture Reality Scanning & Reconciliation 视图（177）；Reality Scanner Orchestrator（1275）；TypeScript Scanner Adapter（1276）；Python Scanner Adapter（1277）；Language-Specific Scanner Scripts（1278）；reality.json（1279）；Architecture Reconciliation Service（1280）；ARCH_IMPL_GAP（1281）；Target System（1177）；JSON Format of Archimate Model（1194）

## 1. LLM执行摘要

- 当前任务目标是在应用层实现“现实扫描 + 架构协调”能力，并提供可调用的内部服务入口，不要求显式 UI 触发点。
- 首要修改对象是 Reality Scanner Orchestrator（1275）及其 TypeScript / Python 适配器（1276、1277），再由 Architecture Reconciliation Service（1280）消费结果。
- `reality.json` 的核心 schema 至少要覆盖 `elements`、`relationships`、`views` 三类结构；不稳定的语言细节只能降级到扩展属性或 `未知`。
- TypeScript 扫描器优先采用 `ts-morph`；Python 扫描器必须通过子进程协议输出 JSON，并以非 0 退出码表示失败。
- `ARCH_IMPL_GAP` 需要同时输出 JSON 和 Markdown 报告，目标目录固定为 `design/intention_reality_audit/`。
- 报告至少包含缺失元素、关系差异、原始指标、差异清单四类信息。
- 必须支持显式传入排除列表；默认排除策略只能留在扫描器内部，不能扩散到协调服务。
- 最关键验收条件是：协调服务同时消费“意图”模型与 `reality.json`，产出可审阅差异报告，并输出覆盖率、准确率、纯净度等原始指标。
- 不允许把运行时扫描细节或回写结果直接写入 `design/KG/SystemArchitecture.json`。
- 主要风险在于 `intent.json` 的实际文件落点、应用层入口文件位置、以及 `ast/ts`、`ast/py` 目录是否已存在，当前都需结合代码仓确认。

## 2. 已确认事实

- Application（1156）的 `project_info.tasks` 中存在同名任务，状态为 `Active`，开始日期为 `2026-3-25`，优先级为 `Low`，负责人为 `llm`。
- 视图 Architecture Reality Scanning & Reconciliation（177）已定义用途：自动扫描代码库、生成 canonical reality model，并馈送到协调服务做意图/实现对比。
- 视图（177）纳入的核心元素包括 Reality Scanner Orchestrator（1275）、TypeScript Scanner Adapter（1276）、Python Scanner Adapter（1277）、Language-Specific Scanner Scripts（1278）、reality.json（1279）、Architecture Reconciliation Service（1280）、ARCH_IMPL_GAP（1281）、Target System（1177）、JSON Format of Archimate Model（1194）。
- Reality Scanner Orchestrator（1275）被定义为扫描引擎核心，负责语言检测、编排扫描流程，并把适配器结果归一化为统一的 `reality.json`。
- TypeScript Scanner Adapter（1276）被定义为使用 `ts-morph` 等 AST 库解析 TypeScript/JavaScript 代码库并翻译为规范架构模型。
- Python Scanner Adapter（1277）被定义为调用独立 Python 子进程解析 Python 代码库，并通过 stdout 捕获 JSON 结果。
- 关系 1204 与 1205 明确表示 Reality Scanner Orchestrator（1275）组合了 TypeScript Scanner Adapter（1276）和 Python Scanner Adapter（1277）。
- 关系 1206 明确表示 Python Scanner Adapter（1277）触发 Language-Specific Scanner Scripts（1278）完成扫描。
- 关系 1207 与 1208 明确表示两个适配器都需要读取 Target System（1177）的源代码进行分析。
- 关系 1209 明确表示 Reality Scanner Orchestrator（1275）输出 `reality.json`（1279）。
- 关系 1210 与 1211 明确表示 Architecture Reconciliation Service（1280）同时读取 `reality.json`（1279）与 JSON Format of Archimate Model（1194）。
- 关系 1212 明确表示 Architecture Reconciliation Service（1280）的结果输出为 ARCH_IMPL_GAP（1281）。
- Architecture Reconciliation Service（1280）已定义三类“孤儿元素”处理策略：私有实现细节自动忽略、公共未建模 API 作为警告审查、孤立公共组件作为新能力待评估。
- Principle（1282）明确要求架构设计遵守 SOLID 原则，可直接作为本任务的实现约束。

## 3. 需人工确认 / 未知项

- `intent.json` 的实际文件路径未从当前已读 KG 片段中直接确认；建议先将 JSON Format of Archimate Model（1194）的导出文件路径固定下来，再让协调服务只依赖该导出件而非直接操作 KG 源文件。
- “应用层内部服务入口”的具体宿主文件/模块无法从 KG 直接确认；建议优先定位现有应用层命令编排或服务注册边界，在该边界增加无 UI 依赖的内部入口。
- `ast/ts` 与 `ast/py` 目录在任务描述中被要求作为实际扫描器代码路径，但当前未从 KG 确认其仓库现状；合理假设是目录缺失时允许新增。
- `design/intention_reality_audit/` 下的具体文件命名规则未明确；建议最小化命名为 `arch_impl_gap.json` 与 `arch_impl_gap.md`，并在实现时保持稳定输出位置。
- 排除列表的来源未明确是函数参数、配置文件还是命令输入；建议先以内部服务参数显式传入，并由扫描器在本地合并默认排除项。
- `reality.json` 的扩展属性命名规范未明确；建议仅把无法稳定映射到 `elements` / `relationships` / `views` 的语言特有信息放入 `extensions` 或等价扩展字段。
- 是否输出综合总分 SFI/AAS 目前属于可选项；建议无论是否输出总分，都必须先输出覆盖率、准确率、纯净度和差异明细。

## 4. 约束与边界

- 必须遵守的原则：Progressive Disclosure、Separation of Concerns、SOLID（Principle 1282）。
- 必须保持不变的边界：`design/KG/SystemArchitecture.json` 仍然是“意图输入源”，不能承载运行时扫描结果或回写后的现实细节。
- 必须保持不变的职责分离：Reality Scanner Orchestrator（1275）负责编排与归一化；各语言适配器（1276、1277）负责语言解析；Architecture Reconciliation Service（1280）负责比对与差异输出；报告落盘职责应独立封装。
- 明确禁止的实现方式：把默认排除策略泄露到协调服务；把语言特有细节硬塞进核心 schema；对 SFI/AAS 使用硬编码阈值作自动判定；为当前任务额外增加 UI 交互入口。
- Progressive Disclosure 强制要求：先形成统一 `reality.json`，再做 reconciliation 和报告输出；不要把扫描、差异分析、报告渲染混写在单一模块中。
- Separation of Concerns 强制要求：TypeScript 解析逻辑与 Python 子进程调用逻辑必须分离；排除策略解析与差异算法分离；机器可读 JSON 报告与 Markdown 报告渲染分离。
- 对外可见的最小范围：当前阶段只需要应用层能力与内部服务入口，不需要扩展到 Webview、命令面板或其他显式用户交互流。

## 5. 架构元素级任务拆解

| 子任务名称 | 对应架构元素 | 技术目的 | 依赖关系 |
| --- | --- | --- | --- |
| 建立扫描编排入口 | Application（1156）, Reality Scanner Orchestrator（1275） | 提供无 UI 依赖的应用层内部调用入口，串联扫描、归一化和协调流程 | 依赖后续适配器与协调服务实现 |
| 实现 TypeScript 扫描适配器 | TypeScript Scanner Adapter（1276）, Target System（1177） | 通过 `ts-morph` 读取目标系统 TS/JS 代码并输出标准化结构 | 被扫描编排入口调用；输出供 `reality.json` 归一化使用 |
| 实现 Python 扫描适配器与脚本契约 | Python Scanner Adapter（1277）, Language-Specific Scanner Scripts（1278）, Target System（1177） | 定义并实现 Python 子进程 stdin/argv、stdout JSON、非 0 失败协议 | 受扫描编排入口触发；产物参与统一 reality 汇总 |
| 归一化并落盘 `reality.json` | Reality Scanner Orchestrator（1275）, reality.json（1279） | 把多语言扫描结果统一到至少包含 `elements` / `relationships` / `views` 的 schema | 依赖 TS/Python 适配器完成 |
| 实现协调服务与差异分类 | Architecture Reconciliation Service（1280）, JSON Format of Archimate Model（1194）, ARCH_IMPL_GAP（1281） | 对比意图/现实模型，输出差异清单、原始指标和孤儿元素分类结论 | 依赖 `reality.json` 与 intent 输入均可读取 |
| 生成双格式审计报告 | ARCH_IMPL_GAP（1281） | 输出 JSON 和 Markdown 报告到 `design/intention_reality_audit/` | 依赖协调服务完成差异结果计算 |
| 接入排除列表与默认策略隔离 | Reality Scanner Orchestrator（1275）, TypeScript Scanner Adapter（1276）, Python Scanner Adapter（1277） | 支持显式排除配置，同时把默认排除仅留在扫描器内部 | 依赖扫描入口与适配器实现 |

## 6. 推荐实施顺序

1. 动作说明：先确认意图输入文件、应用层入口和扫描目录落点，补足最小实现边界。  
   目标文件 / 模块 / 目录：`需结合代码仓进一步定位`，重点确认应用层服务入口、`ast/ts`、`ast/py`、`design/intention_reality_audit/`。  
   对应架构元素 ID：1156、1275、1276、1277、1281、1194。  
   完成判定标准：输入文件、输出目录、内部调用边界全部明确，不再依赖 UI 入口假设。

2. 动作说明：实现扫描编排器和统一 schema，确保多语言扫描结果可汇总为 `reality.json`。  
   目标文件 / 模块 / 目录：扫描编排模块、统一 schema 定义文件、`ast/ts`、`ast/py`。  
   对应架构元素 ID：1275、1276、1277、1279。  
   完成判定标准：单次执行可以产出结构完整的 `reality.json`，且核心字段覆盖 `elements`、`relationships`、`views`。

3. 动作说明：实现 TypeScript 扫描适配器并优先采用 `ts-morph`。  
   目标文件 / 模块 / 目录：`ast/ts` 或等价 TypeScript 扫描目录。  
   对应架构元素 ID：1276、1177。  
   完成判定标准：TS/JS 代码可被解析并转换为统一模型片段。

4. 动作说明：实现 Python 子进程协议与 Python 扫描适配器。  
   目标文件 / 模块 / 目录：`ast/py`、Python 子进程调用封装。  
   对应架构元素 ID：1277、1278、1177。  
   完成判定标准：子进程成功时返回标准 JSON，失败时以非 0 退出码和错误信息回传。

5. 动作说明：实现协调服务，读取 intent 与 reality 进行差异比较。  
   目标文件 / 模块 / 目录：协调服务模块、差异分类模块、指标计算模块。  
   对应架构元素 ID：1280、1279、1194、1281。  
   完成判定标准：可输出缺失元素、关系差异、原始指标、差异清单，并遵守三类孤儿元素处理策略。

6. 动作说明：增加双格式报告输出与排除列表能力。  
   目标文件 / 模块 / 目录：报告生成模块、`design/intention_reality_audit/`、扫描器参数处理模块。  
   对应架构元素 ID：1275、1280、1281。  
   完成判定标准：同时生成 JSON 和 Markdown 报告，显式排除列表生效，默认排除仍局限在扫描器内部。

## 7. 建议修改目标

- 优先检查的文件
  - 应用层内部服务入口文件：需结合代码仓进一步定位。
  - TypeScript 扫描模块目录：`ast/ts`（若不存在则需新增）。
  - Python 扫描模块目录：`ast/py`（若不存在则需新增）。
  - 差异报告输出目录：`design/intention_reality_audit/`。
  - 统一 schema / 协调服务模块：需结合代码仓进一步定位。
- 可能需要新增的文件
  - 扫描编排器实现文件。
  - TypeScript 扫描适配器实现文件。
  - Python 子进程协议封装与脚本入口文件。
  - `reality.json` schema 定义文件。
  - ARCH_IMPL_GAP 的 JSON / Markdown 报告生成文件。
- 可能需要避免修改的文件
  - `design/KG/SystemArchitecture.json`。
  - 与当前任务无关的 Webview / UI 触发文件。
  - 不承担扫描、协调、报告职责的无关业务模块。

## 8. 交付物与验收标准

- [x] 提供一个应用层内部服务入口，可在无显式 UI 触发的情况下启动现实扫描与协调流程。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/extension.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/extension.ts) 并确认 `runDesignCodeAlignment` 已调用 `runArchitectureRealityAlignment`，没有新增独立 UI 命令。
2. 在仓库根目录执行 `npm run compile`，确保扩展可以成功编译。
3. 在 VS Code 中执行已有命令 `AI4PB: Run Design-Code Alignment`，确认无需新增按钮或 Webview 交互也能触发扫描与协调流程。

- [x] `reality.json` 的核心结构至少覆盖 `elements`、`relationships`、`views` 三类字段。

***人工验收测试步骤 (Generated by Copilot):***
1. 运行 `AI4PB: Run Design-Code Alignment` 或执行 `node -e "const svc = require('./out/architectureRealityService'); ..."` 触发实际扫描。
2. 打开 [design/intention_reality_audit/reality.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/reality.json) 并确认顶层存在 `elements`、`relationships`、`views` 三个数组。
3. 抽查数组项，确认对象结构可被 `design/KG/SystemArchitecture.json` 的同类结构消费。

- [x] 无法稳定映射的语言细节不会污染核心 schema，而是降级为扩展属性或 `未知`。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts) 与 [src/ast/ts/scanTypeScriptReality.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/ast/ts/scanTypeScriptReality.ts)，确认语言特有信息写入 `extensions` 字段。
2. 打开 [design/intention_reality_audit/reality.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/reality.json)，抽查若干 TS/Python 扫描项，确认核心字段仍保持通用结构。
3. 确认没有把语言细节直接写成新的必填顶层核心字段。

- [x] TypeScript 扫描适配器实际基于 `ts-morph` 或同等级 AST 方案实现。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/ast/ts/scanTypeScriptReality.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/ast/ts/scanTypeScriptReality.ts)，确认代码通过 `Project` 来自 `ts-morph` 进行源码扫描。
2. 检查 [package.json](d:/projects/AICodingAgent/ai4pb-orchestrator/package.json) 中存在 `ts-morph` 依赖。
3. 执行 `AI4PB: Run Design-Code Alignment` 后确认日志中出现 `TypeScript scanner analyzed` 字样。

- [x] Python 扫描适配器通过独立 Python 子进程执行，并遵守 stdin/argv 输入、stdout JSON 输出、非 0 退出码失败协议。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts) 和 [ast/py/scan_python_reality.py](d:/projects/AICodingAgent/ai4pb-orchestrator/ast/py/scan_python_reality.py)，确认 TS 侧使用 `spawn` 调起 Python 脚本，Python 侧同时读取 argv 与 stdin。
2. 正常运行一次扫描，确认生成了 [design/intention_reality_audit/reality.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/reality.json)。
3. 如需失败验证，可临时传入一个不存在的 Python 可执行路径或人为制造脚本异常，确认调用以非 0 退出并在扩展中报错。

- [x] 扫描器支持显式排除列表输入，且默认排除策略仅保留在扫描器内部。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts)、[src/ast/ts/scanTypeScriptReality.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/ast/ts/scanTypeScriptReality.ts) 与 [ast/py/scan_python_reality.py](d:/projects/AICodingAgent/ai4pb-orchestrator/ast/py/scan_python_reality.py)，确认显式排除列表只传给扫描器。
2. 运行服务时传入 `explicitExcludes`，然后检查 [design/intention_reality_audit/reality.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/reality.json) 的 `extensions` 字段，确认显式排除被记录。
3. 确认协调逻辑没有自行追加默认排除规则，只消费扫描结果。

- [x] 扫描编排器能够生成统一的 `reality.json` 产物。

***人工验收测试步骤 (Generated by Copilot):***
1. 运行一次 `AI4PB: Run Design-Code Alignment`。
2. 确认 [design/intention_reality_audit/reality.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/reality.json) 被重新生成，时间戳更新。
3. 打开文件并确认其中同时包含 TypeScript 与 Python 扫描产生的元素、关系和视图汇总结果。

- [x] Architecture Reconciliation Service 同时读取 intent 模型和 `reality.json`，输出可消费的差异结果。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts)，确认 `readIntentArchitecture` 与 reconciliation 逻辑同时使用 `design/KG/SystemArchitecture.json` 和生成后的 `reality.json`。
2. 运行对齐命令后打开 [design/intention_reality_audit/arch_impl_gap.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/arch_impl_gap.json)，确认存在差异结果与原始指标。
3. 抽查 `missingElements`、`missingRelationships`、`differenceList` 三个字段，确认可继续供人工或后续自动化消费。

- [x] `design/intention_reality_audit/` 下生成 JSON 与 Markdown 两种 ARCH_IMPL_GAP 报告。

***人工验收测试步骤 (Generated by Copilot):***
1. 运行一次对齐命令。
2. 确认目录 [design/intention_reality_audit](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit) 下同时存在 `arch_impl_gap.json` 与 `arch_impl_gap.md`。
3. 分别打开两个文件，确认 JSON 是机器可读结构，Markdown 是便于人工审阅的文本报告。

- [x] 报告至少包含缺失元素、关系差异、原始指标、差异清单四类信息。

***人工验收测试步骤 (Generated by Copilot):***
1. 打开 [design/intention_reality_audit/arch_impl_gap.md](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/arch_impl_gap.md)。
2. 确认报告包含 `Raw Metrics`、`Missing Elements`、`Relationship Differences`、`Difference List` 四个区块。
3. 打开 [design/intention_reality_audit/arch_impl_gap.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/arch_impl_gap.json)，确认也包含同等语义字段。

- [x] 输出覆盖率、准确率、纯净度原始指标；如输出总分，不能依赖硬编码阈值判定。

***人工验收测试步骤 (Generated by Copilot):***
1. 查看 [design/intention_reality_audit/arch_impl_gap.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit/arch_impl_gap.json) 中的 `metrics` 字段。
2. 确认至少存在 `coverage`、`accuracy`、`purity` 三个原始指标，以及可选的 `seamlessFitIndex`。
3. 打开 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts)，确认总分仅由指标计算得出，没有硬编码阈值判断分支。

- [x] 整个实现过程中不会把运行时扫描结果回写到 `design/KG/SystemArchitecture.json`。

***人工验收测试步骤 (Generated by Copilot):***
1. 运行一次对齐命令前后，对比 [design/KG/SystemArchitecture.json](d:/projects/AICodingAgent/ai4pb-orchestrator/design/KG/SystemArchitecture.json) 的修改时间或 Git 状态。
2. 确认新增或更新的产物只落在 [design/intention_reality_audit](d:/projects/AICodingAgent/ai4pb-orchestrator/design/intention_reality_audit) 下，而非 `design/KG`。
3. 检查 [src/architectureRealityService.ts](d:/projects/AICodingAgent/ai4pb-orchestrator/src/architectureRealityService.ts)，确认写文件逻辑只针对 `reality.json` 与 `ARCH_IMPL_GAP` 报告路径。

## 9. 风险、阻塞与缓解措施

- 风险：intent 输入文件路径不稳定。  
  缓解：先固定 JSON Format of Archimate Model（1194）的导出路径，并在协调服务中只消费该导出件。
- 风险：扫描入口、适配器、报告生成职责混写，导致后续演进困难。  
  缓解：强制按 orchestrator / adapter / reconciliation / reporter 四层拆分。
- 风险：Python 子进程协议不稳定，错误传播不清晰。  
  缓解：先定义统一输入输出契约和异常返回结构，再接入适配器。
- 风险：把默认排除逻辑泄露到协调服务，导致边界污染。  
  缓解：只允许扫描器内部合并默认排除项，对协调服务暴露显式解析后的结果。
- 风险：多语言扫描结果 schema 不一致，导致 reconciliation 失真。  
  缓解：先定义统一 reality schema，再让各适配器向该 schema 收敛。
- 风险：没有明确 due date，排期优先级信息不足。  
  缓解：当前按 `Active + Low` 处理，并建议由人工补全截止日期以便后续排程。