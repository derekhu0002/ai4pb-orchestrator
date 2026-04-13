import * as path from 'node:path';

export function inferModulePath(relativeFile: string): string {
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