# EA JScript 脚本说明

本目录用于 Enterprise Architect (EA) 的 JScript 自动化脚本。

## 使用前提
- 运行环境：Sparx EA（支持 JScript）
- 常用内置对象：`Repository`、`Session`
- 依赖组件：
  - `ADODB.Stream`（读写 UTF-8 文件）
  - `Scripting.FileSystemObject`（文件系统操作）
  - `Word.Application`（仅部分脚本用于 RTF→PDF，需要本机安装 Word）
- 部分脚本含**硬编码路径**，使用前请先修改文件路径变量

## 推荐：集中维护（避免每个 EA 模型重复粘贴）

如果你有多个 EA 模型，建议改成“**每个模型只保留一个 bootstrap 脚本**，真正逻辑放在本仓库共享文件”模式：

1. 在每个 EA 模型中仅导入并保留：`project_auto_gen_suitable_for_LLM-V2-bootstrap.js`
2. 在 bootstrap 里设置：
  - `SHARED_SCRIPT_PATH` / `SHARED_SCRIPT_LOCAL_FALLBACK_PATH` 可留空（推荐）
  - bootstrap 会优先从项目内候选路径自动查找共享脚本（如 `<projectPath>/script/EA-jsscript/project_auto_gen_suitable_for_LLM-V2.js`）
  - 若项目内不存在，会自动尝试从本机 `ai4pb-orchestrator` 仓库路径与 VS Code 扩展目录（`.vscode/extensions/*ai4pb-orchestrator*/...`）发现共享脚本
  - `EA_AUTOGEN_CONFIG.projectPath` 会自动从当前 EA 模型文件所在目录推断（无需手填）
   - 可选：`PROJECT_CONFIG_FILE_PATH` 显式指定 `.aicodingconfig` 文件；留空则默认读取 `<projectPath>/.aicodingconfig`
3. 日常只更新共享文件 `project_auto_gen_suitable_for_LLM-V2.js`，所有模型下次运行 bootstrap 时自动使用最新版本。

> 这样你只需一次性在各模型配置 bootstrap，后续不再需要反复复制完整脚本。

> 若读取失败，请先确认 `SHARED_SCRIPT_PATH` / `SHARED_SCRIPT_LOCAL_FALLBACK_PATH` 指向本机真实存在的脚本文件。

### `.aicodingconfig` 示例

你可以把项目参数放到项目根目录的 `.aicodingconfig`：

```json
{
  "EA_AUTOGEN_CONFIG": {
    "needallmaintenace": false,
    "needbrowserlocation": true,
    "maintenacetype": "forllm"
  }
}
```

也支持 JS 风格（例如你现在使用的）：

```javascript
var EA_AUTOGEN_CONFIG = {
  needCode: false,
  needContent: true,
  needdoc: false,
  needallmaintenace: false,
  needbrowserlocation: true,
  maintenacetype: "forllm"
};
```

---

## 脚本总览

| 脚本 | 作用 | 典型输入 | 典型输出 |
|---|---|---|---|
| `JSON-Parser.js` | 为旧版 JScript 提供 `JSON.parse/stringify` | 无（被 `!INC` 引入） | 无 |
| `schema_json_to_diagram.js` | 从 schema JSON 生成 EA 包、图、元素、关系 | JSON 文件 | EA 模型内容 |
| `schema_diagram_to_json.js` | 从当前图导出 schema JSON（节点/关系） | 当前打开图 | JSON 文件 |
| `stix_to_ea.js` | 将 STIX Bundle 导入 EA 类图 | STIX JSON | EA 模型内容 |
| `ea_to_stix.js` | 将 EA 中 STIX 类图导出为 STIX Bundle | 选中包 | STIX JSON |
| `project_auto_gen.js` | 导出项目架构与维护信息（原始字段风格） | 当前图/包 | JSON + 可能的 PDF |
| `project_auto_gen_suitable_for_LLM.js` | 面向 LLM 的导出版本（字段更规范） | 当前图/包 | 更易消费 JSON + 可能的 PDF |
| `project_auto_gen_suitable_for_LLM-V2.js` | LLM 导出增强版（含 browser_path、任务过滤等） | 当前图/包 | 增强 JSON + 可能的 PDF |
| `PUT-all-elements-on-diagram.js` | 将选中包内元素放到当前图（不递归） | 当前图 + 选中包 | 图中新增元素 |
| `PUT-all-elements-under-directory-recursively-on-diagram.js` | 将选中目录及子目录元素递归放到当前图 | 当前图 + 选中包 | 图中新增元素 |

---

## 逐脚本说明

### 1) `JSON-Parser.js`
- **用途**：兼容旧 JScript 引擎，提供 JSON 解析/序列化能力。
- **使用方式**：被其他脚本通过 `!INC JSON-Parser` 引入。
- **注意**：不是独立业务脚本，一般不单独运行。

