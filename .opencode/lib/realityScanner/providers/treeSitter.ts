import Parser from 'tree-sitter';

import type { StructuralSymbol } from '../types';
import type { RealityScannerLanguageProvider } from './types';

type SymbolKind =
  | 'class'
  | 'interface'
  | 'enum'
  | 'struct'
  | 'record'
  | 'function'
  | 'method'
  | 'constructor'
  | 'property'
  | 'variable'
  | 'type';

type NodeMatcher = {
  nodeTypes: string[];
  kind: SymbolKind;
  multi?: boolean;
  collect: (args: {
    node: Parser.SyntaxNode;
    content: string;
    languageId: string;
    ancestors: string[];
  }) => StructuralSymbol[];
};

type TreeSitterProviderConfig = {
  languageId: string;
  language: Parser.Language;
  matchers: NodeMatcher[];
};

function snippetFromNode(content: string, node: Parser.SyntaxNode): string {
  return content.slice(node.startIndex, node.endIndex);
}

function firstLineSnippet(content: string, node: Parser.SyntaxNode): string {
  const raw = snippetFromNode(content, node).split(/\r?\n/, 1)[0] ?? '';
  return raw.trim();
}

function lineOf(node: Parser.SyntaxNode): number {
  return node.startPosition.row + 1;
}

function fieldText(node: Parser.SyntaxNode, fieldName: string, content: string): string | undefined {
  const child = node.childForFieldName(fieldName);
  if (!child) {
    return undefined;
  }
  return snippetFromNode(content, child).trim();
}

