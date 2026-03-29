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
  description: 'Query the architecture knowledge graph and the runtime project state using structured modes or free-text search.',
  args: {
    mode: tool.schema
      .string()
      .optional()
      .describe('Query mode: search, summary, task_by_id, tasks_by_status, issues, validations, architecture_element, or architecture_relationship.'),
    query: tool.schema.string().optional().describe('Search text, task ID, element name, or concept to look up.'),
    scope: tool.schema.string().optional().describe('all, runtime, or architecture. Used primarily with search mode.'),
    limit: tool.schema.number().int().min(1).max(50).optional().describe('Maximum number of matches to return.'),
    id: tool.schema.string().optional().describe('Task ID, issue ID, element ID, or relationship ID.'),
    status: tool.schema.string().optional().describe('Runtime task status filter: todo, in_progress, done, or blocked.'),
  },
  async execute(args, context) {
    const mode = args.mode ?? 'search';
    const runtimeState = loadRuntimeState(context.worktree);
    const graph = loadKnowledgeGraph(context.worktree) as
      | { elements?: unknown[]; relationships?: unknown[] }
      | null;

    if (mode === 'summary') {
      return asJson({
        activeGoal: runtimeState.activeGoal,
        designSummary: runtimeState.designSummary,
        decisions: runtimeState.designDecisions,
        tasks: runtimeState.tasks,
        issues: runtimeState.issues,
        validations: runtimeState.validations,
        release: runtimeState.release,
      });
    }

    if (mode === 'task_by_id') {
      const task = runtimeState.tasks.find((item) => item.id === args.id || item.id === args.query);
      return asJson({ mode, task: task ?? null });
    }

    if (mode === 'tasks_by_status') {
      const status = (args.status ?? args.query ?? '').toLowerCase();
      const tasks = runtimeState.tasks.filter((item) => item.status === status);
      return asJson({ mode, status, tasks });
    }

    if (mode === 'issues') {
      const issues = args.id
        ? runtimeState.issues.filter((item) => item.id === args.id)
        : runtimeState.issues;
      return asJson({ mode, issues });
    }

    if (mode === 'validations') {
      return asJson({ mode, validations: runtimeState.validations });
    }

    if (mode === 'architecture_element') {
      const elements = Array.isArray(graph?.elements) ? (graph?.elements as Array<Record<string, unknown>>) : [];
      const element = elements.find((item) => String(item.id ?? '') === (args.id ?? args.query) || String(item.name ?? '') === (args.query ?? ''));
      return asJson({ mode, element: element ?? null });
    }

    if (mode === 'architecture_relationship') {
      const relationships = Array.isArray(graph?.relationships) ? (graph?.relationships as Array<Record<string, unknown>>) : [];
      const relationship = relationships.find((item) => String(item.id ?? '') === (args.id ?? args.query) || String(item.name ?? '') === (args.query ?? ''));
      return asJson({ mode, relationship: relationship ?? null });
    }

    const scope = args.scope ?? 'all';
    const limit = args.limit ?? 10;
    const matches: SearchMatch[] = [];

    if (scope === 'all' || scope === 'runtime') {
      for (const task of runtimeState.tasks) {
        const text = `${task.id} ${task.title} ${task.status} ${task.summary ?? ''} ${task.details ?? ''}`;
        if (includesAllTerms(text, args.query ?? '')) {
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

      for (const issue of runtimeState.issues) {
        const text = `${issue.id} ${issue.category} ${issue.summary} ${issue.details ?? ''}`;
        if (includesAllTerms(text, args.query ?? '')) {
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
      const elements = Array.isArray(graph?.elements) ? graph?.elements : [];
      const relationships = Array.isArray(graph?.relationships) ? graph?.relationships : [];

      for (const element of elements as Array<Record<string, unknown>>) {
        const text = `${String(element.id ?? '')} ${String(element.name ?? '')} ${String(element.type ?? '')} ${String(element.description ?? '')}`;
        if (includesAllTerms(text, args.query ?? '')) {
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
          if (includesAllTerms(text, args.query ?? '')) {
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

    return asJson({ mode: 'search', query: args.query ?? '', scope, matches: matches.slice(0, limit) });
  },
});