### 2) `schema_json_to_diagram.js`
- **用途**：把指定 schema JSON 转成 EA 包、逻辑图、元素和关系。
- **前置条件**：在 Project Browser 中选中一个目标父包。
- **关键行为**：
  - 创建新 Package + Diagram
  - 遍历 `nodeTypes` 创建元素
  - 遍历 `relationTypes` 创建连接器/关联类
- **注意**：脚本中 JSON 路径为硬编码（`filePath`），运行前建议先改。

### 3) `schema_diagram_to_json.js`
- **用途**：从当前打开图提取元素和关系，导出 schema JSON。
- **前置条件**：先打开目标图。
- **关键行为**：
  - 遍历 `DiagramObjects` 与 `DiagramLinks`
  - 处理属性/方法/参数，组装节点与关系结构
- **注意**：导出文件路径和结构依赖脚本内部逻辑，建议结合实际模型调整字段。

### 4) `stix_to_ea.js`
- **用途**：将 STIX Bundle(JSON) 导入为 EA 类图。
- **前置条件**：在树中选中目标父包。
- **关键行为**：
  - 读取 `bundle.objects`
  - 非 relationship 对象建为 Class（`Stereotype=type`）
  - relationship 建连接器 + Association Class
- **注意**：输入文件路径为硬编码（`filePath`），需按本地路径修改。

### 5) `ea_to_stix.js`
- **用途**：把 EA 中 STIX 类图导出回 STIX Bundle。
- **前置条件**：在树中选中包含 STIX 图的包。
- **关键行为**：
  - 从元素恢复 STIX 对象
  - 从连接器与关联类恢复 relationship
  - 写出 bundle JSON 文件
- **注意**：输出路径为硬编码（`outputPath`），运行前请改为目标目录。

### 6) `project_auto_gen.js`
- **用途**：导出项目图谱信息（节点、关系、项目维护、资源等），偏原始字段命名。
- **关键行为**：
  - 提取元素/连接器信息
  - 读取任务、资源、进度信息
  - 支持读取文件内容、生成附加文档信息
- **注意**：字段命名较早期（如 `projectSummury`、`responser`），用于兼容旧流程。

### 7) `project_auto_gen_suitable_for_LLM.js`
- **用途**：面向 LLM 消费的导出版本，字段更规范。
- **关键行为**：
  - 使用更清晰字段名（如 `summary`、`tasks`、`assigned_to`）
  - 支持仅导出 Active 任务（受脚本变量控制）
- **适用场景**：给周报/任务拆解类提示词提供输入。

### 8) `project_auto_gen_suitable_for_LLM-V2.js`
- **用途**：LLM 导出增强版，支持更多路径与任务过滤能力。
- **关键行为**：
  - 提供 `browser_path` 相关能力
  - 支持按任务负责人（如 `llm`）筛选
  - 输出结构更适配后续自动化提示词流程
- **适用场景**：作为当前主力导出脚本优先使用。

### 9) `PUT-all-elements-on-diagram.js`
- **用途**：将选中对象添加到当前图（不递归）。支持选中包或选中元素。
- **前置条件**：
  - 已打开目标图
-  - Project Browser 中选中包或元素
- **关键行为**：
  - 若选中包：添加该包下直接元素（不下钻子包/子元素）
  - 若选中元素：只添加该元素本身
  - 网格布局放置
  - 若元素已在图上：输出日志并跳过
- **日志示例**：`SKIP (already on diagram): <Name> [ElementID=<id>]`

### 10) `PUT-all-elements-under-directory-recursively-on-diagram.js`
- **用途**：将选中对象下的元素递归添加到当前图（支持“包”或“元素”作为入口）。
- **前置条件**：
  - 已打开目标图
-  - Project Browser 中选中目录（包）或某个元素
- **关键行为**：
  - 若选中包：递归收集包及子包中的元素，并继续下钻元素的子元素
  - 若选中元素：递归收集该元素及其子元素
  - 网格布局放置
  - 已存在元素输出日志并跳过
- **适用场景**：一次性把某个架构分支（包层级或元素层级）完整铺到图上。

---

## 推荐使用顺序（常见）
1. 若外部 JSON 入模：`schema_json_to_diagram.js` 或 `stix_to_ea.js`
2. 若补图：`PUT-all-elements-on-diagram.js` / `PUT-all-elements-under-directory-recursively-on-diagram.js`
3. 若导出给 AI/报告流程：优先 `project_auto_gen_suitable_for_LLM-V2.js`
4. 若需 STIX 回写：`ea_to_stix.js`

---

## 常见问题
- **脚本报找不到文件**：检查硬编码路径是否存在。
- **中文乱码**：确认读写使用 `ADODB.Stream` 且 `Charset=UTF-8`。
- **RTF 转 PDF 失败**：确认本机安装 Microsoft Word，且 COM 可用。
- **图上元素重复**：放置脚本已做去重，重复会输出 `SKIP` 日志。
