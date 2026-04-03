import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { asJson, loadRuntimeState, safeSnippet } from '../lib/runtimeState';

const IGNORED_DIRS = new Set(['.git', 'node_modules', '.venv', 'out', 'dist', 'coverage', '.opencode/runtime']);
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.py', '.md']);
const STOP_WORDS = new Set([
  'about',
  'after',
  'agent',
  'based',
  'before',
  'build',
  'code',
  'create',
  'from',
  'have',
  'implementation',
  'into',
  'legacy',
  'module',
  'project',
  'requirement',
  'should',
  'software',
  'system',
  'that',
  'their',
  'this',
  'through',
  'using',
  'with',
]);
const MAX_FILE_BYTES = 200_000;

type CandidateFile = {
  file: string;
  score: number;
  reasons: string[];
  architectureIds: string[];
};

type CandidateAggregate = {
  modulePath: string;
  score: number;
  matchedTerms: Set<string>;
  reasons: Set<string>;
  architectureIds: Set<string>;
  files: CandidateFile[];
};

function walkFiles(root: string, current: string, results: string[]): void {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name) || relative.startsWith('.opencode/node_modules')) {
        continue;
      }
      walkFiles(root, absolute, results);
      continue;
    }

    if (CODE_EXTENSIONS.has(path.extname(entry.name))) {
      results.push(relative);
    }
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
}

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

function upsertCandidate(store: Map<string, CandidateAggregate>, modulePath: string): CandidateAggregate {
  const existing = store.get(modulePath);
  if (existing) {
    return existing;
  }

  const created: CandidateAggregate = {
    modulePath,
    score: 0,
    matchedTerms: new Set<string>(),
    reasons: new Set<string>(),
    architectureIds: new Set<string>(),
    files: [],
  };
  store.set(modulePath, created);
  return created;
}

export default tool({
  description:
    'Analyze a brownfield repository and rank the best-fit existing modules, seams, or packages for implementing a requirement before software-unit decomposition.',
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
    const queryTerms = unique(tokenize([goal, requirement, softwareUnitTitle, architectureElementId].filter(Boolean).join(' '))).slice(0, 24);

    const files: string[] = [];
    walkFiles(context.worktree, context.worktree, files);

    const candidates = new Map<string, CandidateAggregate>();
    let analyzedFiles = 0;

    for (const relativeFile of files) {
      const absolute = path.join(context.worktree, relativeFile);
      try {
        const stats = fs.statSync(absolute);
        if (stats.size > MAX_FILE_BYTES) {
          continue;
        }

        const content = fs.readFileSync(absolute, 'utf8');
        analyzedFiles += 1;

        const pathLower = relativeFile.toLowerCase();
        const contentLower = content.toLowerCase();
        const architectureIds = collectArchitectureIds(content);
        const reasons: string[] = [];
        const matchedTerms: string[] = [];
        let score = 0;

        for (const term of queryTerms) {
          if (pathLower.includes(term)) {
            score += 6;
            matchedTerms.push(term);
            reasons.push(`path matches term: ${term}`);
            continue;
          }

          if (contentLower.includes(term)) {
            score += 2;
            matchedTerms.push(term);
            reasons.push(`content matches term: ${term}`);
          }
        }

        if (architectureElementId && architectureIds.includes(architectureElementId)) {
          score += 30;
          reasons.push(`contains exact @ArchitectureID: ${architectureElementId}`);
        } else if (architectureIds.length > 0) {
          score += Math.min(architectureIds.length, 3);
          reasons.push(`contains ArchitectureID markers: ${architectureIds.join(', ')}`);
        }

        if (score <= 0) {
          continue;
        }

        const modulePath = inferModulePath(relativeFile);
        const candidate = upsertCandidate(candidates, modulePath);
        candidate.score += score;
        for (const term of matchedTerms) {
          candidate.matchedTerms.add(term);
        }
        for (const reason of reasons) {
          candidate.reasons.add(reason);
        }
        for (const architectureId of architectureIds) {
          candidate.architectureIds.add(architectureId);
        }
        candidate.files.push({
          file: relativeFile,
          score,
          reasons: unique(reasons).slice(0, 4),
          architectureIds,
        });
      } catch {
        // Ignore unreadable files and continue.
      }
    }

    const maxCandidates = args.maxCandidates ?? 5;
    const ranked = [...candidates.values()]
      .sort((left, right) => right.score - left.score || left.modulePath.localeCompare(right.modulePath))
      .slice(0, maxCandidates)
      .map((candidate) => ({
        modulePath: candidate.modulePath,
        score: candidate.score,
        matchedTerms: [...candidate.matchedTerms],
        architectureIds: [...candidate.architectureIds],
        reasons: [...candidate.reasons].slice(0, 6),
        representativeFiles: candidate.files
          .sort((left, right) => right.score - left.score || left.file.localeCompare(right.file))
          .slice(0, 3)
          .map((file) => ({
            file: file.file,
            score: file.score,
            architectureIds: file.architectureIds,
            reasons: file.reasons,
          })),
      }));

    return asJson({
      goal,
      architectureElementId: architectureElementId || null,
      queryTerms,
      scannedFiles: files.length,
      analyzedFiles,
      candidateModules: ranked,
      nextStep:
        ranked.length > 0
          ? 'Read the top candidate modules and decide whether the requirement should extend an existing module, split a legacy seam, or introduce a new software unit.'
          : 'No strong legacy module candidates were found. Read the most relevant source areas manually before deciding whether a new software unit is justified.',
      summary: safeSnippet(
        ranked.length > 0
          ? `Top legacy candidate: ${ranked[0]?.modulePath} with score ${ranked[0]?.score}.`
          : 'No strong legacy candidate modules were identified by heuristic analysis.'
      ),
    });
  },
});