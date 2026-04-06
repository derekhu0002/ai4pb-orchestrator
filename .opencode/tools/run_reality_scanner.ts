import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { detectEnvironmentProfiles } from '../lib/realityScanner/environmentRegistry';
import { extractStructuralSymbolsForFile, summarizeLanguageSupport } from '../lib/realityScanner/providers';
import type { ArchitectureReference, LanguageSupport, MappingFileSummary, ScanResult, SemanticTrace, StructuralSymbol } from '../lib/realityScanner/types';
import { buildTokenVector, cosineSimilarity } from '../lib/realityScanner/semanticUtils';
import { asJson, collectReadableWorkspaceFiles, safeSnippet } from '../lib/runtimeState';
import { loadCanonicalKnowledgeGraph } from '../lib/sharedKnowledgeGraph';

const MAX_FILE_BYTES = 200_000;
const MAX_ARCHITECTURE_REFERENCES = 200;
const MAX_STRUCTURAL_SYMBOLS = 300;
const MAX_SEMANTIC_TRACES = 200;
const MAX_SEMANTIC_CANDIDATES = 3;
const MIN_SEMANTIC_SCORE = 0.12;

type MappingEntry = {
  architectureId: string;
  paths: string[];
  globs: string[];
  symbols: string[];
  sourceFile: string;
};

type SemanticElement = {
  architectureId: string;
  title: string;
  elementType: string;
  documentation: string;
  vector: Map<string, number>;
};

const ARCHITECTURE_ID_PATTERN = /@ArchitectureID:\s*([^\r\n]+)/g;

const MAPPING_FILE_CANDIDATES = [
  'architecture-mapping.yaml',
  'architecture-mapping.yml',
  'architecture-mapping.json',
  path.join('.opencode', 'architecture-mapping.yaml'),
  path.join('.opencode', 'architecture-mapping.yml'),
  path.join('.opencode', 'architecture-mapping.json'),
  path.join('design', 'architecture-mapping.yaml'),
  path.join('design', 'architecture-mapping.yml'),
  path.join('design', 'architecture-mapping.json'),
];

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

function normalizeWorkspacePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '').trim();
}

function escapeGlobRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern: string): RegExp {
  const normalized = normalizeWorkspacePath(pattern);
  let source = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    const next = normalized[index + 1];

    if (current === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (current === '*') {
      source += '[^/]*';
      continue;
    }

    if (current === '?') {
      source += '[^/]';
      continue;
    }

    source += escapeGlobRegex(current);
  }

  return new RegExp(`^${source}$`);
}

function stripYamlComment(line: string): string {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return '';
  }

  let inSingle = false;
  let inDouble = false;
  for (let index = 0; index < line.length; index += 1) {
    const current = line[index];
    if (current === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (current === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (current === '#' && !inSingle && !inDouble) {
      return line.slice(0, index).trimEnd();
    }
  }

  return line;
}

function stripWrappedQuotes(value: string): string {
  const normalized = value.trim();
  if (normalized.length >= 2) {
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return normalized.slice(1, -1);
    }
  }
  return normalized;
}

function normalizeStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return [value.trim()].filter(Boolean);
  }
  return [];
}

function normalizeMappingEntries(raw: unknown, sourceFile: string): MappingEntry[] {
  const records = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { mappings?: unknown[] }).mappings)
      ? (raw as { mappings: unknown[] }).mappings
      : [];

  return records
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const architectureId = String(
        record.architectureId ?? record.elementId ?? record.architectureElementId ?? record.id ?? ''
      ).trim();

      if (!architectureId) {
        return null;
      }

      return {
        architectureId,
        paths: normalizeStringList(record.paths).map(normalizeWorkspacePath),
        globs: normalizeStringList(record.globs).map(normalizeWorkspacePath),
        symbols: normalizeStringList(record.symbols),
        sourceFile,
      };
    })
    .filter((item): item is MappingEntry => Boolean(item));
}

