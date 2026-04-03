import * as fs from 'node:fs';
import * as path from 'node:path';

export type RuntimeTaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type ValidationStatus = 'passed' | 'failed' | 'not_run';
export type RuntimeTaskKind = 'planning' | 'implementation';

export type RuntimeTask = {
  id: string;
  title: string;
  status: RuntimeTaskStatus;
  kind?: RuntimeTaskKind;
  owner?: string;
  summary?: string;
  details?: string;
  commitId?: string;
  softwareUnitId?: string;
  softwareUnitTitle?: string;
  architectureElementId?: string;
  createdAt: string;
  updatedAt: string;
};

export type RuntimeValidation = {
  status: ValidationStatus;
  summary: string;
  updatedAt: string;
  details?: string;
  commitId?: string;
};

export type RuntimeIssue = {
  id: string;
  category: string;
  summary: string;
  details?: string;
  createdAt: string;
};

export type RuntimeState = {
  version: number;
  activeGoal: string;
  designSummary: string;
  designDecisions: string[];
  tasks: RuntimeTask[];
  issues: RuntimeIssue[];
  validations: {
    qa: RuntimeValidation;
    audit: RuntimeValidation;
  };
  release: {
    status: 'not_started' | 'completed';
    summary: string;
    releaseLogPath?: string;
    updatedAt: string;
  };
  counters: {
    task: number;
    issue: number;
  };
  updatedAt: string;
};

const RUNTIME_DIR = path.join('.opencode', 'runtime');
const RUNTIME_FILE = path.join(RUNTIME_DIR, 'project-state.json');
const GRAPH_UPDATE_LOG = path.join('.opencode', 'temp', 'opencode-graph-updates.jsonl');
const KG_FILE = path.join('.opencode', 'temp', 'SystemArchitecture.json');

export function getRuntimeFilePath(worktree: string): string {
  return path.join(worktree, RUNTIME_FILE);
}

export function getGraphUpdateLogPath(worktree: string): string {
  return path.join(worktree, GRAPH_UPDATE_LOG);
}

export function getKnowledgeGraphPath(worktree: string): string {
  return path.join(worktree, KG_FILE);
}

