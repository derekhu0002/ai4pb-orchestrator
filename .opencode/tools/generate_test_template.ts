import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';

import { extractStructuralSymbolsForFile } from '../lib/realityScanner/providers';
import type { StructuralSymbol } from '../lib/realityScanner/types';

const JAVASCRIPT_FAMILY_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const KOTLIN_EXTENSIONS = new Set(['.kt', '.kts']);
const JAVA_EXTENSION = '.java';
const JUNIT_EXTENSIONS = new Set(['.kt', '.kts', '.java']);
const PYTHON_EXTENSION = '.py';

type ExportSummary = {
  namedExports: Set<string>;
  defaultExportName?: string;
};

function normalizeWorkspacePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function getImportPathForSiblingTest(sourceFile: string): string {
  const basename = path.posix.basename(sourceFile, path.posix.extname(sourceFile));
  return `./${basename}`;
}

function inferPythonModulePath(sourceFile: string): string {
  const withoutExtension = sourceFile.slice(0, -PYTHON_EXTENSION.length);
  return withoutExtension.replace(/\//g, '.');
}

function getExportSummaryForTypeScriptFile(relativeFile: string, content: string): ExportSummary {
  const sourceFile = ts.createSourceFile(relativeFile, content, ts.ScriptTarget.Latest, true);
  const namedExports = new Set<string>();
  let defaultExportName: string | undefined;

  const isExportedNode = (node: ts.Node): boolean => {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return Boolean(modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
  };

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && isExportedNode(statement)) {
      namedExports.add(statement.name.text);
      const modifiers = ts.getModifiers(statement);
      if (modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
        defaultExportName = statement.name.text;
      }
      continue;
    }

    if (ts.isClassDeclaration(statement) && statement.name && isExportedNode(statement)) {
      namedExports.add(statement.name.text);
      const modifiers = ts.getModifiers(statement);
      if (modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
        defaultExportName = statement.name.text;
      }
      continue;
    }

    if (ts.isVariableStatement(statement) && isExportedNode(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          namedExports.add(declaration.name.text);
        }
      }
      continue;
    }

    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause) && !statement.moduleSpecifier) {
      for (const element of statement.exportClause.elements) {
        namedExports.add((element.propertyName ?? element.name).text);
      }
      continue;
    }

    if (ts.isExportAssignment(statement) && ts.isIdentifier(statement.expression)) {
      defaultExportName = statement.expression.text;
      namedExports.add(statement.expression.text);
    }
  }

  return { namedExports, defaultExportName };
}

function collectClassMethods(symbols: StructuralSymbol[]): Map<string, string[]> {
  const methodsByClass = new Map<string, string[]>();

  for (const symbol of symbols) {
    if (symbol.kind !== 'method') {
      continue;
    }

    const [className, methodName] = symbol.name.split('.');
    if (!className || !methodName) {
      continue;
    }

    const methods = methodsByClass.get(className) ?? [];
    methods.push(methodName);
    methodsByClass.set(className, unique(methods));
  }

  return methodsByClass;
}

function generateJestTemplate(sourceFile: string, symbols: StructuralSymbol[], content: string): string {
  const exportSummary = getExportSummaryForTypeScriptFile(sourceFile, content);
  const classMethods = collectClassMethods(symbols);
  const exportedFunctions = unique(
    symbols
      .filter((symbol) => symbol.kind === 'function' && exportSummary.namedExports.has(symbol.name))
      .map((symbol) => symbol.name)
  );
  const exportedClasses = unique(
    symbols
      .filter((symbol) => symbol.kind === 'class' && exportSummary.namedExports.has(symbol.name))
      .map((symbol) => symbol.name)
  );

  const fallbackFunctions = unique(symbols.filter((symbol) => symbol.kind === 'function').map((symbol) => symbol.name));
  const fallbackClasses = unique(symbols.filter((symbol) => symbol.kind === 'class').map((symbol) => symbol.name));
  const functionNames = exportedFunctions.length > 0 ? exportedFunctions : fallbackFunctions;
  const classNames = exportedClasses.length > 0 ? exportedClasses : fallbackClasses;
  const namedImports = unique([...functionNames, ...classNames]);
  const importPath = getImportPathForSiblingTest(sourceFile);

  const lines: string[] = [];
  lines.push('// Auto-generated by generate_test_template.');
  lines.push('// TODO: Adjust imports if your test file location differs from the source file.');
  lines.push('');

  if (namedImports.length > 0) {
    lines.push(`import { ${namedImports.join(', ')} } from '${importPath}';`);
  } else if (exportSummary.defaultExportName) {
    lines.push(`import ${exportSummary.defaultExportName} from '${importPath}';`);
  } else {
    lines.push(`import * as moduleUnderTest from '${importPath}';`);
  }

  lines.push('');
  lines.push(`describe('${sourceFile}', () => {`);
  lines.push('  // TODO: Mock dependencies.');
  lines.push('');

  for (const functionName of functionNames) {
    lines.push(`  describe('${functionName}', () => {`);
    lines.push("    it('should behave as expected', () => {");
    lines.push('      // TODO: Arrange inputs and mocked collaborators.');
    lines.push(`      // TODO: const result = ${functionName}(/* args */);`);
    lines.push('      expect(true).toBe(true);');
    lines.push('    });');
    lines.push('  });');
    lines.push('');
  }

  for (const className of classNames) {
    const methods = classMethods.get(className) ?? [];
    lines.push(`  describe('${className}', () => {`);
    lines.push("    it('should instantiate successfully', () => {");
    lines.push(`      const instance = new ${className}();`);
    lines.push(`      expect(instance).toBeInstanceOf(${className});`);
    lines.push('    });');
    lines.push('');

    for (const method of methods) {
      lines.push(`    it('should handle ${method}', () => {`);
      lines.push('      // TODO: Mock dependencies for this class method if needed.');
      lines.push(`      // TODO: const instance = new ${className}();`);
      lines.push(`      // TODO: const result = instance.${method}(/* args */);`);
      lines.push('      expect(true).toBe(true);');
      lines.push('    });');
      lines.push('');
    }

    lines.push('  });');
    lines.push('');
  }

  lines.push('});');
  return lines.join('\n');
}

