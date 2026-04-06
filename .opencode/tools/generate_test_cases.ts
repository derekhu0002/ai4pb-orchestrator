import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { collectReadableWorkspaceFiles, loadRuntimeState, safeSnippet } from '../lib/runtimeState';

const MAX_FILE_BYTES = 200_000;
const TEST_FILE_PATTERN = /(^|\/)(test|tests|__tests__)(\/|$)|\.(spec|test)\.[^/]+$/i;
const STOP_WORDS = new Set([
  'about',
  'after',
  'agent',
  'based',
  'before',
  'build',
  'code',
  'create',
  'feature',
  'from',
  'have',
  'implementation',
  'into',
  'module',
  'negative',
  'path',
  'positive',
  'project',
  'regression',
  'should',
  'task',
  'that',
  'their',
  'this',
  'through',
  'using',
  'with',
]);

type FileRecord = {
  relativePath: string;
  modulePath: string;
  isTest: boolean;
  architectureIds: string[];
  searchableText: string;
};

type ModuleCandidate = {
  modulePath: string;
  score: number;
  sourceFiles: string[];
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function tokenize(value: string): string[] {
  return unique(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
  );
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

function isTestFile(relativePath: string): boolean {
  return TEST_FILE_PATTERN.test(relativePath);
}

function buildSuggestedTestPath(sourceFile: string): string {
  const extname = path.posix.extname(sourceFile);
  if (!extname) {
    return `${sourceFile}.spec`;
  }

  return `${sourceFile.slice(0, -extname.length)}.spec${extname}`;
}

function collectFileRecords(worktree: string): FileRecord[] {
  const readableFiles = collectReadableWorkspaceFiles(worktree, MAX_FILE_BYTES);
  const records: FileRecord[] = [];

  for (const relativePath of readableFiles) {
    const absolutePath = path.join(worktree, relativePath);
    try {
      const content = fs.readFileSync(absolutePath, 'utf8');
      records.push({
        relativePath,
        modulePath: inferModulePath(relativePath),
        isTest: isTestFile(relativePath),
        architectureIds: collectArchitectureIds(content),
        searchableText: `${relativePath.toLowerCase()}\n${content.toLowerCase()}`,
      });
    } catch {
      // Ignore unreadable text files and continue.
    }
  }

  return records;
}

function rankFallbackModules(fileRecords: FileRecord[], queryTerms: string[], architectureId: string): ModuleCandidate[] {
  const candidates = new Map<string, { score: number; sourceFiles: string[] }>();

  for (const file of fileRecords) {
    if (file.isTest) {
      continue;
    }

    let score = 0;
    for (const term of queryTerms) {
      if (file.relativePath.toLowerCase().includes(term)) {
        score += 6;
        continue;
      }

      if (file.searchableText.includes(term)) {
        score += 2;
      }
    }

    if (architectureId && file.architectureIds.includes(architectureId)) {
      score += 30;
    }

    if (score <= 0) {
      continue;
    }

    const existing = candidates.get(file.modulePath) ?? { score: 0, sourceFiles: [] };
    existing.score += score;
    existing.sourceFiles.push(file.relativePath);
    candidates.set(file.modulePath, existing);
  }

  return [...candidates.entries()]
    .map(([modulePath, value]) => ({
      modulePath,
      score: value.score,
      sourceFiles: unique(value.sourceFiles).slice(0, 3),
    }))
    .sort((left, right) => right.score - left.score || left.modulePath.localeCompare(right.modulePath));
}

export default tool({
  description: 'Generate a repo-local QA checklist from the current runtime tasks and optional objective text, including architecture-linked module coverage gaps.',
  args: {
    objective: tool.schema.string().optional().describe('Optional testing objective or acceptance target.'),
    commitId: tool.schema.string().optional().describe('Optional reviewed implementation commit ID used to scope the QA plan.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const tasks = args.commitId
      ? state.tasks.filter((task) => task.commitId === args.commitId)
      : state.tasks.length > 0
        ? state.tasks
        : [];
    const fileRecords = collectFileRecords(context.worktree);
    const lines: string[] = [];

    lines.push('# Generated Test Plan');
    lines.push('');
    if (args.objective) {
      lines.push(`Objective: ${args.objective}`);
      lines.push('');
    }
    if (args.commitId) {
      lines.push(`Review target commit: ${args.commitId}`);
      lines.push('');
    }

    lines.push(
      'Unit-test evidence heuristic: files under test directories or matching *.spec.* / *.test.* count as automated test evidence; exact @ArchitectureID matches strengthen confidence.'
    );
    lines.push('');

    const architectureIds = unique(tasks.map((task) => task.architectureElementId ?? ''));
    if (architectureIds.length > 0) {
      lines.push('## Coverage Gate');
      lines.push('- Hard rule: if any touched architecture-linked module below shows `Coverage: missing`, QA must write targeted automated tests before running bash verification commands.');
      lines.push('- Running only a broad command such as npm test is not enough unless it explicitly executes the targeted tests for the touched module(s).');
      lines.push('');

      for (const architectureId of architectureIds) {
        const matchingTasks = tasks.filter((task) => task.architectureElementId === architectureId);
        const exactSourceFiles = fileRecords
          .filter((file) => !file.isTest && file.architectureIds.includes(architectureId))
          .map((file) => file.relativePath);
        let modules = unique(
          fileRecords
            .filter((file) => !file.isTest && file.architectureIds.includes(architectureId))
            .map((file) => file.modulePath)
        );
        let sourceFiles = unique(exactSourceFiles);

        if (modules.length === 0) {
          const queryTerms = tokenize(
            matchingTasks
              .map((task) => [task.title, task.summary, task.details, task.softwareUnitTitle, architectureId].filter(Boolean).join(' '))
              .join(' ')
          );
          const fallbackModules = rankFallbackModules(fileRecords, queryTerms, architectureId).slice(0, 3);
          modules = fallbackModules.map((candidate) => candidate.modulePath);
          sourceFiles = unique([...sourceFiles, ...fallbackModules.flatMap((candidate) => candidate.sourceFiles)]);
        }

        const exactTestFiles = fileRecords
          .filter((file) => file.isTest && file.architectureIds.includes(architectureId))
          .map((file) => file.relativePath);
        const moduleTestFiles = fileRecords
          .filter((file) => file.isTest && modules.includes(file.modulePath))
          .map((file) => file.relativePath);
        const automatedTestFiles = unique([...exactTestFiles, ...moduleTestFiles]);
        const suggestedTestPath = sourceFiles[0] ? buildSuggestedTestPath(sourceFiles[0]) : undefined;

        lines.push(`### Architecture ${architectureId}`);
        lines.push(`- Tasks: ${matchingTasks.map((task) => `${task.id} ${task.title}`).join('; ')}`);
        lines.push(`- Candidate modules: ${modules.length > 0 ? modules.join(', ') : 'No confident module match found from repo heuristics.'}`);
        lines.push(`- Source files: ${sourceFiles.length > 0 ? sourceFiles.join(', ') : 'No architecture-linked source files found.'}`);
        lines.push(
          `- Existing automated test files: ${automatedTestFiles.length > 0 ? automatedTestFiles.join(', ') : 'None found.'}`
        );
        lines.push(`- Coverage: ${automatedTestFiles.length > 0 ? 'covered' : 'missing'}`);
        lines.push(
          automatedTestFiles.length > 0
            ? '- Required action: run these targeted tests first, then run any broader regression checks that still add value.'
            : `- Required action: write a targeted automated test before bash. Suggested starting file: ${suggestedTestPath ?? 'choose a module-local spec/test file for the touched code.'}`
        );
        lines.push('');
      }
    }

    for (const task of tasks) {
      lines.push(`## ${task.id} ${task.title}`);
      if (task.architectureElementId) {
        lines.push(`- Architecture ID: ${task.architectureElementId}`);
      }
      if (task.softwareUnitTitle) {
        lines.push(`- Software unit: ${task.softwareUnitTitle}`);
      }
      lines.push(`- Positive path: confirm the intended behavior for ${task.title}.`);
      lines.push(`- Negative path: verify invalid or missing input does not break ${task.title}.`);
      lines.push(`- Regression: ensure adjacent behavior still works after ${task.id}.`);
      lines.push('- Execution gate: do not count this task as verified until a targeted automated test exists or has been extended for the touched module.');
      lines.push('');
    }

    if (tasks.length === 0) {
      lines.push(
        args.commitId
          ? `- No runtime tasks were found for commit ${args.commitId}. Treat the QA handoff as incomplete instead of validating an ambiguous scope.`
          : '- No runtime tasks were found. Validate the user-visible change directly and document the gap.'
      );
      lines.push('');
    }

    const tasksWithoutArchitectureId = tasks.filter((task) => !task.architectureElementId);
    if (tasksWithoutArchitectureId.length > 0) {
      lines.push('## Unmapped Runtime Tasks');
      lines.push(
        `- These tasks do not carry architectureElementId traceability: ${tasksWithoutArchitectureId
          .map((task) => `${task.id} ${task.title}`)
          .join('; ')}`
      );
      lines.push('- QA must still validate them, but should call out the missing architecture traceability explicitly in the final result.');
      lines.push('');
    }

    lines.push(`Plan summary: ${safeSnippet(`scoped ${tasks.length} runtime task(s) with ${architectureIds.length} architecture-linked element(s).`)}`);

    return lines.join('\n');
  },
});