function findChildrenByType(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode[] {
  return node.namedChildren.filter((child) => child.type === type);
}

function createSymbol(
  languageId: string,
  file: string,
  line: number,
  kind: SymbolKind,
  name: string,
  signature: string,
  snippet: string
): StructuralSymbol {
  return {
    file,
    line,
    kind,
    name,
    signature,
    snippet,
    source: 'ast',
    languageId,
  };
}

export function classLikeMatcher(nodeTypes: string[], kind: Extract<SymbolKind, 'class' | 'interface' | 'enum' | 'struct' | 'record'>): NodeMatcher {
  return {
    nodeTypes,
    kind,
    collect: ({ node, content, languageId, ancestors }) => {
      const rawName = fieldText(node, 'name', content);
      if (!rawName) {
        return [];
      }
      const qualifiedName = ancestors.length > 0 ? `${ancestors[ancestors.length - 1]}.${rawName}` : rawName;
      return [createSymbol(languageId, '', lineOf(node), kind, qualifiedName, `${kind} ${qualifiedName}`, firstLineSnippet(content, node))];
    },
  };
}

export function namedNodeMatcher(nodeTypes: string[], kind: Extract<SymbolKind, 'type' | 'record' | 'struct' | 'enum' | 'interface' | 'class'>): NodeMatcher {
  return {
    nodeTypes,
    kind,
    collect: ({ node, content, languageId, ancestors }) => {
      const rawName = fieldText(node, 'name', content);
      if (!rawName) {
        return [];
      }
      const qualifiedName = ancestors.length > 0 ? `${ancestors[ancestors.length - 1]}.${rawName}` : rawName;
      return [createSymbol(languageId, '', lineOf(node), kind, qualifiedName, `${kind} ${qualifiedName}`, firstLineSnippet(content, node))];
    },
  };
}

export function methodMatcher(nodeTypes: string[], options?: { useOwner?: boolean; constructor?: boolean }): NodeMatcher {
  return {
    nodeTypes,
    kind: options?.constructor ? 'constructor' : 'method',
    collect: ({ node, content, languageId, ancestors }) => {
      const owner = ancestors[ancestors.length - 1];
      const name = options?.constructor ? owner : fieldText(node, 'name', content);
      if (!name) {
        return [];
      }
      const finalName = owner && !options?.constructor ? `${owner}.${name}` : name;
      return [
        createSymbol(
          languageId,
          '',
          lineOf(node),
          options?.constructor ? 'constructor' : 'method',
          finalName,
          firstLineSnippet(content, node),
          firstLineSnippet(content, node)
        ),
      ];
    },
  };
}

export function functionMatcher(nodeTypes: string[]): NodeMatcher {
  return {
    nodeTypes,
    kind: 'function',
    collect: ({ node, content, languageId }) => {
      const name = fieldText(node, 'name', content);
      if (!name) {
        return [];
      }
      return [createSymbol(languageId, '', lineOf(node), 'function', name, firstLineSnippet(content, node), firstLineSnippet(content, node))];
    },
  };
}

export function propertyMatcher(nodeTypes: string[], variableNodeType: string): NodeMatcher {
  return {
    nodeTypes,
    kind: 'property',
    multi: true,
    collect: ({ node, content, languageId, ancestors }) => {
      const owner = ancestors[ancestors.length - 1];
      const names = findChildrenByType(node, variableNodeType).map((child) => fieldText(child, 'name', content) ?? snippetFromNode(content, child).trim());
      return names
        .filter(Boolean)
        .map((name) => createSymbol(languageId, '', lineOf(node), 'property', owner ? `${owner}.${name}` : name, firstLineSnippet(content, node), firstLineSnippet(content, node)));
    },
  };
}

export function variableMatcher(nodeTypes: string[], variableNodeType: string): NodeMatcher {
  return {
    nodeTypes,
    kind: 'variable',
    multi: true,
    collect: ({ node, content, languageId }) => {
      const names = findChildrenByType(node, variableNodeType).map((child) => fieldText(child, 'name', content) ?? snippetFromNode(content, child).trim());
      return names
        .filter(Boolean)
        .map((name) => createSymbol(languageId, '', lineOf(node), 'variable', name, firstLineSnippet(content, node), firstLineSnippet(content, node)));
    },
  };
}

export function identifierListVariableMatcher(nodeTypes: string[]): NodeMatcher {
  return {
    nodeTypes,
    kind: 'variable',
    multi: true,
    collect: ({ node, content, languageId }) => {
      const identifiers = node.namedChildren.filter((child) => child.type === 'identifier');
      return identifiers.map((identifier) => {
        const name = snippetFromNode(content, identifier).trim();
        return createSymbol(languageId, '', lineOf(node), 'variable', name, firstLineSnippet(content, node), firstLineSnippet(content, node));
      });
    },
  };
}

function traverseTree(
  node: Parser.SyntaxNode,
  config: TreeSitterProviderConfig,
  content: string,
  relativeFile: string,
  ancestors: string[],
  results: StructuralSymbol[]
): void {
  const matcher = config.matchers.find((item) => item.nodeTypes.includes(node.type));
  let nextAncestors = ancestors;

  if (matcher) {
    const symbols = matcher.collect({ node, content, languageId: config.languageId, ancestors });
    for (const symbol of symbols) {
      results.push({ ...symbol, file: relativeFile });
    }

    if (matcher.kind === 'class' || matcher.kind === 'interface' || matcher.kind === 'struct' || matcher.kind === 'record') {
      const last = symbols[0]?.name?.split('.').pop();
      if (last) {
        nextAncestors = [...ancestors, last];
      }
    }
  }

  for (const child of node.namedChildren) {
    traverseTree(child, config, content, relativeFile, nextAncestors, results);
  }
}

export function createTreeSitterLanguageProvider(config: TreeSitterProviderConfig): RealityScannerLanguageProvider {
  return {
    languageId: config.languageId,
    extractionMode: 'ast',
    extractSymbols(relativeFile, content) {
      const parser = new Parser();
      parser.setLanguage(config.language);
      const tree = parser.parse(content);
      const symbols: StructuralSymbol[] = [];
      traverseTree(tree.rootNode, config, content, relativeFile, [], symbols);
      return symbols;
    },
  };
}