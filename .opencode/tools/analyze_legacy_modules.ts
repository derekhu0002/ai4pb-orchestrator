import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { extractStructuralSymbolsForFile } from '../lib/realityScanner/providers';
import { buildTokenVector, cosineSimilarity } from '../lib/realityScanner/semanticUtils';
import { asJson, collectReadableWorkspaceFiles, loadRuntimeState, safeSnippet } from '../lib/runtimeState';

const MAX_FILE_BYTES = 200_000;
const ARCHITECTURE_ID_BONUS = 30;
const OTHER_ARCHITECTURE_ID_CAP = 3;
const MAX_TOP_SYMBOLS_PER_MODULE = 5;

type ScoredSymbol = {
  name: string;
  kind: string;
  file: string;
  line: number;
  signature: string;
  score: number;
};

type FileAggregate = {
  file: string;
  symbolScore: number;
  architectureIds: string[];
  architectureIdBonus: number;
  symbols: ScoredSymbol[];
};

type ModuleAggregate = {
  modulePath: string;
  totalScore: number;
  architectureIds: Set<string>;
  files: Map<string, FileAggregate>;
};

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function inferModulePath(relativeFile: string): string {
  const directory = path.posix.dirname(relativeFile);
  if (!directory || directory === '.') {
    return relativeFile;
  }

  const parts = directory.split('/').filter(Boolean);
  if (parts.length === 1) {
    return parts[0];
  }

  if (parts[0] === 'src' && parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }

  if (['app', 'lib', 'packages', 'services', 'implementation'].includes(parts[0])) {
    return `${parts[0]}/${parts[1]}`;
  }

  return `${parts[0]}/${parts[1]}`;
}

function collectArchitectureIds(content: string): string[] {
  return unique(
    [...content.matchAll(/@ArchitectureID:\s*([^\r\n]+)/g)]
      .map((match) => match[1]?.trim())
      .filter((value): value is string => Boolean(value))
  );
}

function upsertModule(store: Map<string, ModuleAggregate>, modulePath: string): ModuleAggregate {
  const existing = store.get(modulePath);
  if (existing) {
    return existing;
  }

  const created: ModuleAggregate = {
    modulePath,
    totalScore: 0,
    architectureIds: new Set<string>(),
    files: new Map<string, FileAggregate>(),
  };
  store.set(modulePath, created);
  return created;
}

function upsertFile(module: ModuleAggregate, relativeFile: string): FileAggregate {
  const existing = module.files.get(relativeFile);
  if (existing) {
    return existing;
  }

  const created: FileAggregate = {
    file: relativeFile,
    symbolScore: 0,
    architectureIds: [],
    architectureIdBonus: 0,
    symbols: [],
  };
  module.files.set(relativeFile, created);
  return created;
}