function parseSimpleYamlMappings(raw: string, sourceFile: string): MappingEntry[] {
  const entries: Array<Record<string, unknown>> = [];
  const lines = raw.split(/\r?\n/);
  let current: Record<string, unknown> | null = null;
  let currentListField: 'paths' | 'globs' | 'symbols' | '' = '';
  let listIndent = 0;

  for (const originalLine of lines) {
    const line = stripYamlComment(originalLine);
    if (!line.trim()) {
      continue;
    }

    const indent = originalLine.length - originalLine.trimStart().length;
    const trimmed = line.trim();

    if (trimmed === 'mappings:') {
      continue;
    }

    if (currentListField && indent > listIndent && trimmed.startsWith('- ')) {
      const values = (current?.[currentListField] as string[] | undefined) ?? [];
      values.push(stripWrappedQuotes(trimmed.slice(2)));
      if (current) {
        current[currentListField] = values;
      }
      continue;
    }

    const entryMatch = trimmed.match(/^-\s+([A-Za-z0-9_]+):\s*(.*)$/);
    if (entryMatch) {
      if (current) {
        entries.push(current);
      }
      current = {};
      currentListField = '';
      const key = entryMatch[1];
      const value = stripWrappedQuotes(entryMatch[2] ?? '');
      current[key] = value;
      continue;
    }

    const fieldMatch = trimmed.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!fieldMatch || !current) {
      continue;
    }

    const key = fieldMatch[1];
    const value = fieldMatch[2] ?? '';
    if ((key === 'paths' || key === 'globs' || key === 'symbols') && value.trim() === '') {
      currentListField = key;
      listIndent = indent;
      current[key] = [];
      continue;
    }

    currentListField = '';
    current[key] = stripWrappedQuotes(value);
  }

  if (current) {
    entries.push(current);
  }

  return normalizeMappingEntries(entries, sourceFile);
}