function generatePytestTemplate(sourceFile: string, symbols: StructuralSymbol[]): string {
  const functionNames = unique(symbols.filter((symbol) => symbol.kind === 'function').map((symbol) => symbol.name));
  const classNames = unique(symbols.filter((symbol) => symbol.kind === 'class').map((symbol) => symbol.name));
  const importNames = unique([...functionNames, ...classNames]);
  const modulePath = inferPythonModulePath(sourceFile);

  const lines: string[] = [];
  lines.push('# Auto-generated by generate_test_template.');
  lines.push('# TODO: Adjust imports if your tests package layout requires different paths.');
  lines.push('');
  lines.push('import pytest');
  if (importNames.length > 0) {
    lines.push(`from ${modulePath} import ${importNames.join(', ')}`);
  } else {
    lines.push(`# TODO: Import symbols from ${modulePath}`);
  }
  lines.push('');

  for (const functionName of functionNames) {
    lines.push(`def test_${functionName}():`);
    lines.push('    # TODO: Mock dependencies using monkeypatch or fixtures.');
    lines.push(`    # TODO: result = ${functionName}(...)`);
    lines.push('    assert True');
    lines.push('');
  }

  for (const className of classNames) {
    const snakeName = className
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .replace(/[^A-Za-z0-9_]+/g, '_')
      .toLowerCase();
    lines.push(`def test_${snakeName}_construction():`);
    lines.push('    # TODO: Mock dependencies using monkeypatch or fixtures.');
    lines.push(`    instance = ${className}()`);
    lines.push(`    assert isinstance(instance, ${className})`);
    lines.push('');
  }

  return lines.join('\n');
}

