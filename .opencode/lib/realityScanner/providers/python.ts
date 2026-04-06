import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import type { StructuralSymbol } from '../types';
import type { RealityScannerLanguageProvider } from './types';

type PythonCommand = {
  command: string;
  args: string[];
};

const PYTHON_AST_HELPER = fileURLToPath(new URL('./python_ast_extract.py', import.meta.url));
let cachedPythonCommand: PythonCommand | null | undefined;

function getPythonCandidates(worktree?: string): PythonCommand[] {
  const candidates: PythonCommand[] = [];
  const seen = new Set<string>();
  const pushCandidate = (command: string, args: string[] = []) => {
    const key = [command, ...args].join('|').toLowerCase();
    if (!command || seen.has(key)) {
      return;
    }
    seen.add(key);
    candidates.push({ command, args });
  };

  if (worktree) {
    pushCandidate(path.join(worktree, '.venv', 'Scripts', 'python.exe'));
    pushCandidate(path.join(worktree, '.venv', 'bin', 'python'));
  }
  if (process.env.VIRTUAL_ENV) {
    pushCandidate(path.join(process.env.VIRTUAL_ENV, 'Scripts', 'python.exe'));
    pushCandidate(path.join(process.env.VIRTUAL_ENV, 'bin', 'python'));
  }
  pushCandidate('py', ['-3']);
  pushCandidate('python3');
  pushCandidate('python');
  return candidates;
}

function resolvePythonCommand(worktree?: string): PythonCommand | null {
  if (cachedPythonCommand !== undefined) {
    return cachedPythonCommand;
  }

  for (const candidate of getPythonCandidates(worktree)) {
    const isAbsolute = path.isAbsolute(candidate.command);
    if (isAbsolute && !fs.existsSync(candidate.command)) {
      continue;
    }

    const check = spawnSync(candidate.command, [...candidate.args, '--version'], {
      encoding: 'utf8',
      windowsHide: true,
    });

    if (check.status === 0) {
      cachedPythonCommand = candidate;
      return candidate;
    }
  }

  cachedPythonCommand = null;
  return null;
}

export const pythonLanguageProvider: RealityScannerLanguageProvider = {
  languageId: 'python',
  extractionMode: 'ast',
  extractSymbols(relativeFile, content, worktree) {
    const python = resolvePythonCommand(worktree);
    if (!python) {
      return [];
    }

    const execution = spawnSync(python.command, [...python.args, PYTHON_AST_HELPER, '--relative-file', relativeFile], {
      input: content,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    if (execution.status !== 0 || !execution.stdout.trim()) {
      return [];
    }

    try {
      const parsed = JSON.parse(execution.stdout) as StructuralSymbol[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },
};