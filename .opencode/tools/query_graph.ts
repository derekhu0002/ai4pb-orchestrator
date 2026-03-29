import { tool } from '@opencode-ai/plugin';

import { asJson, loadKnowledgeGraph, loadRuntimeState, safeSnippet } from '../lib/runtimeState';

type SearchMatch = {
  scope: 'runtime' | 'architecture';
  kind: string;
  id?: string;
  name?: string;
  type?: string;
  snippet: string;
};

function includesAllTerms(haystack: string, query: string): boolean {
  const value = haystack.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => value.includes(term));
}

export default tool({
  description: 'Search the architecture knowledge graph and the runtime project state for matching tasks, elements, relationships, and summaries.',
  args: {
    query: tool.schema.string().describe('Search text, task ID, element name, or concept to look up.'),
    scope: tool.schema.string().optional().describe('all, runtime, or architecture.'),
    limit: tool.schema.number().int().min(1).max(50).optional().describe('Maximum number of matches to return.'),
  },
  async execute(args, context) {
    const scope = args.scope ?? 'all';
    const limit = args.limit ?? 10;
    const matches: SearchMatch[] = [];

    if (scope === 'all' || scope === 'runtime') {
      const state = loadRuntimeState(context.worktree);
      for (const task of state.tasks) {
        const text = `${task.id} ${task.title} ${task.status} ${task.summary ?? ''} ${task.details ?? ''}`;
        if (includesAllTerms(text, args.query)) {
          matches.push({
            scope: 'runtime',
            kind: 'task',
            id: task.id,
            name: task.title,
            type: task.status,
            snippet: safeSnippet(text),
          });
        }
      }

      for (const issue of state.issues) {
        const text = `${issue.id} ${issue.category} ${issue.summary} ${issue.details ?? ''}`;
        if (includesAllTerms(text, args.query)) {
          matches.push({
            scope: 'runtime',
            kind: 'issue',
            id: issue.id,
            name: issue.category,
            snippet: safeSnippet(text),
          });
        }
      }
    }

    if ((scope === 'all' || scope === 'architecture') && matches.length < limit) {
      const graph = loadKnowledgeGraph(context.worktree) as
        | { elements?: unknown[]; relationships?: unknown[] }
        | null;

      const elements = Array.isArray(graph?.elements) ? graph?.elements : [];
      const relationships = Array.isArray(graph?.relationships) ? graph?.relationships : [];

      for (const element of elements as Array<Record<string, unknown>>) {
        const text = `${String(element.id ?? '')} ${String(element.name ?? '')} ${String(element.type ?? '')} ${String(element.description ?? '')}`;
        if (includesAllTerms(text, args.query)) {
          matches.push({
            scope: 'architecture',
            kind: 'element',
            id: String(element.id ?? ''),
            name: String(element.name ?? ''),
            type: String(element.type ?? ''),
            snippet: safeSnippet(text),
          });
        }
        if (matches.length >= limit) {
          break;
        }
      }

      if (matches.length < limit) {
        for (const relationship of relationships as Array<Record<string, unknown>>) {
          const text = `${String(relationship.id ?? '')} ${String(relationship.statement ?? '')} ${String(relationship.name ?? '')} ${String(relationship.description ?? '')}`;
          if (includesAllTerms(text, args.query)) {
            matches.push({
              scope: 'architecture',
              kind: 'relationship',
              id: String(relationship.id ?? ''),
              name: String(relationship.name ?? ''),
              snippet: safeSnippet(text),
            });
          }
          if (matches.length >= limit) {
            break;
          }
        }
      }
    }

    return asJson({ query: args.query, scope, matches: matches.slice(0, limit) });
  },
});