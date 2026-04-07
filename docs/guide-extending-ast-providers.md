# 扩展抽象语法树 (AST) 解析器指南

> 本指南面向希望为 AI4PB Reality Scanner 添加新语言支持的开发者。

---

## 背景：AST 在 AI4PB 中的角色

AI4PB 通过 `run_reality_scanner` 工具对代码仓进行物理级扫描，提取出**结构符号 (StructuralSymbol)**——类名、函数签名、导出变量等，然后与知识图谱中的 `ApplicationComponent` 节点进行意图-现实比对。这一切的基础都建立在 **AST（抽象语法树）解析** 之上。

### 当前已内置的解析引擎

| 语言 | 解析引擎 | 提取能力 |
|------|----------|----------|
| TypeScript / JavaScript | TS Compiler API | 类、函数、接口、导出变量、装饰器 |
| Java / Go / C# | Tree-sitter (WASM) | 类、方法、接口、包结构 |
| Python | 原生 `ast` 模块 (子进程) | 类、函数、模块级变量、装饰器 |

### 核心数据结构

每个 AST Provider 最终产出的是 `StructuralSymbol` 数组：

```typescript
interface StructuralSymbol {
  name: string;           // 符号名称，如 "UserService"
  kind: string;           // 符号类型：class | function | interface | variable | method
  line: number;           // 源文件行号
  signature: string;      // 完整签名，如 "export class UserService extends BaseService"
  snippet: string;        // 上下文代码片段（3-5行）
  languageId: string;     // 语言标识：typescript | python | java | go ...
  file: string;           // 相对于项目根目录的文件路径
}
```

---

## 扩展步骤

### 第一步：实现 Provider 函数

在 `.opencode/tools/run_reality_scanner.ts` 中找到 `extractStructuralSymbolsForFile` 函数，这是所有语言解析的统一入口。你需要为新语言添加一个分支：

```typescript
// 在 extractStructuralSymbolsForFile 函数内部
function extractStructuralSymbolsForFile(
  relativeFile: string,
  content: string,
  worktree: string
): StructuralSymbol[] {
  const ext = path.extname(relativeFile).toLowerCase();

  // === 新增：Rust 支持 ===
  if (ext === '.rs') {
    return extractRustSymbols(relativeFile, content);
  }

  // ... 已有的 TS / Python / Java 分支
}
```

### 第二步：选择解析策略

根据复杂度可选择三种策略：

#### 策略 A：Tree-sitter（推荐 — 适用于绝大多数编译型语言）

```typescript
import Parser from 'tree-sitter';
import Rust from 'tree-sitter-rust';  // npm install tree-sitter-rust

function extractRustSymbols(file: string, content: string): StructuralSymbol[] {
  const parser = new Parser();
  parser.setLanguage(Rust);
  const tree = parser.parse(content);
  const symbols: StructuralSymbol[] = [];

  // 遍历 AST 节点，提取 function_item / struct_item / impl_item 等
  walkTree(tree.rootNode, (node) => {
    if (node.type === 'function_item') {
      symbols.push({
        name: node.childForFieldName('name')?.text ?? '',
        kind: 'function',
        line: node.startPosition.row + 1,
        signature: content.substring(node.startIndex, node.startIndex + 120),
        snippet: extractSnippet(content, node.startPosition.row),
        languageId: 'rust',
        file: file,
      });
    }
    // ... struct_item, impl_item, trait_item 等
  });

  return symbols;
}
```

#### 策略 B：正则快速解析（适用于简单脚本语言）

```typescript
function extractShellSymbols(file: string, content: string): StructuralSymbol[] {
  const symbols: StructuralSymbol[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^function\s+(\w+)/);
    if (match) {
      symbols.push({
        name: match[1],
        kind: 'function',
        line: i + 1,
        signature: lines[i].trim(),
        snippet: lines.slice(Math.max(0, i - 1), i + 4).join('\n'),
        languageId: 'shellscript',
        file: file,
      });
    }
  }
  return symbols;
}
```

#### 策略 C：子进程调用原生工具（适用于已有成熟 CLI 的语言）

```typescript
function extractRubySymbols(file: string, content: string): StructuralSymbol[] {
  // 将内容写入临时文件，调用 Ruby 的 ripper 做 AST 提取
  const result = execSync(`ruby -e "require 'ripper'; ..." < tmpfile`);
  return JSON.parse(result.toString());
}
```

### 第三步：注册语言检测

在 Reality Scanner 的环境检测逻辑中，确保新语言文件能被识别和统计：

```typescript
// 在 LanguageSupport 检测逻辑中
if (filesByExtension['.rs']?.length > 0) {
  languageSupport.push({
    language: 'rust',
    astBacked: true,        // 有完整 AST 解析
    fileCount: filesByExtension['.rs'].length,
    provider: 'tree-sitter-rust',
  });
}
```

### 第四步：验证——无需修改任何 Agent

这是 AI4PB 开闭原则的核心所在。一旦你完成上述注册：

1. **Audit Agent** 自动获得对 `.rs` 文件的 `@ArchitectureID` 追踪能力
2. **QA Agent** 自动在测试覆盖率检查中包含 Rust 模块
3. **Implementation Agent** 在代码变更摘要中自动包含 Rust 符号变更
4. **Knowledge Graph** 通过 `architecture-mapping.yaml` 声明性地将 Rust 文件映射到架构节点

```yaml
# architecture-mapping.yaml
mappings:
  - architectureId: ELM-APP-CRYPTO
    paths: [src/crypto/mod.rs]
    globs: [src/crypto/**/*.rs]
    symbols: [CryptoEngine, sign_message, verify_signature]
```

---

## 架构参考关系

以下是 AST 解析在知识图谱中的架构位置：

```
Strategy Layer
  └─ Goal: 意图与现实对齐
       │ Realization
Business Layer
  └─ BusinessProcess: Audit 流程
       │ Serving
Application Layer
  ├─ ApplicationComponent: run_reality_scanner
  │    │ Access
  │    └─ DataObject: StructuralSymbol[]
  │         │ Association
  │         └─ 你的新 AST Provider (扩展点)
  │
  └─ ApplicationComponent: generate_gap_report
       │ Flow (消费 StructuralSymbol 数据)
Technology Layer
  └─ Artifact: .opencode/tools/run_reality_scanner.ts
```

---

## 扩展检查清单

- [ ] 实现 `extract<Language>Symbols()` 函数，返回 `StructuralSymbol[]`
- [ ] 在 `extractStructuralSymbolsForFile` 中添加文件扩展名分支
- [ ] 在 LanguageSupport 检测中注册新语言及其 `astBacked` 状态
- [ ] 在 `architecture-mapping.yaml` 中验证映射声明可被识别
- [ ] 运行 Reality Scanner 确认新语言文件被提取和统计
- [ ] 无需修改任何 Agent Prompt 或 Skill 文件
