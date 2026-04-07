# 扩展测试工具 (Testing Tools) 指南

> 本指南面向希望扩展 AI4PB 测试生成、测试执行和覆盖率验证能力的开发者。

---

## 背景：测试工具在 AI4PB 中的角色

AI4PB 的 QA Agent 不是一个"随便写几个测试"的辅助角色。它是架构闭环中的强制关卡：

1. **`generate_test_cases`** — 根据 Git 提交变更精准推导测试计划
2. **`generate_test_template`** — 基于 AST 解析生成测试骨架代码
3. **`quality-assurance-cycle` Skill** — 定义完整的 TDD 验证流程

### 硬性规则

> 凡是通过 `@ArchitectureID` 绑定到架构节点的代码模块，**必须**有对应的自动化测试文件。缺失即阻断 (Block)。

---

## 工具体系架构

```
QA Agent
  │
  ├─ generate_test_cases (工具)
  │    │ 输入：commitId, RuntimeState
  │    │ 输出：测试计划 (哪些模块需要测试、现有覆盖率、缺失项)
  │    │
  │    └─ 内部调用 Reality Scanner
  │         └─ AST 提取 → 识别导出符号 → 匹配 *.spec.* / *.test.* 文件
  │
  ├─ generate_test_template (工具)
  │    │ 输入：sourceFile, testFramework
  │    │ 输出：测试骨架代码 (import, describe, it/test 结构)
  │    │
  │    └─ 内部调用 AST Provider
  │         └─ 提取类名、方法签名 → 生成对应 describe/it 块
  │
  └─ skill("quality-assurance-cycle")
       └─ 端到端验证流程定义
```

---

## 扩展方向一：支持新的测试框架

### 当前已支持的框架

| 语言 | 测试框架 | 检测模式 |
|------|----------|----------|
| TypeScript / JavaScript | Jest | `*.spec.ts`, `*.test.ts`, `__tests__/` |
| Python | pytest | `test_*.py`, `*_test.py`, `tests/` |
| Java | JUnit | `*Test.java`, `src/test/` |

### 添加新框架支持

**Step 1**: 在 `generate_test_template` 工具中添加框架模板