function loadArchitectureMappings(worktree: string): { entries: MappingEntry[]; mappingFiles: MappingFileSummary[]; warnings: string[] } {
  const entries: MappingEntry[] = [];
  const mappingFiles: MappingFileSummary[] = [];
  const warnings: string[] = [];

  for (const relativeCandidate of MAPPING_FILE_CANDIDATES) {
    const absoluteCandidate = path.join(worktree, relativeCandidate);
    if (!fs.existsSync(absoluteCandidate)) {
      continue;
    }

    try {
      const content = fs.readFileSync(absoluteCandidate, 'utf8');
      const normalizedPath = normalizeWorkspacePath(relativeCandidate);
      if (relativeCandidate.endsWith('.json')) {
        const parsed = JSON.parse(content);
        const normalizedEntries = normalizeMappingEntries(parsed, normalizedPath);
        entries.push(...normalizedEntries);
        mappingFiles.push({ file: normalizedPath, format: 'json', mappingCount: normalizedEntries.length });
        continue;
      }

      const normalizedEntries = parseSimpleYamlMappings(content, normalizedPath);
      entries.push(...normalizedEntries);
      mappingFiles.push({ file: normalizedPath, format: 'yaml', mappingCount: normalizedEntries.length });
    } catch (error) {
      warnings.push(
        `Failed to parse ${normalizeWorkspacePath(relativeCandidate)}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return { entries, mappingFiles, warnings };
}

function addArchitectureReference(references: ArchitectureReference[], seen: Set<string>, reference: ArchitectureReference): void {
  const key = [reference.source, reference.architectureId, reference.file, reference.line, reference.symbolName ?? '', reference.mappingFile ?? ''].join('|');
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  references.push(reference);
}

function getLangStringText(value: Array<{ value: string }> | undefined): string {
  return (value ?? []).map((item) => item.value).filter(Boolean).join(' ').trim();
}



function loadSemanticElements(worktree: string): SemanticElement[] {
  const graph = loadCanonicalKnowledgeGraph(worktree);
  const elements = graph.elements?.element ?? [];

  return elements
    .filter((element) => element.type === 'ApplicationComponent')
    .map((element) => {
      const title = getLangStringText(element.name) || element.identifier;
      const documentation = getLangStringText(element.documentation);
      return {
        architectureId: element.identifier,
        title,
        elementType: element.type,
        documentation,
        vector: buildTokenVector([title, documentation].filter(Boolean).join(' ')),
      };
    })
    .filter((element) => element.documentation.trim().length > 0);
}

function buildSemanticTraces(symbols: StructuralSymbol[], semanticElements: SemanticElement[]): SemanticTrace[] {
  if (semanticElements.length === 0) {
    return [];
  }

  const traces: SemanticTrace[] = [];
  for (const symbol of symbols) {
    const symbolVector = buildTokenVector([symbol.name, symbol.signature, symbol.snippet, symbol.file].join(' '));
    const candidates = semanticElements
      .map((element) => ({
        architectureId: element.architectureId,
        title: element.title,
        elementType: element.elementType,
        score: Number(cosineSimilarity(symbolVector, element.vector).toFixed(4)),
        documentationSnippet: safeSnippet(element.documentation),
      }))
      .filter((candidate) => candidate.score >= MIN_SEMANTIC_SCORE)
      .sort((left, right) => right.score - left.score)
      .slice(0, MAX_SEMANTIC_CANDIDATES);

    if (candidates.length === 0) {
      continue;
    }

    traces.push({
      file: symbol.file,
      line: symbol.line,
      kind: symbol.kind,
      symbolName: symbol.name,
      signature: symbol.signature,
      languageId: symbol.languageId,
      candidates,
    });
  }

  return traces.sort((left, right) => right.candidates[0].score - left.candidates[0].score).slice(0, MAX_SEMANTIC_TRACES);
}

export default tool({
  description: 'Scan the repository for implementation reality using ArchitectureID markers, external mappings, pluggable language providers, environment profile detection, and semantic tracing against ApplicationComponent documentation.',
  args: {
    maxFiles: tool.schema.number().int().min(10).max(500).optional().describe('Maximum number of sample files to report.'),
  },
  async execute(args, context) {
    const files = collectReadableWorkspaceFiles(context.worktree, MAX_FILE_BYTES);
    const { entries: mappingEntries, mappingFiles, warnings: mappingWarnings } = loadArchitectureMappings(context.worktree);
    const semanticElements = loadSemanticElements(context.worktree);
    const detectedEnvironments = detectEnvironmentProfiles(files);

    const extensionCounts: Record<string, number> = {};
    const architectureReferences: ArchitectureReference[] = [];
    const structuralSymbols: StructuralSymbol[] = [];
    const seenReferences = new Set<string>();

    for (const relativeFile of files) {
      const extension = path.extname(relativeFile) || '<none>';
      extensionCounts[extension] = (extensionCounts[extension] ?? 0) + 1;

      const absolute = path.join(context.worktree, relativeFile);
      try {
        const content = fs.readFileSync(absolute, 'utf8');
        const fileSymbols = extractStructuralSymbolsForFile(relativeFile, content, context.worktree).map((symbol) => ({
          ...symbol,
          snippet: safeSnippet(symbol.snippet),
        }));
        structuralSymbols.push(...fileSymbols);

        const matches = content.matchAll(ARCHITECTURE_ID_PATTERN);
        for (const match of matches) {
          const architectureId = match[1]?.trim();
          if (!architectureId) {
            continue;
          }

          addArchitectureReference(architectureReferences, seenReferences, {
            file: relativeFile,
            architectureId,
            line: getLineNumber(content, match.index ?? 0),
            snippet: safeSnippet(match[0]),
            source: 'comment',
          });
        }

        const normalizedFile = normalizeWorkspacePath(relativeFile);
        for (const entry of mappingEntries) {
          if (entry.paths.includes(normalizedFile)) {
            addArchitectureReference(architectureReferences, seenReferences, {
              file: relativeFile,
              architectureId: entry.architectureId,
              line: 1,
              snippet: safeSnippet(`Mapped by ${entry.sourceFile} to ${normalizedFile}`),
              source: 'mapping-path',
              mappingFile: entry.sourceFile,
            });
          }

          for (const glob of entry.globs) {
            if (!globToRegex(glob).test(normalizedFile)) {
              continue;
            }

            addArchitectureReference(architectureReferences, seenReferences, {
              file: relativeFile,
              architectureId: entry.architectureId,
              line: 1,
              snippet: safeSnippet(`Mapped by ${entry.sourceFile} glob ${glob}`),
              source: 'mapping-glob',
              mappingFile: entry.sourceFile,
            });
          }

          if (entry.symbols.length === 0) {
            continue;
          }

          for (const symbol of fileSymbols) {
            if (!entry.symbols.includes(symbol.name)) {
              continue;
            }

            addArchitectureReference(architectureReferences, seenReferences, {
              file: relativeFile,
              architectureId: entry.architectureId,
              line: symbol.line,
              snippet: symbol.snippet,
              source: 'mapping-symbol',
              symbolName: symbol.name,
              mappingFile: entry.sourceFile,
            });
          }
        }
      } catch {
        // Ignore unreadable files and continue scanning.
      }
    }

    const semanticTraces = buildSemanticTraces(structuralSymbols, semanticElements);
    const languageSupport: LanguageSupport[] = summarizeLanguageSupport(files, structuralSymbols, context.worktree);

    const result: ScanResult = {
      fileCount: files.length,
      extensionCounts,
      architectureReferences: architectureReferences.slice(0, MAX_ARCHITECTURE_REFERENCES),
      structuralSymbols: structuralSymbols.slice(0, MAX_STRUCTURAL_SYMBOLS),
      semanticTraces,
      languageSupport,
      detectedEnvironments,
      mappingFiles,
      mappingWarnings,
      sampleFiles: files.slice(0, args.maxFiles ?? 80),
    };

    return asJson(result);
  },
});