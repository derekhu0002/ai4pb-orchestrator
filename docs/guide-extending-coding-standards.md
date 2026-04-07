# 扩展编码规范 (Coding Standards) 指南

> 本指南面向希望为项目或组织注入自定义编码规范约束的架构师和团队 Lead。

---

## 背景：编码规范在 AI4PB 中的运作方式

AI4PB 的编码规范体系基于 **Skill 动态注入** 机制。当 Implementation Agent 开始编码时，系统会：

1. 读取 `.opencode/project-standards.json`，获取当前项目语言对应的规范列表
2. 将每条规范作为 Skill 文件加载到 Agent 的工作上下文中
3. Agent 在生成代码时自动遵循这些约束

**关键特性：无需修改任何 Agent Prompt 或核心代码。**

---

## 当前规范注册中心

规范注册位于 `.opencode/project-standards.json`：

```json
{
  "languages": {
    "typescript": ["ts-strict-mode", "naming-conventions"],
    "python": ["acme-python-guidelines"]
  }
}
```

每个条目引用一个位于 `.opencode/skills/<skill-name>/SKILL.md` 的 Skill 文件。

---

## 扩展步骤

### 第一步：编写规范 Skill 文件

在 `.opencode/skills/` 下创建新目录和 `SKILL.md` 文件：

```
.opencode/skills/
  └─ your-company-java-standard/
       └─ SKILL.md
```

SKILL.md 采用 YAML 前置元数据 + Markdown 正文格式：

```markdown
---
name: your-company-java-standard
description: 公司级 Java 编码规范，涵盖包结构、异常处理和日志约束
---

# Java 编码规范

## 1. 包结构约束
- 所有业务逻辑必须位于 `com.yourcompany.<module>.service` 包下
- DAO 层强制使用 `com.yourcompany.<module>.repository` 命名
- 禁止在 Controller 层直接调用 Repository

## 2. 异常处理
- 禁止空 catch 块：每个 catch 必须至少记录日志或重新抛出
- 业务异常必须继承 `BaseBusinessException`
- HTTP 接口层统一使用 `@ExceptionHandler` 处理，禁止在 Controller 方法内 try-catch

## 3. 日志规范
- 使用 SLF4J + Logback，禁止 System.out.println
- 日志级别：DEBUG 用于方法入参出参，INFO 用于业务节点，WARN 用于可恢复异常，ERROR 用于不可恢复异常
- 敏感字段（手机号、身份证）必须脱敏后记录

## 4. 命名规范
- 类名：大驼峰，Service 后缀表示服务层，Controller 后缀表示接口层
- 方法名：小驼峰，布尔返回值以 is/has/can 开头
- 常量：全大写下划线分隔，定义在独立的 Constants 类中

## 5. 数据库交互
- 禁止 SELECT *，必须显式列出字段
- 分页查询必须携带 LIMIT，防止全表扫描
- 批量操作超过 500 条必须分批提交
```

### 第二步：注册到 project-standards.json

编辑 `.opencode/project-standards.json`，在对应语言下添加 Skill 名称：

```json
{
  "languages": {
    "java": ["your-company-java-standard"],
    "typescript": ["ts-strict-mode"],
    "python": ["acme-python-guidelines"]
  }
}
```

### 第三步（可选）：按环境区分规范

如果同一语言在不同项目场景下需要不同规范（如 Android 与 SpringBoot），可以利用 Reality Scanner 的环境检测来区分：

```json
{
  "languages": {
    "java": ["company-java-base"],
    "java:android": ["company-java-base", "android-ui-conventions"],
    "java:springboot": ["company-java-base", "springboot-api-standard"]
  }
}
```

Reality Scanner 在检测到 `build.gradle` 含 Android 插件时，会自动将环境标记为 `java:android`。

---

## 规范的生效链路

```
.opencode/project-standards.json
    │ 读取
    ▼
Reality Scanner（工具）
    │ 发现语言 → 匹配规范列表
    │ 输出 recommendedSkills
    ▼
Orchestrator（主循环）
    │ 将规范 Skill 注入 Implementation Agent 上下文
    ▼
Implementation Agent
    │ 执行 skill("your-company-java-standard")
    │ 读取 SKILL.md 内容
    ▼
代码生成阶段
    │ Agent 自动遵循规范约束
    ▼
QA / Audit Agent
    │ 验证代码是否符合声明的规范
    └─ 不符合 → 产生 Issue → 返回修复
```

---

## 规范编写最佳实践

### DO（推荐）

| 做法 | 原因 |
|------|------|
| 给出**正例和反例**代码 | LLM 对示例的遵从度远高于纯文字描述 |
| 明确使用"必须"/"禁止" | 模糊的"建议"会被 Agent 忽略 |
| 分场景列出约束 | 避免超长段落导致上下文稀释 |
| 保持单个 Skill < 2000 字 | 过长的规范会挤压 Agent 处理业务逻辑的上下文窗口 |
| 声明优先级 | 当规范条目冲突时，明确哪条覆盖哪条 |

### DON'T（避免）

| 做法 | 原因 |
|------|------|
| 把整本《Effective Java》塞进去 | 会严重稀释关键约束的注意力 |
| 依赖外部链接做教程引用 | Agent 无法访问外部 URL |
| 在规范中定义业务逻辑 | 规范只管"怎么写"，不管"写什么" |
| 同义反复（如"代码要写好"） | 没有可执行判断标准的规范等于没有 |

---

## 与知识图谱的关系

编码规范在架构知识图谱中对应以下元素路径：

```
Strategy Layer
  └─ Goal: 代码质量一致性
       │ Realization
Business Layer
  └─ BusinessProcess: 编码与审查流程
       │ Serving
Application Layer
  ├─ ApplicationComponent: project-standards.json (注册中心)
  │    │ Association
  │    └─ DataObject: 规范 Skill 文件集合
  │
  └─ ApplicationComponent: Implementation Agent
       │ Access（读取规范）
       └─ 自动将规范约束应用于代码产出
Technology Layer
  └─ Artifact: .opencode/skills/<standard>/SKILL.md
```

---

## 扩展检查清单

- [ ] 在 `.opencode/skills/<name>/SKILL.md` 创建规范文件
- [ ] YAML frontmatter 包含 `name` 和 `description`
- [ ] 正文使用"必须"/"禁止"等强约束措辞
- [ ] 包含正例/反例代码片段
- [ ] 单文件控制在 2000 字以内
- [ ] 在 `.opencode/project-standards.json` 注册
- [ ] 无需修改任何 Agent Prompt 或核心工具代码
