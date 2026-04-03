import { tool } from '@opencode-ai/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { asJson, collectReadableWorkspaceFiles, safeSnippet } from '../lib/runtimeState';

const MAX_FILE_BYTES = 200_000;

type ScanResult = {
  fileCount: number;
  extensionCounts: Record<string, number>;
  architectureReferences: Array<{ file: string; architectureId: string; line: number; snippet: string }>;
  sampleFiles: string[];
};

const ARCHITECTURE_ID_PATTERN = /@ArchitectureID:\s*([^\r\n]+)/g;

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split(/\r?\n/).length;
}

export default tool({
  description: 'Scan the repository for implementation reality: source files, extension counts, and architecture trace markers.',
  args: {
    maxFiles: tool.schema.number().int().min(10).max(500).optional().describe('Maximum number of sample files to report.'),
  },
  async execute(args, context) {
    const files = collectReadableWorkspaceFiles(context.worktree, MAX_FILE_BYTES);

    const extensionCounts: Record<string, number> = {};
    const architectureReferences: Array<{ file: string; architectureId: string; line: number; snippet: string }> = [];

    for (const relativeFile of files) {
      const extension = path.extname(relativeFile) || '<none>';
      extensionCounts[extension] = (extensionCounts[extension] ?? 0) + 1;

      const absolute = path.join(context.worktree, relativeFile);
      try {
        const content = fs.readFileSync(absolute, 'utf8');
        const matches = content.matchAll(ARCHITECTURE_ID_PATTERN);
        for (const match of matches) {
          const architectureId = match[1]?.trim();
          if (!architectureId) {
            continue;
          }
          architectureReferences.push({
            file: relativeFile,
            architectureId,
            line: getLineNumber(content, match.index ?? 0),
            snippet: safeSnippet(match[0]),
          });
        }
      } catch {
        // Ignore unreadable files and continue scanning.
      }
    }

    const result: ScanResult = {
      fileCount: files.length,
      extensionCounts,
      architectureReferences: architectureReferences.slice(0, 50),
      sampleFiles: files.slice(0, args.maxFiles ?? 80),
    };

    return asJson(result);
  },
});