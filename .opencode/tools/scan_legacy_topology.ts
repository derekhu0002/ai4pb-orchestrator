import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { inferModulePath } from '../lib/realityScanner/moduleTopology';
import { extractStructuralSymbolsForFile } from '../lib/realityScanner/providers';
import type { StructuralSymbol } from '../lib/realityScanner/types';
import { asJson, collectReadableWorkspaceFiles, safeSnippet } from '../lib/runtimeState';

const MAX_FILE_BYTES = 200_000;
const MAX_MODULES = 20;
const MAX_TOP_SYMBOLS = 10;

type TopSymbolOutput = {
  name: string;
  kind: string;
  signature: string;
  docSnippet?: string;
};

type RankedModuleSummary = {
  path: string;
  fileCount: number;
  topSymbols: TopSymbolOutput[];
  coreSymbolCount: number;
};

type ModuleOutput = {
  path: string;
  fileCount: number;
  topSymbols: TopSymbolOutput[];
};

type RankedSymbol = {
  docSnippet?: string;
  signature: string;
  weight: number;
  kind: string;
  name: string;
  file: string;
  line: number;
};

function getSymbolPriority(kind: string): number {
  switch (kind) {
    case 'class':
    case 'interface':
    case 'struct':
    case 'record':
      return 4;
    case 'function':
      return 3;
    case 'enum':
    case 'type':
      return 2;
    case 'method':
    case 'constructor':
      return 1;
    default:
      return 0;
  }
}

function normalizeSignature(symbol: StructuralSymbol): string {
  return safeSnippet(symbol.signature.replace(/\s+/g, ' ').trim(), 160);
}

function normalizeDocSnippet(symbol: StructuralSymbol): string | undefined {
  const normalized = symbol.snippet
    .split(/\r?\n\s*\r?\n/)[0]
    ?.split(/\r?\n/)
    .slice(0, 3)
    .join('\n')
    .trim();

  if (!normalized) {
    return undefined;
  }

  const compact = safeSnippet(normalized.replace(/\s+/g, ' ').trim(), 200);
  return compact || undefined;
}

function rankSymbols(symbols: StructuralSymbol[]): RankedSymbol[] {
  const seen = new Set<string>();
  const ranked: RankedSymbol[] = [];

  for (const symbol of symbols) {
    const priority = getSymbolPriority(symbol.kind);
    if (priority <= 0) {
      continue;
    }

    const signature = normalizeSignature(symbol);
    if (!signature) {
      continue;
    }

    const identity = `${symbol.kind}:${signature}`;
    if (seen.has(identity)) {
      continue;
    }
    seen.add(identity);

    ranked.push({
      docSnippet: normalizeDocSnippet(symbol),
      signature,
      weight: priority,
      kind: symbol.kind,
      name: symbol.name,
      file: symbol.file,
      line: symbol.line,
    });
  }

  return ranked.sort(
    (left, right) =>
      right.weight - left.weight ||
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.name.localeCompare(right.name) ||
      left.signature.localeCompare(right.signature)
  );
}

function summarizeLegacyTopology(worktree: string): { scannedFiles: number; totalModules: number; modules: ModuleOutput[] } {
  const files = collectReadableWorkspaceFiles(worktree, MAX_FILE_BYTES);
  const modules = new Map<string, { files: Set<string>; symbols: StructuralSymbol[] }>();

  for (const relativeFile of files) {
    const absoluteFile = path.join(worktree, relativeFile);
    try {
      const content = fs.readFileSync(absoluteFile, 'utf8');
      const modulePath = inferModulePath(relativeFile);
      const existing = modules.get(modulePath) ?? { files: new Set<string>(), symbols: [] };

      existing.files.add(relativeFile);
      existing.symbols.push(...extractStructuralSymbolsForFile(relativeFile, content, worktree));
      modules.set(modulePath, existing);
    } catch {
      // Ignore unreadable text files and continue scanning the worktree.
    }
  }

  const summarizedModules = [...modules.entries()]
    .map(([modulePath, aggregate]) => {
      const rankedSymbols = rankSymbols(aggregate.symbols);
      return {
        path: modulePath,
        fileCount: aggregate.files.size,
        coreSymbolCount: rankedSymbols.length,
        topSymbols: rankedSymbols.slice(0, MAX_TOP_SYMBOLS).map((symbol) => ({
          name: symbol.name,
          kind: symbol.kind,
          signature: symbol.signature,
          ...(symbol.docSnippet ? { docSnippet: symbol.docSnippet } : {}),
        })),
      } satisfies RankedModuleSummary;
    })
    .sort(
      (left, right) =>
        right.fileCount - left.fileCount ||
        right.coreSymbolCount - left.coreSymbolCount ||
        left.path.localeCompare(right.path)
    )
    .slice(0, MAX_MODULES)
    .map(({ path: modulePath, fileCount, topSymbols }) => ({
      path: modulePath,
      fileCount,
      topSymbols,
    }));

  return {
    scannedFiles: files.length,
    totalModules: modules.size,
    modules: summarizedModules,
  };
}

export default tool({
  description:
    'Scan the current worktree, group files into inferred physical modules, and return the largest legacy modules with their most important structural signatures.',
  args: {},
  async execute(_args, context) {
    return asJson(summarizeLegacyTopology(context.worktree));
  },
});