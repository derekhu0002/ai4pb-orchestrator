import * as fs from 'node:fs';
import * as path from 'node:path';

const MAX_NULL_BYTES = 4;

export type GitIgnoreRule = {
  pattern: string;
  regex: RegExp;
  negated: boolean;
  directoryOnly: boolean;
};

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegex(pattern: string, basenameOnly: boolean, directoryOnly: boolean): RegExp {
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

    source += escapeRegex(character);
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
        regex: globToRegex(normalized, basenameOnly, directoryOnly),
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
      if (nullByteCount > MAX_NULL_BYTES) {
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

function walkFiles(root: string, current: string, results: string[], ignoreRules: GitIgnoreRule[]): void {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (isIgnoredPath(relative, true, ignoreRules)) {
        continue;
      }
      walkFiles(root, absolute, results, ignoreRules);
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
  walkFiles(worktree, worktree, files, ignoreRules);

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