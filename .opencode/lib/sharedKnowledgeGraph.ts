import * as fs from 'node:fs';
import * as path from 'node:path';

import type { RuntimeState, RuntimeTask } from './runtimeState';

export type LangString = {
  value: string;
  lang?: string;
};

export type GraphElement = {
  identifier: string;
  type: string;
  name: LangString[];
  documentation?: LangString[];
  properties?: {
    property: Array<{
      propertyDefinitionRef: string;
      value: LangString[];
    }>;
  };
  extensions?: Record<string, unknown>;
};

export type GraphRelationship = GraphElement & {
  source: string;
  target: string;
  accessType?: string;
  modifier?: string;
  isDirected?: boolean;
};

export type SharedKnowledgeGraph = {
  identifier: string;
  version?: string;
  name: LangString[];
  documentation?: LangString[];
  metadata?: Record<string, unknown>;
  elements?: {
    element: GraphElement[];
  };
  relationships?: {
    relationship: GraphRelationship[];
  };
  organizations?: Array<Record<string, unknown>>;
  propertyDefinitions?: {
    propertyDefinition: Array<Record<string, unknown>>;
  };
  extensions?: Record<string, unknown>;
};

const CANONICAL_GRAPH_FILE = path.join('.opencode', 'temp', 'SharedKnowledgeGraph.archimate3.1.json');
const LEGACY_GRAPH_FILE = path.join('design', 'KG', 'SystemArchitecture.json');

type CounterMap = Record<string, number>;

function toLangString(value: string): LangString[] {
  return [{ value }];
}

function toDocumentation(value?: string): LangString[] | undefined {
  if (!value || !value.trim()) {
    return undefined;
  }
  return [{ value: value.trim() }];
}

function ensureExtensions(graph: SharedKnowledgeGraph): Record<string, unknown> {
  graph.extensions ??= {};
  return graph.extensions;
}

function ensureCounters(graph: SharedKnowledgeGraph): CounterMap {
  const extensions = ensureExtensions(graph);
  const ai4pb = (extensions.ai4pb ??= {}) as Record<string, unknown>;
  ai4pb.counters ??= {};
  return ai4pb.counters as CounterMap;
}

function ensureElementArray(graph: SharedKnowledgeGraph): GraphElement[] {
  graph.elements ??= { element: [] };
  return graph.elements.element;
}

function ensureRelationshipArray(graph: SharedKnowledgeGraph): GraphRelationship[] {
  graph.relationships ??= { relationship: [] };
  return graph.relationships.relationship;
}

function cleanupEmptySections(graph: SharedKnowledgeGraph): void {
  if (graph.elements && graph.elements.element.length === 0) {
    delete graph.elements;
  }
  if (graph.relationships && graph.relationships.relationship.length === 0) {
    delete graph.relationships;
  }
  if (graph.organizations && graph.organizations.length === 0) {
    delete graph.organizations;
  }
  if (graph.propertyDefinitions && graph.propertyDefinitions.propertyDefinition.length === 0) {
    delete graph.propertyDefinitions;
  }
}

export function getCanonicalKnowledgeGraphPath(worktree: string): string {
  return path.join(worktree, CANONICAL_GRAPH_FILE);
}

export function getLegacyKnowledgeGraphPath(worktree: string): string {
  return path.join(worktree, LEGACY_GRAPH_FILE);
}

export function createDefaultSharedKnowledgeGraph(): SharedKnowledgeGraph {
  return {
    identifier: 'ai4pb-shared-knowledge-graph',
    version: '1.0.0',
    name: toLangString('AI4PB Shared Knowledge Graph'),
    documentation: toDocumentation('Schema-compliant shared knowledge graph maintained by OpenCode tools.'),
    metadata: {
      schema: './.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json',
      schemaversion: '3.1',
    },
    extensions: {
      ai4pb: {
        managedBy: 'opencode',
        counters: {},
        designSummary: '',
        designDecisions: [],
        runtime: {},
      },
    },
  };
}

export function loadCanonicalKnowledgeGraph(worktree: string): SharedKnowledgeGraph {
  const graphPath = getCanonicalKnowledgeGraphPath(worktree);
  if (!fs.existsSync(graphPath)) {
    const graph = createDefaultSharedKnowledgeGraph();
    saveCanonicalKnowledgeGraph(worktree, graph);
    return graph;
  }
  const raw = fs.readFileSync(graphPath, 'utf8').trim();
  if (!raw) {
    const graph = createDefaultSharedKnowledgeGraph();
    saveCanonicalKnowledgeGraph(worktree, graph);
    return graph;
  }
  return JSON.parse(raw) as SharedKnowledgeGraph;
}

export function saveCanonicalKnowledgeGraph(worktree: string, graph: SharedKnowledgeGraph): void {
  const graphPath = getCanonicalKnowledgeGraphPath(worktree);
  fs.mkdirSync(path.dirname(graphPath), { recursive: true });
  cleanupEmptySections(graph);
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf8');
}