```typescript
// .opencode/tools/generate_test_template.ts
function generateTemplate(
  sourceFile: string,
  symbols: StructuralSymbol[],
  framework: string
): string {
  switch (framework) {
    case 'jest':     return generateJestTemplate(sourceFile, symbols);
    case 'pytest':   return generatePytestTemplate(sourceFile, symbols);
    case 'vitest':   return generateVitestTemplate(sourceFile, symbols);  // 新增
    case 'gotest':   return generateGoTestTemplate(sourceFile, symbols);  // 新增
    default:         return generateGenericTemplate(sourceFile, symbols);
  }
}

// === 新增：Vitest 模板生成 ===
function generateVitestTemplate(sourceFile: string, symbols: StructuralSymbol[]): string {
  const importPath = sourceFile.replace(/\.tsx?$/, '');
  const lines: string[] = [];

  lines.push(`import { describe, it, expect, vi } from 'vitest';`);
  lines.push(`import { ${symbols.map(s => s.name).join(', ')} } from '${importPath}';`);
  lines.push('');

  for (const sym of symbols) {
    if (sym.kind === 'class') {
      lines.push(`describe('${sym.name}', () => {`);
      lines.push(`  it('should instantiate correctly', () => {`);
      lines.push(`    // TODO: Implement test`);
      lines.push(`    expect(new ${sym.name}()).toBeDefined();`);
      lines.push(`  });`);
      lines.push(`});`);
    } else if (sym.kind === 'function') {
      lines.push(`describe('${sym.name}', () => {`);
      lines.push(`  it('should return expected result', () => {`);
      lines.push(`    // TODO: Implement test with proper arguments`);
      lines.push(`    const result = ${sym.name}();`);
      lines.push(`    expect(result).toBeDefined();`);
      lines.push(`  });`);
      lines.push(`});`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

**Step 2**: 在测试文件检测模式中注册

```typescript
// 在 generate_test_cases 工具的 detectExistingTests() 里
const TEST_FILE_PATTERNS: Record<string, RegExp[]> = {
  typescript: [/\.spec\.tsx?$/, /\.test\.tsx?$/, /__tests__\//],
  python:     [/^test_.*\.py$/, /_test\.py$/,    /\/tests\//],
  java:       [/Test\.java$/,                     /\/src\/test\//],
  go:         [/_test\.go$/],                                      // 新增
  rust:       [/\/tests\/.*\.rs$/, /#\[cfg\(test\)\]/],            // 新增
};
```

---

## 扩展方向二：自定义测试沙盒

当项目需要特殊的运行环境来执行测试时（如浏览器扩展、移动端、嵌入式），可以创建专用沙盒工具。

### 实现模式

创建新工具文件 `.opencode/tools/run_<env>_sandbox.ts`：

```typescript
// .opencode/tools/run_chrome_sandbox.ts
import { tool } from '@opencode-ai/plugin';

export default tool({
  name: 'run_chrome_sandbox',
  description: 'Run tests in a Chrome Extension sandbox environment',
  schema: {
    testFile: { type: 'string', description: 'Test file to execute' },
    manifestPath: { type: 'string', default: 'manifest.json' },
  },
  async execute({ testFile, manifestPath }, context) {
    // 1. 验证 manifest.json 存在且有效
    // 2. 启动 headless Chrome 实例
    // 3. 加载扩展
    // 4. 执行测试文件
    // 5. 收集并返回结果
    const result = await context.bash(
      `npx playwright test ${testFile} --config=playwright.chrome-ext.config.ts`
    );
    return {
      passed: result.exitCode === 0,
      output: result.stdout,
      coverage: parseCoverage(result.stdout),
    };
  }
});
```

### 环境自动发现

Reality Scanner 通过文件签名检测项目环境，自动将沙盒工具加入 Agent 的可用工具集：

```typescript
// Reality Scanner 环境检测逻辑
if (fileExists('manifest.json') && readJSON('manifest.json').manifest_version) {
  detectedEnvironments.push('chrome-extension');
  recommendedTools.push('run_chrome_sandbox');
}
```

QA Agent 在执行时会自动选用匹配的沙盒工具，无需手动指定。

---

## 扩展方向三：自定义覆盖率规则

### 默认规则

- 每个 `@ArchitectureID` 绑定的模块必须有对应测试文件
- 缺失即阻断，不允许静默跳过

### 添加自定义验证规则

在 `quality-assurance-cycle` Skill 中声明或通过工具扩展实现：

**方式 A：在 Skill 中声明性定义**

编辑 `.opencode/skills/quality-assurance-cycle/SKILL.md`，在 `BEHAVIORAL RULES` 部分追加：

```markdown
## 自定义覆盖率规则

- 核心业务模块（类型为 ApplicationService）：行覆盖率 ≥ 80%
- 数据传输对象（类型为 DataObject）：仅需 Schema 验证测试
- 工具函数（无架构绑定）：鼓励但不强制
- API 端点：必须包含 Happy Path + 至少 1 个错误路径测试
```

**方式 B：在工具中编程实现**

```typescript
// 在 generate_test_cases.ts 中扩展验证逻辑
function validateCoverage(
  module: ArchitectureModule,
  testFiles: string[],
  coverageReport: CoverageData
): ValidationResult {
  const rules: CoverageRule[] = [
    // 默认：必须有测试文件
    { condition: () => testFiles.length === 0, severity: 'block', message: 'Missing test file' },

    // 自定义：ApplicationService 需要 80% 行覆盖
    {
      condition: () =>
        module.type === 'ApplicationService' &&
        (coverageReport.lineCoverage ?? 0) < 80,
      severity: 'block',
      message: `ApplicationService requires >=80% line coverage, got ${coverageReport.lineCoverage}%`
    },

    // 自定义：API 端点需要错误路径测试
    {
      condition: () =>
        module.type === 'ApplicationInterface' &&
        !hasErrorPathTests(testFiles),
      severity: 'warn',
      message: 'API endpoint missing error path test'
    },
  ];

  return evaluateRules(rules);
}
```

---

## 与知识图谱的关系

测试工具体系在架构知识图谱中的位置：

```
Strategy Layer
  └─ Goal: 代码质量门禁
       │ Realization
Business Layer
  └─ BusinessProcess: QA 验证流程
       │ Serving
Application Layer
  ├─ ApplicationComponent: generate_test_cases
  │    │ Access
  │    └─ DataObject: TestPlan (commitId, 覆盖率, 缺失项)
  │
  ├─ ApplicationComponent: generate_test_template
  │    │ Access
  │    └─ DataObject: TestSkeleton (import, describe, it 块)
  │
  ├─ ApplicationComponent: run_<env>_sandbox (扩展点)
  │    │ Flow
  │    └─ DataObject: TestResult (passed, output, coverage)
  │
  └─ ApplicationComponent: quality-assurance-cycle (Skill)
       │ 编排以上工具的端到端流程
Technology Layer
  ├─ Artifact: .opencode/tools/generate_test_cases.ts
  ├─ Artifact: .opencode/tools/generate_test_template.ts
  └─ Artifact: .opencode/skills/quality-assurance-cycle/SKILL.md
```

---

## 完整扩展流程示例

以"为 Go 项目添加测试支持"为例：

```
1. AST 解析（参见 guide-extending-ast-providers.md）
   └─ 实现 extractGoSymbols()
   └─ 注册 .go 文件扩展名

2. 测试文件检测
   └─ TEST_FILE_PATTERNS.go = [/_test\.go$/]

3. 测试模板生成
   └─ generateGoTestTemplate() → 产出 *_test.go 骨架
   └─ 使用 testing.T 标准库结构

4. 覆盖率验证
   └─ 在 generate_test_cases 中：
      go test -coverprofile=coverage.out ./...

5. （可选）自定义沙盒
   └─ 如有 CGO 或特殊编译需求，创建 run_go_sandbox.ts

完成后：QA Agent 自动获得 Go 项目的完整 TDD 闭环能力。
```

---

## 扩展检查清单

- [ ] 在 `TEST_FILE_PATTERNS` 中注册新语言的测试文件匹配规则
- [ ] 在 `generate_test_template` 中添加对应框架的骨架生成逻辑
- [ ] （可选）创建环境专用沙盒工具 `.opencode/tools/run_<env>_sandbox.ts`
- [ ] （可选）在 `quality-assurance-cycle` Skill 中追加覆盖率约束
- [ ] 确认 Reality Scanner 能检测到新语言的测试文件
- [ ] 无需修改 QA Agent Prompt — 工具自动被发现和调用
