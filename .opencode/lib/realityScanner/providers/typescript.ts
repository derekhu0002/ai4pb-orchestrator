import * as ts from 'typescript';

import type { StructuralSymbol } from '../types';
import type { RealityScannerLanguageProvider } from './types';

function getSourceFileLine(sourceFile: ts.SourceFile, position: number): number {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function formatParameters(sourceFile: ts.SourceFile, parameters: readonly ts.ParameterDeclaration[]): string {
  return parameters
    .map((parameter) => {
      const name = parameter.name.getText(sourceFile);
      const type = parameter.type?.getText(sourceFile);
      return type ? `${name}: ${type}` : name;
    })
    .join(', ');
}

function createSymbol(
  languageId: string,
  relativeFile: string,
  line: number,
  kind: string,
  name: string,
  signature: string,
  snippet: string
): StructuralSymbol {
  return {
    file: relativeFile,
    line,
    kind,
    name,
    signature,
    snippet,
    source: 'ast',
    languageId,
  };
}

function extractTypeScriptFamilySymbols(languageId: string, relativeFile: string, content: string): StructuralSymbol[] {
  const sourceFile = ts.createSourceFile(relativeFile, content, ts.ScriptTarget.Latest, true);
  const symbols: StructuralSymbol[] = [];

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node) && node.name) {
      const name = node.name.getText(sourceFile);
      symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, node.getStart(sourceFile)), 'class', name, `class ${name}`, node.getText(sourceFile)));
    } else if (ts.isInterfaceDeclaration(node)) {
      const name = node.name.getText(sourceFile);
      symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, node.getStart(sourceFile)), 'interface', name, `interface ${name}`, node.getText(sourceFile)));
    } else if (ts.isTypeAliasDeclaration(node)) {
      const name = node.name.getText(sourceFile);
      symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, node.getStart(sourceFile)), 'type', name, `type ${name}`, node.getText(sourceFile)));
    } else if (ts.isFunctionDeclaration(node) && node.name) {
      const name = node.name.getText(sourceFile);
      const parameters = formatParameters(sourceFile, node.parameters);
      const returnType = node.type?.getText(sourceFile);
      const signature = `function ${name}(${parameters})${returnType ? `: ${returnType}` : ''}`;
      symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, node.getStart(sourceFile)), 'function', name, signature, node.getText(sourceFile)));
    } else if (ts.isMethodDeclaration(node) && node.name && ts.isClassLike(node.parent) && node.parent.name) {
      const className = node.parent.name.getText(sourceFile);
      const methodName = node.name.getText(sourceFile);
      const parameters = formatParameters(sourceFile, node.parameters);
      const returnType = node.type?.getText(sourceFile);
      const signature = `${className}.${methodName}(${parameters})${returnType ? `: ${returnType}` : ''}`;
      symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, node.getStart(sourceFile)), 'method', `${className}.${methodName}`, signature, node.getText(sourceFile)));
    } else if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) {
          continue;
        }

        const name = declaration.name.getText(sourceFile);
        const initializer = declaration.initializer;
        if (initializer && (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))) {
          const parameters = formatParameters(sourceFile, initializer.parameters);
          const returnType = initializer.type?.getText(sourceFile);
          const signature = `function ${name}(${parameters})${returnType ? `: ${returnType}` : ''}`;
          symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, declaration.getStart(sourceFile)), 'function', name, signature, declaration.getText(sourceFile)));
        } else {
          const type = declaration.type?.getText(sourceFile);
          const signature = `variable ${name}${type ? `: ${type}` : ''}`;
          symbols.push(createSymbol(languageId, relativeFile, getSourceFileLine(sourceFile, declaration.getStart(sourceFile)), 'variable', name, signature, declaration.getText(sourceFile)));
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return symbols;
}

export const typeScriptLanguageProvider: RealityScannerLanguageProvider = {
  languageId: 'typescript',
  extractionMode: 'ast',
  extractSymbols: (relativeFile, content) => extractTypeScriptFamilySymbols('typescript', relativeFile, content),
};

export const javaScriptLanguageProvider: RealityScannerLanguageProvider = {
  languageId: 'javascript',
  extractionMode: 'ast',
  extractSymbols: (relativeFile, content) => extractTypeScriptFamilySymbols('javascript', relativeFile, content),
};