export default tool({
  description:
    'Analyze a brownfield repository and rank the best-fit existing modules using AST structural symbols, semantic token-vector similarity, and ArchitectureID evidence. Returns scored candidate modules with their top matching functions and classes.',
  args: {
    goal: tool.schema.string().optional().describe('High-level goal or requirement title.'),
    formalRequirement: tool.schema.string().optional().describe('Approved formal requirement text, if available.'),
    architectureElementId: tool.schema.string().optional().describe('Architecture element ID that the work is expected to realize.'),
    softwareUnitTitle: tool.schema.string().optional().describe('Proposed software unit title to match against legacy code.'),
    maxCandidates: tool.schema.number().int().min(1).max(12).optional().describe('Maximum number of candidate modules to return.'),
  },
  async execute(args, context) {
    const runtimeState = loadRuntimeState(context.worktree);
    const goal = args.goal?.trim() || runtimeState.activeGoal || '';
    const requirement = args.formalRequirement?.trim() || '';
    const softwareUnitTitle = args.softwareUnitTitle?.trim() || '';
    const architectureElementId = args.architectureElementId?.trim() || '';

    const requirementText = [goal, requirement, softwareUnitTitle, architectureElementId].filter(Boolean).join(' ');
    const requirementVector = buildTokenVector(requirementText);

    const files = collectReadableWorkspaceFiles(context.worktree, MAX_FILE_BYTES);
    const modules = new Map<string, ModuleAggregate>();
    let analyzedFiles = 0;
    let totalSymbolsScanned = 0;

    for (const relativeFile of files) {
      const absolute = path.join(context.worktree, relativeFile);
      try {
        const content = fs.readFileSync(absolute, 'utf8');
        analyzedFiles += 1;

        const architectureIds = collectArchitectureIds(content);
        const symbols = extractStructuralSymbolsForFile(relativeFile, content, context.worktree);
        totalSymbolsScanned += symbols.length;

        // Score each symbol against the requirement vector.
        const scoredSymbols: ScoredSymbol[] = [];
        for (const symbol of symbols) {
          const symbolText = [symbol.name, symbol.signature, symbol.snippet].join(' ');
          const symbolVector = buildTokenVector(symbolText);
          const similarity = cosineSimilarity(requirementVector, symbolVector);
          if (similarity > 0) {
            scoredSymbols.push({
              name: symbol.name,
              kind: symbol.kind,
              file: symbol.file,
              line: symbol.line,
              signature: symbol.signature,
              score: Number(similarity.toFixed(4)),
            });
          }
        }

        // Compute file-level symbol score as the sum of its symbol similarities.
        const fileSymbolScore = scoredSymbols.reduce((sum, s) => sum + s.score, 0);

        // Compute architecture ID bonus.
        let architectureIdBonus = 0;
        if (architectureElementId && architectureIds.includes(architectureElementId)) {
          architectureIdBonus = ARCHITECTURE_ID_BONUS;
        } else if (architectureIds.length > 0) {
          architectureIdBonus = Math.min(architectureIds.length, OTHER_ARCHITECTURE_ID_CAP);
        }

        const fileTotal = fileSymbolScore + architectureIdBonus;
        if (fileTotal <= 0 && scoredSymbols.length === 0) {
          continue;
        }

        const modulePath = inferModulePath(relativeFile);
        const module = upsertModule(modules, modulePath);
        const fileAgg = upsertFile(module, relativeFile);
        fileAgg.symbolScore = fileSymbolScore;
        fileAgg.architectureIds = architectureIds;
        fileAgg.architectureIdBonus = architectureIdBonus;
        fileAgg.symbols = scoredSymbols.sort((a, b) => b.score - a.score);

        module.totalScore += fileTotal;
        for (const id of architectureIds) {
          module.architectureIds.add(id);
        }
      } catch {
        // Ignore unreadable files and continue.
      }
    }

    const maxCandidates = args.maxCandidates ?? 5;
    const ranked = [...modules.values()]
      .sort((left, right) => right.totalScore - left.totalScore || left.modulePath.localeCompare(right.modulePath))
      .slice(0, maxCandidates)
      .map((module) => {
        // Collect and rank all symbols across files in this module.
        const allSymbols: ScoredSymbol[] = [];
        for (const fileAgg of module.files.values()) {
          allSymbols.push(...fileAgg.symbols);
        }
        allSymbols.sort((a, b) => b.score - a.score);

        const sortedFiles = [...module.files.values()]
          .sort((a, b) => (b.symbolScore + b.architectureIdBonus) - (a.symbolScore + a.architectureIdBonus) || a.file.localeCompare(b.file))
          .slice(0, 3);

        return {
          modulePath: module.modulePath,
          totalScore: Number(module.totalScore.toFixed(4)),
          architectureIds: [...module.architectureIds],
          topSymbols: allSymbols.slice(0, MAX_TOP_SYMBOLS_PER_MODULE).map((s) => ({
            name: s.name,
            kind: s.kind,
            file: s.file,
            line: s.line,
            signature: safeSnippet(s.signature),
            score: s.score,
          })),
          representativeFiles: sortedFiles.map((f) => ({
            file: f.file,
            symbolScore: Number(f.symbolScore.toFixed(4)),
            architectureIdBonus: f.architectureIdBonus,
            architectureIds: f.architectureIds,
            topSymbols: f.symbols.slice(0, 3).map((s) => ({
              name: s.name,
              kind: s.kind,
              score: s.score,
            })),
          })),
        };
      });

    return asJson({
      goal,
      architectureElementId: architectureElementId || null,
      scannedFiles: files.length,
      analyzedFiles,
      totalSymbolsScanned,
      candidateModules: ranked,
      summary: safeSnippet(
        ranked.length > 0
          ? `Top legacy candidate: ${ranked[0]?.modulePath} (score ${ranked[0]?.totalScore}). Top symbol: ${ranked[0]?.topSymbols[0]?.name ?? 'none'} (${ranked[0]?.topSymbols[0]?.kind ?? ''}).`
          : 'No strong legacy candidate modules were identified by semantic analysis.'
      ),
      nextStep:
        ranked.length > 0
          ? 'Review the topSymbols in each candidate module. Determine whether the requirement should extend existing functions/classes, split a legacy seam, or introduce a new software unit.'
          : 'No strong legacy module candidates were found. Read the most relevant source areas manually before deciding whether a new software unit is justified.',
    });
  },
});