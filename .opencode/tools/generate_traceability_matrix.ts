import { tool } from '@opencode-ai/plugin';

import { loadRuntimeState, type RuntimeTask } from '../lib/runtimeState';
import {
  findElement,
  loadCanonicalKnowledgeGraph,
  type GraphElement,
  type GraphRelationship,
  type SharedKnowledgeGraph,
} from '../lib/sharedKnowledgeGraph';
import { scanReality } from './run_reality_scanner';

type MatrixRow = {
  requirement: string;
  architecture: string;
  task: string;
  sourceFiles: string;
  verified: string;
};

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function getElementTitle(element?: GraphElement): string {
  if (!element) {
    return 'N/A';
  }

  const name = element.name.map((entry) => entry.value).find(Boolean)?.trim();
  return name ? `${element.identifier} ${name}` : element.identifier;
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function formatList(values: string[]): string {
  return values.length > 0 ? escapeMarkdownCell(values.join('<br>')) : 'N/A';
}

function findRequirementLinks(graph: SharedKnowledgeGraph, architectureElementId?: string): GraphElement[] {
  if (!architectureElementId) {
    return [];
  }

  const relationships = graph.relationships?.relationship ?? [];
  const requirementIds = relationships
    .filter(
      (relationship) =>
        (relationship.type === 'Realization' || relationship.type === 'Association') &&
        (relationship.source === architectureElementId || relationship.target === architectureElementId)
    )
    .map((relationship) => (relationship.source === architectureElementId ? relationship.target : relationship.source))
    .filter(Boolean);

  return unique(requirementIds)
    .map((identifier) => findElement(graph, identifier))
    .filter((element): element is GraphElement => Boolean(element && element.type === 'Requirement'));
}

function collectSourceFiles(architectureElementId: string | undefined, references: Array<{ architectureId: string; file: string }>): string[] {
  if (!architectureElementId) {
    return [];
  }

  return unique(
    references
      .filter((reference) => reference.architectureId === architectureElementId)
      .map((reference) => reference.file)
      .sort((left, right) => left.localeCompare(right))
  );
}

function isVerified(requirementElements: GraphElement[], architectureElementId: string | undefined, verifiedIntentIds: Set<string>): boolean {
  if (architectureElementId && verifiedIntentIds.has(architectureElementId)) {
    return true;
  }

  return requirementElements.some((element) => verifiedIntentIds.has(element.identifier));
}

function formatTask(task: RuntimeTask): string {
  const parts = [task.id, task.title.trim()];
  if (task.commitId) {
    parts.push(`(${task.commitId})`);
  }
  return escapeMarkdownCell(parts.join(' '));
}

function buildRows(tasks: RuntimeTask[], graph: SharedKnowledgeGraph, references: Array<{ architectureId: string; file: string }>, verifiedIntentIds: Set<string>): MatrixRow[] {
  return tasks.map((task) => {
    const architectureElement = task.architectureElementId ? findElement(graph, task.architectureElementId) : undefined;
    const requirementElements = findRequirementLinks(graph, task.architectureElementId);
    const sourceFiles = collectSourceFiles(task.architectureElementId, references);
    const verified = isVerified(requirementElements, task.architectureElementId, verifiedIntentIds);

    return {
      requirement: formatList(requirementElements.map((element) => getElementTitle(element))),
      architecture: escapeMarkdownCell(getElementTitle(architectureElement ?? (task.architectureElementId ? { identifier: task.architectureElementId, name: [], type: 'Unknown' } as GraphElement : undefined))),
      task: formatTask(task),
      sourceFiles: formatList(sourceFiles),
      verified: verified ? '✅ Yes' : '❌ No',
    };
  });
}

function renderMarkdown(commitId: string | undefined, rows: MatrixRow[]): string {
  const lines = ['# Traceability Matrix', ''];

  if (commitId) {
    lines.push(`Scope: commit ${commitId}`, '');
  } else {
    lines.push('Scope: all completed runtime tasks', '');
  }

  if (rows.length === 0) {
    lines.push('No completed runtime tasks matched the requested scope.');
    return lines.join('\n');
  }

  lines.push('| Requirement (Intent) | Architecture Component (Design) | Implemented Task | Source Files (Reality) | Verified by Tests? |');
  lines.push('| --- | --- | --- | --- | --- |');

  for (const row of rows) {
    lines.push(`| ${row.requirement} | ${row.architecture} | ${row.task} | ${row.sourceFiles} | ${row.verified} |`);
  }

  return lines.join('\n');
}

export default tool({
  description: 'Generate a Markdown Traceability Matrix linking Requirements, Architecture, Tasks, Code Reality, and Test Verification.',
  args: {
    commitId: tool.schema.string().optional().describe('Optional commit ID to scope the matrix.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const graph = loadCanonicalKnowledgeGraph(context.worktree);
    const scanResult = scanReality(context.worktree, 200);

    const scopedTasks = state.tasks
      .filter((task) => task.status === 'done')
      .filter((task) => !args.commitId || task.commitId === args.commitId)
      .sort((left, right) => left.id.localeCompare(right.id));

    const rows = buildRows(scopedTasks, graph, scanResult.architectureReferences, new Set(scanResult.verifiedIntentIds));
    return renderMarkdown(args.commitId, rows);
  },
});