function generateJUnitJavaTemplate(sourceFile: string, symbols: StructuralSymbol[]): string {
  const classSymbols = symbols.filter((s) => s.kind === 'class');
  const functionSymbols = symbols.filter((s) => s.kind === 'function');
  const classMethods = collectClassMethods(symbols);

  const lines: string[] = [];
  lines.push('// Auto-generated by generate_test_template for Android/Java.');
  lines.push('// TODO: Adjust imports and package declaration to match your project structure.');
  lines.push('');
  lines.push('import org.junit.Test;');
  lines.push('import static org.junit.Assert.*;');
  lines.push('');

  for (const cls of classSymbols) {
    const className = cls.name.split('.').pop() ?? cls.name;
    const methods = classMethods.get(className) ?? [];
    lines.push(`public class ${className}Test {`);
    lines.push('');

    if (methods.length === 0) {
      lines.push('    @Test');
      lines.push('    public void testInstance() {');
      lines.push(`        // TODO: ${className} instance = new ${className}();`);
      lines.push('        assertTrue(true);');
      lines.push('    }');
    }

    for (const method of methods) {
      lines.push('    @Test');
      lines.push(`    public void test${method.charAt(0).toUpperCase() + method.slice(1)}() {`);
      lines.push('        // TODO: Arrange inputs and mocked collaborators');
      lines.push(`        // TODO: ${className} instance = new ${className}();`);
      lines.push(`        // TODO: instance.${method}();`);
      lines.push('        assertTrue(true);');
      lines.push('    }');
      lines.push('');
    }

    lines.push('}');
    lines.push('');
  }

  if (functionSymbols.length > 0) {
    lines.push('// Note: Java does not support top-level functions.');
    lines.push('// The following static methods were detected and wrapped in a test class.');
    lines.push('public class TopLevelFunctionsTest {');
    lines.push('');
    for (const fn of functionSymbols) {
      const fnName = fn.name.split('.').pop() ?? fn.name;
      lines.push('    @Test');
      lines.push(`    public void test${fnName.charAt(0).toUpperCase() + fnName.slice(1)}() {`);
      lines.push('        // TODO: Arrange inputs and mocked collaborators');
      lines.push(`        // TODO: ${fnName}();`);
      lines.push('        assertTrue(true);');
      lines.push('    }');
      lines.push('');
    }
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

function generateJUnitKotlinTemplate(sourceFile: string, symbols: StructuralSymbol[]): string {
  const classSymbols = symbols.filter((s) => s.kind === 'class');
  const functionSymbols = symbols.filter((s) => s.kind === 'function');
  const classMethods = collectClassMethods(symbols);

  const lines: string[] = [];
  lines.push('// Auto-generated by generate_test_template for Android/Kotlin.');
  lines.push('// TODO: Adjust imports if your test file location differs from the source file.');
  lines.push('');
  lines.push('import org.junit.Test');
  lines.push('import org.junit.Assert.*');
  lines.push('');

  for (const cls of classSymbols) {
    const className = cls.name.split('.').pop() ?? cls.name;
    const methods = classMethods.get(className) ?? [];
    lines.push(`class ${className}Test {`);
    lines.push('');

    if (methods.length === 0) {
      lines.push('    @Test');
      lines.push(`    fun testInstance() {`);
      lines.push(`        // TODO: val instance = ${className}()`);
      lines.push('        assertTrue(true)');
      lines.push('    }');
    }

    for (const method of methods) {
      lines.push('    @Test');
      lines.push(`    fun test${method.charAt(0).toUpperCase() + method.slice(1)}() {`);
      lines.push('        // TODO: Arrange inputs and mocked collaborators');
      lines.push(`        // TODO: val instance = ${className}()`);
      lines.push(`        // TODO: val result = instance.${method}()`);
      lines.push('        assertTrue(true)');
      lines.push('    }');
      lines.push('');
    }

    lines.push('}');
    lines.push('');
  }

  if (functionSymbols.length > 0) {
    lines.push('class TopLevelFunctionsTest {');
    lines.push('');
    for (const fn of functionSymbols) {
      const fnName = fn.name.split('.').pop() ?? fn.name;
      lines.push('    @Test');
      lines.push(`    fun test${fnName.charAt(0).toUpperCase() + fnName.slice(1)}() {`);
      lines.push('        // TODO: Arrange inputs and mocked collaborators');
      lines.push(`        // TODO: val result = ${fnName}()`);
      lines.push('        assertTrue(true)');
      lines.push('    }');
      lines.push('');
    }
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

export default tool({
  description: 'Generate a boilerplate test template from AST structural symbols for a source file.',
  args: {
    sourceFile: tool.schema.string().describe('Relative source file path that needs test coverage.'),
    testFramework: tool.schema.string().describe('Target test framework, such as jest, pytest, or junit.'),
  },
  async execute(args, context) {
    const sourceFile = normalizeWorkspacePath(args.sourceFile);
    const framework = args.testFramework.trim().toLowerCase();
    const absoluteFile = path.join(context.worktree, sourceFile);

    if (!sourceFile) {
      return 'Error: sourceFile is required.';
    }

    if (!fs.existsSync(absoluteFile)) {
      return `Error: source file not found: ${sourceFile}`;
    }

    let content = '';
    try {
      content = fs.readFileSync(absoluteFile, 'utf8');
    } catch (error) {
      return `Error: failed to read ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`;
    }

    const symbols = extractStructuralSymbolsForFile(sourceFile, content, context.worktree);
    if (symbols.length === 0) {
      return `Error: no structural symbols found for ${sourceFile}. The file may be empty or use an unsupported language.`;
    }

    const extension = path.posix.extname(sourceFile).toLowerCase();
    if (framework === 'jest') {
      if (!JAVASCRIPT_FAMILY_EXTENSIONS.has(extension)) {
        return `Error: jest templates are only supported for JavaScript/TypeScript source files. Received ${sourceFile}.`;
      }

      return generateJestTemplate(sourceFile, symbols, content);
    }

    if (framework === 'pytest') {
      if (extension !== PYTHON_EXTENSION) {
        return `Error: pytest templates are only supported for Python source files. Received ${sourceFile}.`;
      }

      return generatePytestTemplate(sourceFile, symbols);
    }

    if (framework === 'junit') {
      if (!JUNIT_EXTENSIONS.has(extension)) {
        return `Error: junit templates are only supported for Java and Kotlin source files (.java, .kt, .kts). Received ${sourceFile}.`;
      }

      if (extension === JAVA_EXTENSION) {
        return generateJUnitJavaTemplate(sourceFile, symbols);
      }

      return generateJUnitKotlinTemplate(sourceFile, symbols);
    }

    return `Error: unsupported testFramework "${args.testFramework}". Supported values are jest, pytest, and junit.`;
  },
});