export function ensureParentDir(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function defaultValidation(): RuntimeValidation {
  return {
    status: 'not_run',
    summary: 'No validation has been recorded yet.',
    updatedAt: new Date(0).toISOString(),
  };
}

export function createDefaultState(): RuntimeState {
  const now = new Date().toISOString();
  return {
    version: 1,
    activeGoal: '',
    designSummary: '',
    designDecisions: [],
    tasks: [],
    issues: [],
    validations: {
      qa: defaultValidation(),
      audit: defaultValidation(),
    },
    release: {
      status: 'not_started',
      summary: 'Release has not been prepared yet.',
      updatedAt: now,
    },
    counters: {
      task: 0,
      issue: 0,
    },
    updatedAt: now,
  };
}

export function loadRuntimeState(worktree: string): RuntimeState {
  const filePath = getRuntimeFilePath(worktree);
  if (!fs.existsSync(filePath)) {
    const state = createDefaultState();
    saveRuntimeState(worktree, state);
    return state;
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) {
    const state = createDefaultState();
    saveRuntimeState(worktree, state);
    return state;
  }

  return JSON.parse(raw) as RuntimeState;
}

export function saveRuntimeState(worktree: string, state: RuntimeState): void {
  state.updatedAt = new Date().toISOString();
  const filePath = getRuntimeFilePath(worktree);
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf8');
}

export function appendGraphUpdateLog(worktree: string, entry: Record<string, unknown>): void {
  const filePath = getGraphUpdateLogPath(worktree);
  ensureParentDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify({ timestamp: new Date().toISOString(), ...entry })}\n`, 'utf8');
}

export function loadKnowledgeGraph(worktree: string): unknown {
  const graphPath = getKnowledgeGraphPath(worktree);
  if (!fs.existsSync(graphPath)) {
    return null;
  }
  const raw = fs.readFileSync(graphPath, 'utf8').trim();
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

export function summarizeState(state: RuntimeState): Record<string, unknown> {
  const counts = state.tasks.reduce<Record<string, number>>((accumulator, task) => {
    accumulator[task.status] = (accumulator[task.status] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    activeGoal: state.activeGoal,
    designSummary: state.designSummary,
    taskCounts: counts,
    tasks: state.tasks,
    issues: state.issues,
    validations: state.validations,
    release: state.release,
    updatedAt: state.updatedAt,
  };
}

export function nextTaskId(state: RuntimeState): string {
  state.counters.task += 1;
  return `TASK-${String(state.counters.task).padStart(3, '0')}`;
}

export function nextIssueId(state: RuntimeState): string {
  state.counters.issue += 1;
  return `ISSUE-${String(state.counters.issue).padStart(3, '0')}`;
}

export function normalizeTaskTitle(value: string): string {
  return value.replace(/\s+/g, ' ').trim().replace(/^[-*\d.\s]+/, '').slice(0, 120);
}

export function extractGoalParts(goal: string, maxTasks: number): string[] {
  const lineParts = goal
    .split(/\r?\n/)
    .map((part) => normalizeTaskTitle(part))
    .filter(Boolean);

  if (lineParts.length >= 2) {
    return lineParts.slice(0, maxTasks);
  }

  return goal
    .split(/[.;\n]/)
    .map((part) => normalizeTaskTitle(part))
    .filter(Boolean)
    .slice(0, maxTasks);
}

export function safeSnippet(value: string, maxLength = 240): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

const MAX_REPOSITORY_SCAN_NULL_BYTES = 4;

export type GitIgnoreRule = {
  pattern: string;
  regex: RegExp;
  negated: boolean;
  directoryOnly: boolean;
};

function escapeRepositoryScanRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRepositoryScanRegex(pattern: string, basenameOnly: boolean, directoryOnly: boolean): RegExp {
  const normalized = pattern.replace(/\\/g, '/');
  let source = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    const next = normalized[index + 1];

    if (character === '*' && next === '*') {
      source += '.*';
      index += 1;
      continue;
    }

    if (character === '*') {
      source += '[^/]*';
      continue;
    }

    if (character === '?') {
      source += '[^/]';
      continue;
    }

    source += escapeRepositoryScanRegex(character);
  }

  if (basenameOnly) {
    return new RegExp(`(^|/)${source}${directoryOnly ? '(/.*)?' : '($|/)'}`);
  }

  return new RegExp(`^${source}${directoryOnly ? '(/.*)?' : '$'}`);
}

export function parseGitIgnore(worktree: string): GitIgnoreRule[] {
  const gitIgnorePath = path.join(worktree, '.gitignore');
  if (!fs.existsSync(gitIgnorePath)) {
    return [];
  }

  const raw = fs.readFileSync(gitIgnorePath, 'utf8');
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const negated = line.startsWith('!');
      const unsigned = negated ? line.slice(1).trim() : line;
      const directoryOnly = unsigned.endsWith('/');
      const normalized = unsigned.replace(/^\//, '').replace(/\/$/, '');
      const basenameOnly = !normalized.includes('/');

      return {
        pattern: normalized,
        regex: globToRepositoryScanRegex(normalized, basenameOnly, directoryOnly),
        negated,
        directoryOnly,
      };
    })
    .filter((rule) => rule.pattern.length > 0);
}

export function isIgnoredPath(relativePath: string, isDirectory: boolean, rules: GitIgnoreRule[]): boolean {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (!normalized || normalized === '.git') {
    return normalized === '.git';
  }

  let ignored = false;
  for (const rule of rules) {
    if (rule.directoryOnly && !isDirectory) {
      continue;
    }

    if (rule.regex.test(normalized)) {
      ignored = !rule.negated;
    }
  }

  return ignored;
}

export function looksLikeReadableText(buffer: Buffer): boolean {
  if (buffer.length === 0) {
    return false;
  }

  let nullByteCount = 0;
  let suspiciousControlCount = 0;

  for (const value of buffer) {
    if (value === 0) {
      nullByteCount += 1;
      if (nullByteCount > MAX_REPOSITORY_SCAN_NULL_BYTES) {
        return false;
      }
      continue;
    }

    const isWhitespace = value === 9 || value === 10 || value === 13;
    const isPrintableAscii = value >= 32 && value <= 126;
    const isExtendedUtf8Byte = value >= 128;

    if (!isWhitespace && !isPrintableAscii && !isExtendedUtf8Byte) {
      suspiciousControlCount += 1;
      if (suspiciousControlCount > Math.max(8, Math.floor(buffer.length * 0.02))) {
        return false;
      }
    }
  }

  return true;
}

function walkRepositoryFiles(root: string, current: string, results: string[], ignoreRules: GitIgnoreRule[]): void {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (isIgnoredPath(relative, true, ignoreRules)) {
        continue;
      }
      walkRepositoryFiles(root, absolute, results, ignoreRules);
      continue;
    }

    if (!isIgnoredPath(relative, false, ignoreRules)) {
      results.push(relative);
    }
  }
}

export function collectReadableWorkspaceFiles(worktree: string, maxFileBytes?: number): string[] {
  const ignoreRules = parseGitIgnore(worktree);
  const files: string[] = [];
  walkRepositoryFiles(worktree, worktree, files, ignoreRules);

  if (!maxFileBytes) {
    return files;
  }

  return files.filter((relativeFile) => {
    const absolute = path.join(worktree, relativeFile);
    try {
      const stats = fs.statSync(absolute);
      if (stats.size > maxFileBytes) {
        return false;
      }
      const buffer = fs.readFileSync(absolute);
      return looksLikeReadableText(buffer);
    } catch {
      return false;
    }
  });
}

export function asJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}