export function loadLegacyKnowledgeGraph(worktree: string): unknown {
  const graphPath = getLegacyKnowledgeGraphPath(worktree);
  if (!fs.existsSync(graphPath)) {
    return null;
  }
  const raw = fs.readFileSync(graphPath, 'utf8').trim();
  return raw ? JSON.parse(raw) : null;
}

export function nextGraphIdentifier(graph: SharedKnowledgeGraph, prefix: string): string {
  const counters = ensureCounters(graph);
  const current = counters[prefix] ?? 0;
  const next = current + 1;
  counters[prefix] = next;
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

export function normalizeElementType(value?: string): string {
  const raw = (value ?? 'BusinessObject').trim();
  const aliases: Record<string, string> = {
    ArchiMate_BusinessActor: 'BusinessActor',
    ArchiMate_BusinessRole: 'BusinessRole',
    ArchiMate_BusinessCollaboration: 'BusinessCollaboration',
    ArchiMate_BusinessProcess: 'BusinessProcess',
    ArchiMate_BusinessFunction: 'BusinessFunction',
    ArchiMate_BusinessService: 'BusinessService',
    ArchiMate_BusinessObject: 'BusinessObject',
    ArchiMate_ApplicationComponent: 'ApplicationComponent',
    ArchiMate_ApplicationService: 'ApplicationService',
    ArchiMate_ApplicationProcess: 'ApplicationProcess',
    ArchiMate_DataObject: 'DataObject',
    ArchiMate_Node: 'Node',
    ArchiMate_Artifact: 'Artifact',
    ArchiMate_Goal: 'Goal',
    ArchiMate_Requirement: 'Requirement',
    ArchiMate_WorkPackage: 'WorkPackage',
    ArchiMate_Gap: 'Gap',
  };
  return aliases[raw] ?? raw;
}

export function normalizeRelationshipType(value?: string): string {
  const raw = (value ?? 'Association').trim();
  const aliases: Record<string, string> = {
    ArchiMate_Composition: 'Composition',
    ArchiMate_Aggregation: 'Aggregation',
    ArchiMate_Assignment: 'Assignment',
    ArchiMate_Realization: 'Realization',
    ArchiMate_Serving: 'Serving',
    ArchiMate_Access: 'Access',
    ArchiMate_Influence: 'Influence',
    ArchiMate_Triggering: 'Triggering',
    ArchiMate_Flow: 'Flow',
    ArchiMate_Specialization: 'Specialization',
    ArchiMate_Association: 'Association',
  };
  return aliases[raw] ?? raw;
}

export function findElement(graph: SharedKnowledgeGraph, identifierOrName: string): GraphElement | undefined {
  const needle = identifierOrName.trim();
  return ensureElementArray(graph).find(
    (element) => element.identifier === needle || element.name.some((item) => item.value === needle)
  );
}

export function findRelationship(graph: SharedKnowledgeGraph, identifierOrName: string): GraphRelationship | undefined {
  const needle = identifierOrName.trim();
  return ensureRelationshipArray(graph).find(
    (relationship) => relationship.identifier === needle || relationship.name.some((item) => item.value === needle)
  );
}

export function upsertElement(
  graph: SharedKnowledgeGraph,
  input: {
    identifier?: string;
    type?: string;
    name: string;
    documentation?: string;
    extensions?: Record<string, unknown>;
  }
): GraphElement {
  const identifier = input.identifier?.trim() || nextGraphIdentifier(graph, 'ELM');
  const existing = findElement(graph, identifier);
  if (existing) {
    existing.type = normalizeElementType(input.type ?? existing.type);
    existing.name = toLangString(input.name);
    existing.documentation = toDocumentation(input.documentation);
    existing.extensions = { ...(existing.extensions ?? {}), ...(input.extensions ?? {}) };
    return existing;
  }

  const created: GraphElement = {
    identifier,
    type: normalizeElementType(input.type),
    name: toLangString(input.name),
    documentation: toDocumentation(input.documentation),
    extensions: input.extensions,
  };
  ensureElementArray(graph).push(created);
  return created;
}

export function upsertRelationship(
  graph: SharedKnowledgeGraph,
  input: {
    identifier?: string;
    type?: string;
    name: string;
    source: string;
    target: string;
    documentation?: string;
    extensions?: Record<string, unknown>;
  }
): GraphRelationship {
  const identifier = input.identifier?.trim() || nextGraphIdentifier(graph, 'REL');
  const existing = findRelationship(graph, identifier);
  if (existing) {
    existing.type = normalizeRelationshipType(input.type ?? existing.type);
    existing.name = toLangString(input.name);
    existing.source = input.source;
    existing.target = input.target;
    existing.documentation = toDocumentation(input.documentation);
    existing.extensions = { ...(existing.extensions ?? {}), ...(input.extensions ?? {}) };
    return existing;
  }

  const created: GraphRelationship = {
    identifier,
    type: normalizeRelationshipType(input.type),
    name: toLangString(input.name),
    source: input.source,
    target: input.target,
    documentation: toDocumentation(input.documentation),
    extensions: input.extensions,
  };
  ensureRelationshipArray(graph).push(created);
  return created;
}

function runtimeTaskStatusToMasStatus(status: RuntimeTask['status']): 'ToDo' | 'InProgress' | 'Done' | 'Blocked' {
  if (status === 'in_progress') {
    return 'InProgress';
  }
  if (status === 'done') {
    return 'Done';
  }
  if (status === 'blocked') {
    return 'Blocked';
  }
  return 'ToDo';
}

function issueTypeFromCategory(category: string): 'BugReport' | 'ArchGap' | 'Query' {
  const normalized = category.toLowerCase();
  if (normalized.includes('bug')) {
    return 'BugReport';
  }
  if (normalized.includes('arch')) {
    return 'ArchGap';
  }
  return 'Query';
}

function pruneManagedConcepts(graph: SharedKnowledgeGraph): void {
  if (graph.elements) {
    graph.elements.element = graph.elements.element.filter((element) => {
      const ai4pb = (element.extensions?.ai4pb ?? {}) as Record<string, unknown>;
      return ai4pb.managedBy !== 'opencode-runtime';
    });
  }
  if (graph.relationships) {
    graph.relationships.relationship = graph.relationships.relationship.filter((relationship) => {
      const ai4pb = (relationship.extensions?.ai4pb ?? {}) as Record<string, unknown>;
      return ai4pb.managedBy !== 'opencode-runtime';
    });
  }
}

export function syncRuntimeStateToSharedKnowledgeGraph(graph: SharedKnowledgeGraph, state: RuntimeState): void {
  pruneManagedConcepts(graph);

  const extensions = ensureExtensions(graph);
  const ai4pb = (extensions.ai4pb ??= {}) as Record<string, unknown>;
  ai4pb.designSummary = state.designSummary;
  ai4pb.designDecisions = state.designDecisions;
  ai4pb.runtime = {
    activeGoal: state.activeGoal,
    validations: state.validations,
    release: state.release,
    updatedAt: state.updatedAt,
  };

  const project = upsertElement(graph, {
    identifier: 'PROJECT-CURRENT',
    type: 'WorkPackage',
    name: state.activeGoal || 'Current Project Goal',
    documentation: state.designSummary || state.activeGoal || 'Current OpenCode project goal.',
    extensions: {
      ai4pb: {
        managedBy: 'opencode-runtime',
        kind: 'Project',
        rawRequirement: state.activeGoal,
        status: 'InProgress',
      },
    },
  });

  for (const task of state.tasks) {
    const taskElement = upsertElement(graph, {
      identifier: task.id,
      type: 'WorkPackage',
      name: task.title,
      documentation: task.details ?? task.summary ?? task.title,
      extensions: {
        ai4pb: {
          managedBy: 'opencode-runtime',
          kind: 'Task',
          status: runtimeTaskStatusToMasStatus(task.status),
          assignee: task.owner ?? 'Implementation',
          summary: task.summary ?? '',
          updatedAt: task.updatedAt,
        },
      },
    });
    upsertRelationship(graph, {
      identifier: `REL-PROJECT-${task.id}`,
      type: 'Aggregation',
      name: `Project aggregates ${task.id}`,
      source: project.identifier,
      target: taskElement.identifier,
      documentation: 'Runtime task relationship managed by OpenCode runtime.',
      extensions: {
        ai4pb: {
          managedBy: 'opencode-runtime',
          kind: 'ProjectTaskLink',
        },
      },
    });
  }

  for (const issue of state.issues) {
    upsertElement(graph, {
      identifier: issue.id,
      type: 'BusinessObject',
      name: issue.summary,
      documentation: issue.details ?? issue.summary,
      extensions: {
        ai4pb: {
          managedBy: 'opencode-runtime',
          kind: 'Issue',
          issueType: issueTypeFromCategory(issue.category),
          status: issue.summary.includes('[Resolved]') ? 'Resolved' : 'Open',
          reporter: 'OpenCode',
          category: issue.category,
        },
      },
    });
  }

  if (state.release.status === 'completed') {
    upsertElement(graph, {
      identifier: 'RELEASE-LOG',
      type: 'Artifact',
      name: 'SprintReleaseLog',
      documentation: state.release.summary,
      extensions: {
        ai4pb: {
          managedBy: 'opencode-runtime',
          kind: 'ReleaseLog',
          version: graph.version ?? '1.0.0',
          content: state.release.summary,
          timestamp: state.release.updatedAt,
          path: state.release.releaseLogPath,
        },
      },
    });
  }
}