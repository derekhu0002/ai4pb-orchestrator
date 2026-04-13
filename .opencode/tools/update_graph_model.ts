import { tool } from '@opencode-ai/plugin';

import {
  appendGraphUpdateLog,
  asJson,
  loadRuntimeState,
  nextIssueId,
  nextTaskId,
  normalizeTaskTitle,
  saveRuntimeState,
} from '../lib/runtimeState';
import {
  getArchitectManagedElementDocumentationIssue,
  getArchitectManagedRelationshipDocumentationIssue,
  ensureCoreArchitectureBaseline,
  getCanonicalKnowledgeGraphPath,
  type SharedKnowledgeGraph,
  getSupportedElementTypes,
  getSupportedRelationshipTypes,
  loadCanonicalKnowledgeGraph,
  normalizeElementType,
  normalizeRelationshipType,
  saveCanonicalKnowledgeGraph,
  summarizeArchitectureCoverage,
  summarizeIntentionModel,
  syncRuntimeStateToSharedKnowledgeGraph,
  upsertElement,
  upsertRelationship,
  validateElementType,
  validateRelationshipType,
} from '../lib/sharedKnowledgeGraph';

function normalizeAction(action?: string, args?: Record<string, unknown>): string {
  const value = (action ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  const aliases: Record<string, string> = {
    set_design_summary: 'set_design_summary',
    design_summary: 'set_design_summary',
    update_design_summary: 'set_design_summary',
    update_design: 'set_design_summary',
    record_decision: 'record_decision',
    add_decision: 'record_decision',
    append_decision: 'record_decision',
    add_task: 'add_task',
    create_task: 'add_task',
    new_task: 'add_task',
    add_tasks: 'bulk_add_tasks',
    bulk_add_tasks: 'bulk_add_tasks',
    create_tasks: 'bulk_add_tasks',
    set_task_status: 'set_task_status',
    update_task: 'set_task_status',
    update_task_status: 'set_task_status',
    mark_task: 'set_task_status',
    upsert_task: 'upsert_task',
    record_validation: 'record_validation',
    set_validation: 'record_validation',
    qa_passed: 'record_validation',
    qa_failed: 'record_validation',
    audit_passed: 'record_validation',
    audit_failed: 'record_validation',
    log_issue: 'log_issue',
    add_issue: 'log_issue',
    create_issue: 'log_issue',
    resolve_issue: 'resolve_issue',
    close_issue: 'resolve_issue',
    record_release: 'record_release',
    complete_release: 'record_release',
    finalize_release: 'record_release',
    reset_runtime: 'reset_runtime',
    reset_project_state: 'reset_runtime',
    add_element: 'add_element',
    create_element: 'add_element',
    upsert_element: 'upsert_element',
    update_element: 'upsert_element',
    add_relationship: 'add_relationship',
    create_relationship: 'add_relationship',
    upsert_relationship: 'upsert_relationship',
    update_relationship: 'upsert_relationship',
    ensure_architecture_baseline: 'ensure_architecture_baseline',
    bootstrap_architecture_baseline: 'ensure_architecture_baseline',
  };

  if (aliases[value]) {
    return aliases[value];
  }

  if (value === 'update_graph_model' || value === 'update_model' || value === 'update_graph') {
    const kind = String(args?.kind ?? '').toLowerCase();
    if (kind === 'qa' || kind === 'audit') {
      return 'record_validation';
    }
    if (typeof args?.taskId === 'string' && args.taskId) {
      return 'set_task_status';
    }
    if (typeof args?.title === 'string' && args.title) {
      return 'add_task';
    }
    return 'record_decision';
  }

  return value;
}

function parseTaskTitles(raw?: string): string[] {
  return (raw ?? '')
    .split(/\r?\n|;/)
    .map((item) => normalizeTaskTitle(item))
    .filter(Boolean);
}

function normalizeTaskKind(value?: unknown): 'planning' | 'implementation' {
  return String(value ?? '').trim().toLowerCase() === 'planning' ? 'planning' : 'implementation';
}

function normalizeRetryCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function normalizeRetryDelta(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return 0;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized ? normalized : undefined;
}

function requireTaskContractField(value: unknown): string | undefined {
  return optionalText(value);
}

function formatTaskContractMarkdown(record: Record<string, unknown>): string {
  const input = requireTaskContractField(record.input);
  const processing = requireTaskContractField(record.processing);
  const output = requireTaskContractField(record.output);
  const acceptanceCriteria = requireTaskContractField(record.acceptanceCriteria);

  if (!input || !processing || !output || !acceptanceCriteria) {
    throw new Error('bulk_add_tasks is invalid: Each task MUST explicitly provide "input", "processing", "output", and "acceptanceCriteria" fields. Do not use generic summaries.');
  }

  return [
    `- **[Input]**: ${input}`,
    `- **[Processing]**: ${processing}`,
    `- **[Output]**: ${output}`,
    `- **[Acceptance Criteria]**: ${acceptanceCriteria}`,
  ].join('\n');
}

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('```')) {
    return trimmed;
  }

  return trimmed.replace(/^```[a-zA-Z0-9_-]*\s*/, '').replace(/\s*```$/, '').trim();
}

function normalizeLooseJson(raw: string): string {
  let normalized = stripCodeFences(raw)
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1');

  normalized = normalized.replace(/([{,]\s*)'([^'\n\r]+)'\s*:/g, '$1"$2":');
  normalized = normalized.replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_match, value: string) => {
    const escaped = value.replace(/"/g, '\\"');
    return `: "${escaped}"`;
  });

  return normalized;
}

function formatJsonFieldError(fieldName: string, raw: string, detail: string, expected: string): Error {
  const preview = raw.replace(/\s+/g, ' ').trim().slice(0, 220);
  return new Error(
    `${fieldName} is invalid: ${detail}. Expected ${expected}. ` +
      `Remove markdown fences, use double-quoted JSON, and avoid trailing commas. Input preview: ${preview}`
  );
}

function parseJsonWithAutoFix(fieldName: string, raw: string, expected: 'object' | 'array'): unknown {
  const attempts = [stripCodeFences(raw), normalizeLooseJson(raw)].filter(Boolean);
  let lastError: unknown;

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      if (expected === 'array' && !Array.isArray(parsed)) {
        if (parsed && typeof parsed === 'object') {
          return [parsed];
        }
        throw formatJsonFieldError(fieldName, raw, 'parsed value is not an array', 'a JSON array of objects');
      }
      if (expected === 'object' && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) {
        throw formatJsonFieldError(fieldName, raw, 'parsed value is not an object', 'a JSON object');
      }
      return parsed;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : 'unable to parse JSON';
  throw formatJsonFieldError(fieldName, raw, detail, expected === 'array' ? 'a JSON array of objects' : 'a JSON object');
}

function parseExtensionsJson(raw?: string): Record<string, unknown> | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  return parseJsonWithAutoFix('extensionsJson', raw, 'object') as Record<string, unknown>;
}

function parseTasksJson(raw?: string, fallbackContent?: string): Array<Record<string, unknown>> {
  if (raw?.trim()) {
    const parsed = parseJsonWithAutoFix('tasksJson', raw, 'array');
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('tasksJson is invalid: expected a non-empty JSON array of task objects.');
    }

    return parsed.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`tasksJson[${index}] is invalid: each task must be a JSON object with at least a title, name, summary, or content field.`);
      }

      const record = item as Record<string, unknown>;
      if (
        !requireTaskContractField(record.input) ||
        !requireTaskContractField(record.processing) ||
        !requireTaskContractField(record.output) ||
        !requireTaskContractField(record.acceptanceCriteria)
      ) {
        throw new Error('bulk_add_tasks is invalid: Each task MUST explicitly provide "input", "processing", "output", and "acceptanceCriteria" fields. Do not use generic summaries.');
      }

      return item as Record<string, unknown>;
    });
  }

  const titles = parseTaskTitles(fallbackContent);
  if (titles.length === 0) {
    throw new Error('bulk_add_tasks requires tasksJson containing task objects with strict IPO fields.');
  }

  throw new Error('bulk_add_tasks is invalid: Each task MUST explicitly provide "input", "processing", "output", and "acceptanceCriteria" fields. Do not use generic summaries.');
}

function requireNonEmptyText(value: string | undefined, fieldName: string, action: string): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(`${action} requires ${fieldName} to be a non-empty string.`);
  }
  return normalized;
}

function graphHasElement(graph: SharedKnowledgeGraph, elementId: string): boolean {
  return (graph.elements?.element ?? []).some((element) => element.identifier === elementId);
}

function formatSupportedTypeHint(kind: 'elementType' | 'relationshipType', provided: string, suggestions: string[]): string {
  const supported = kind === 'elementType' ? getSupportedElementTypes() : getSupportedRelationshipTypes();
  const suggestionText = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(', ')}?` : '';
  return `Unsupported ${kind}: ${provided}.${suggestionText} Supported values include: ${supported.slice(0, 12).join(', ')}`;
}

function requiresArchitectGradeDocumentation(extensions: Record<string, unknown> | undefined): boolean {
  const ai4pb = (extensions?.ai4pb ?? {}) as Record<string, unknown>;
  return ai4pb.managedBy === 'system-architect';
}

function validateElementDocumentationQuality(
  action: string,
  elementType: string,
  title: string,
  documentation: string | undefined,
  requireArchitectGuidance: boolean
): void {
  if (!requireArchitectGuidance) {
    return;
  }

  const documentationIssue = getArchitectManagedElementDocumentationIssue(elementType, title, documentation);
  if (documentationIssue) {
    throw new Error(`${action} ${documentationIssue}`);
  }
}

function validateRelationshipDocumentationQuality(
  action: string,
  relationshipType: string,
  title: string,
  documentation: string | undefined,
  requireArchitectGuidance: boolean
): void {
  if (!requireArchitectGuidance) {
    return;
  }

  const documentationIssue = getArchitectManagedRelationshipDocumentationIssue(relationshipType, title, documentation);
  if (documentationIssue) {
    throw new Error(`${action} ${documentationIssue}`);
  }
}

export default tool({
  description: 'Record design, task, validation, issue, and release updates for the OpenCode orchestration runtime.',
  args: {
    action: tool.schema
      .string()
      .describe('Update operation. Supported: set_design_summary, record_decision, add_task, bulk_add_tasks, upsert_task, set_task_status, record_validation, log_issue, resolve_issue, record_release, reset_runtime, add_element, upsert_element, add_relationship, upsert_relationship, ensure_architecture_baseline. Common aliases and generic update_graph_model are accepted.'),
    taskId: tool.schema.string().optional().describe('Task ID for task-related updates.'),
    title: tool.schema.string().optional().describe('Title for a new task or release log.'),
    content: tool.schema.string().optional().describe('Summary or detailed content for the update.'),
    status: tool.schema.string().optional().describe('Status value for task, validation, or release updates.'),
    commitId: tool.schema.string().optional().describe('Git commit ID associated with the task or validation update.'),
    retryCount: tool.schema.number().int().min(0).optional().describe('Absolute retry counter to persist on a runtime task.'),
    retryDelta: tool.schema.number().int().optional().describe('Relative retry counter adjustment applied to an existing runtime task.'),
    taskKind: tool.schema.string().optional().describe('Task kind for task-related updates. Supported: planning or implementation.'),
    owner: tool.schema.string().optional().describe('Owner for a new task.'),
    kind: tool.schema.string().optional().describe('Validation or issue kind, such as qa, audit, or ArchitectureGap.'),
    issueId: tool.schema.string().optional().describe('Issue ID for resolve_issue operations.'),
    tasksJson: tool.schema.string().optional().describe('Optional JSON array of task objects for bulk_add_tasks. Each task object MUST contain "title", "input", "processing", "output", and "acceptanceCriteria".'),
    softwareUnitId: tool.schema.string().optional().describe('Primary software unit identifier for a task.'),
    softwareUnitTitle: tool.schema.string().optional().describe('Primary software unit title for a task.'),
    architectureElementId: tool.schema.string().optional().describe('Architecture element identifier that the task implements or changes.'),
    elementId: tool.schema.string().optional().describe('Element identifier for add_element or upsert_element.'),
    elementType: tool.schema.string().optional().describe('Schema element type, such as ApplicationComponent, BusinessProcess, WorkPackage, or Artifact.'),
    relationshipId: tool.schema.string().optional().describe('Relationship identifier for add_relationship or upsert_relationship.'),
    relationshipType: tool.schema.string().optional().describe('Schema relationship type, such as Composition, Aggregation, Realization, Serving, Triggering, or Association.'),
    sourceId: tool.schema.string().optional().describe('Source element identifier for relationship actions.'),
    targetId: tool.schema.string().optional().describe('Target element identifier for relationship actions.'),
    extensionsJson: tool.schema.string().optional().describe('Optional JSON object merged into the concept extensions field.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const sharedGraph = loadCanonicalKnowledgeGraph(context.worktree);
    const now = new Date().toISOString();
    const normalizedAction = normalizeAction(args.action, args as unknown as Record<string, unknown>);
    let result: Record<string, unknown> = {
      action: normalizedAction,
      requestedAction: args.action,
      sharedKnowledgeGraphPath: getCanonicalKnowledgeGraphPath(context.worktree),
    };
    const parsedExtensions = parseExtensionsJson(args.extensionsJson);

    try {
      switch (normalizedAction) {
      case 'set_design_summary': {
        state.designSummary = args.content ?? '';
        sharedGraph.documentation = args.content ? [{ value: args.content }] : sharedGraph.documentation;
        result = { ...result, designSummary: state.designSummary };
        break;
      }
      case 'record_decision': {
        const decision = requireNonEmptyText(args.content, 'content', 'record_decision');
        state.designDecisions.push(decision);
        result = { ...result, decisions: state.designDecisions };
        break;
      }
      case 'add_task': {
        const title = normalizeTaskTitle(args.title ?? args.content ?? 'Untitled task');
        const task = {
          id: nextTaskId(state),
          title,
          status: (args.status as 'todo' | 'in_progress' | 'done' | 'blocked') ?? 'todo',
          retryCount: normalizeRetryCount(args.retryCount),
          kind: normalizeTaskKind(args.taskKind),
          owner: args.owner ?? 'Implementation',
          summary: args.content ?? '',
          details: args.content ?? '',
          commitId: optionalText(args.commitId),
          softwareUnitId: optionalText(args.softwareUnitId),
          softwareUnitTitle: optionalText(args.softwareUnitTitle),
          architectureElementId: optionalText(args.architectureElementId),
          createdAt: now,
          updatedAt: now,
        };
        state.tasks.push(task);
        result = { ...result, task };
        break;
      }
      case 'bulk_add_tasks': {
        const rawTasks = parseTasksJson(args.tasksJson, args.content);
        const createdTasks = rawTasks.map((item) => {
          const record = item as Record<string, unknown>;
          const title = normalizeTaskTitle(String(record.title ?? record.name ?? 'Untitled task'));
          if (!title) {
            throw new Error('bulk_add_tasks is invalid: each task must provide a non-empty title, name, summary, or content field.');
          }
          const details = formatTaskContractMarkdown(record);
          return {
            id: nextTaskId(state),
            title,
            status: (String(record.status ?? args.status ?? 'todo') as 'todo' | 'in_progress' | 'done' | 'blocked'),
            retryCount: normalizeRetryCount(record.retryCount ?? args.retryCount),
            kind: normalizeTaskKind(record.kind ?? args.taskKind),
            owner: String(record.owner ?? args.owner ?? 'Implementation'),
            summary: String(record.summary ?? record.content ?? ''),
            details,
            commitId: optionalText(record.commitId ?? args.commitId),
            softwareUnitId: optionalText(record.softwareUnitId ?? args.softwareUnitId),
            softwareUnitTitle: optionalText(record.softwareUnitTitle ?? args.softwareUnitTitle),
            architectureElementId: optionalText(record.architectureElementId ?? args.architectureElementId),
            createdAt: now,
            updatedAt: now,
          };
        });
        state.tasks.push(...createdTasks);
        result = { ...result, tasks: createdTasks };
        break;
      }
      case 'upsert_task': {
        const existing = args.taskId ? state.tasks.find((item) => item.id === args.taskId) : undefined;
        if (existing) {
          if (args.title) {
            existing.title = normalizeTaskTitle(args.title);
          }
          if (args.status) {
            existing.status = args.status as 'todo' | 'in_progress' | 'done' | 'blocked';
          }
          if (args.retryCount !== undefined) {
            existing.retryCount = normalizeRetryCount(args.retryCount);
          } else if (args.retryDelta !== undefined) {
            existing.retryCount = Math.max(0, existing.retryCount + normalizeRetryDelta(args.retryDelta));
          }
          if (args.taskKind) {
            existing.kind = normalizeTaskKind(args.taskKind);
          }
          if (args.owner) {
            existing.owner = args.owner;
          }
          if (args.content) {
            existing.summary = args.content;
            existing.details = args.content;
          }
          if (args.commitId) {
            existing.commitId = optionalText(args.commitId);
          }
          if (args.softwareUnitId) {
            existing.softwareUnitId = optionalText(args.softwareUnitId);
          }
          if (args.softwareUnitTitle) {
            existing.softwareUnitTitle = optionalText(args.softwareUnitTitle);
          }
          if (args.architectureElementId) {
            existing.architectureElementId = optionalText(args.architectureElementId);
          }
          existing.updatedAt = now;
          result = { ...result, task: existing, operation: 'updated' };
          break;
        }

        const task = {
          id: args.taskId && args.taskId.trim() ? args.taskId.trim() : nextTaskId(state),
          title: normalizeTaskTitle(args.title ?? args.content ?? 'Untitled task'),
          status: (args.status as 'todo' | 'in_progress' | 'done' | 'blocked') ?? 'todo',
          retryCount: normalizeRetryCount(args.retryCount),
          kind: normalizeTaskKind(args.taskKind),
          owner: args.owner ?? 'Implementation',
          summary: args.content ?? '',
          details: args.content ?? '',
          commitId: optionalText(args.commitId),
          softwareUnitId: optionalText(args.softwareUnitId),
          softwareUnitTitle: optionalText(args.softwareUnitTitle),
          architectureElementId: optionalText(args.architectureElementId),
          createdAt: now,
          updatedAt: now,
        };
        state.tasks.push(task);
        result = { ...result, task, operation: 'created' };
        break;
      }
      case 'set_task_status': {
        if (!args.taskId) {
          throw new Error('set_task_status requires taskId. Provide the exact runtime task ID such as TASK-001.');
        }
        const task = state.tasks.find((item) => item.id === args.taskId);
        if (!task) {
          throw new Error(`Task not found: ${args.taskId}. Call query_graph(mode="task_by_id", id="${args.taskId}") first to confirm the exact task ID.`);
        }
        if (args.status) {
          task.status = args.status as 'todo' | 'in_progress' | 'done' | 'blocked';
        }
        if (args.retryCount !== undefined) {
          task.retryCount = normalizeRetryCount(args.retryCount);
        } else if (args.retryDelta !== undefined) {
          task.retryCount = Math.max(0, task.retryCount + normalizeRetryDelta(args.retryDelta));
        }
        if (args.content) {
          task.summary = args.content;
          task.details = args.content;
        }
        if (args.commitId) {
          task.commitId = optionalText(args.commitId);
        }
        task.updatedAt = now;
        result = { ...result, task };
        break;
      }
      case 'record_validation': {
        const kind = String(args.kind ?? '').toLowerCase() === 'audit' || normalizedAction.startsWith('audit_') ? 'audit' : 'qa';
        const status = (() => {
          if (normalizedAction.endsWith('_passed')) {
            return 'passed';
          }
          if (normalizedAction.endsWith('_failed')) {
            return 'failed';
          }
          return (args.status as 'passed' | 'failed' | 'not_run') ?? 'not_run';
        })();
        state.validations[kind] = {
          status,
          summary: args.content ?? '',
          details: args.content ?? '',
          commitId: optionalText(args.commitId),
          updatedAt: now,
        };
        result = { ...result, validation: { kind, ...state.validations[kind] } };
        break;
      }
      case 'log_issue': {
        const issue = {
          id: nextIssueId(state),
          category: args.kind ?? 'Issue',
          summary: args.title ?? args.content ?? 'Issue recorded',
          details: args.content ?? '',
          createdAt: now,
        };
        state.issues.push(issue);
        result = { ...result, issue };
        break;
      }
      case 'resolve_issue': {
        const issueId = args.issueId ?? args.taskId;
        if (!issueId) {
          throw new Error('resolve_issue requires issueId. Provide the exact issue ID such as ISSUE-001.');
        }
        const issue = state.issues.find((item) => item.id === issueId);
        if (!issue) {
          throw new Error(`Issue not found: ${issueId}. Call query_graph(mode="issues") first to inspect available issue IDs.`);
        }
        issue.summary = `${issue.summary} [Resolved]`;
        if (args.content) {
          issue.details = args.content;
        }
        result = { ...result, issue };
        break;
      }
      case 'record_release': {
        state.release = {
          status: args.status === 'completed' ? 'completed' : 'not_started',
          summary: args.content ?? '',
          releaseLogPath: args.title,
          updatedAt: now,
        };
        result = { ...result, release: state.release };
        break;
      }
      case 'reset_runtime': {
        state.activeGoal = '';
        state.designSummary = '';
        state.designDecisions = [];
        state.tasks = [];
        state.issues = [];
        state.validations.qa = {
          status: 'not_run',
          summary: 'No validation has been recorded yet.',
          updatedAt: now,
        };
        state.validations.audit = {
          status: 'not_run',
          summary: 'No validation has been recorded yet.',
          updatedAt: now,
        };
        state.release = {
          status: 'not_started',
          summary: 'Release has not been prepared yet.',
          updatedAt: now,
        };
        result = { ...result, status: 'reset' };
        break;
      }
      case 'add_element':
      case 'upsert_element': {
        const elementName = requireNonEmptyText(args.title ?? args.content ?? 'Unnamed Element', 'title or content', normalizedAction);
        const elementTypeCheck = validateElementType(args.elementType);
        if (!elementTypeCheck.isSupported) {
          throw new Error(formatSupportedTypeHint('elementType', args.elementType ?? elementTypeCheck.normalized, elementTypeCheck.suggestions));
        }
        validateElementDocumentationQuality(
          normalizedAction,
          elementTypeCheck.normalized,
          elementName,
          args.content,
          requiresArchitectGradeDocumentation(parsedExtensions)
        );
        const element = upsertElement(sharedGraph, {
          identifier: args.elementId,
          type: elementTypeCheck.normalized,
          name: elementName,
          documentation: args.content,
          extensions: parsedExtensions,
        });
        result = { ...result, element };
        break;
      }
      case 'add_relationship':
      case 'upsert_relationship': {
        if (!args.sourceId || !args.targetId) {
          throw new Error(`${normalizedAction} requires sourceId and targetId. Provide existing architecture element IDs for both ends of the relationship.`);
        }
        if (!graphHasElement(sharedGraph, args.sourceId)) {
          throw new Error(`${normalizedAction} sourceId not found: ${args.sourceId}. Create or query the source element before creating the relationship.`);
        }
        if (!graphHasElement(sharedGraph, args.targetId)) {
          throw new Error(`${normalizedAction} targetId not found: ${args.targetId}. Create or query the target element before creating the relationship.`);
        }
        const relationshipName = requireNonEmptyText(args.title ?? `${args.sourceId} to ${args.targetId}`, 'title', normalizedAction);
        const relationshipTypeCheck = validateRelationshipType(args.relationshipType);
        if (!relationshipTypeCheck.isSupported) {
          throw new Error(
            formatSupportedTypeHint(
              'relationshipType',
              args.relationshipType ?? relationshipTypeCheck.normalized,
              relationshipTypeCheck.suggestions
            )
          );
        }
        validateRelationshipDocumentationQuality(
          normalizedAction,
          relationshipTypeCheck.normalized,
          relationshipName,
          args.content,
          requiresArchitectGradeDocumentation(parsedExtensions)
        );
        const relationship = upsertRelationship(sharedGraph, {
          identifier: args.relationshipId,
          type: relationshipTypeCheck.normalized,
          name: relationshipName,
          source: args.sourceId,
          target: args.targetId,
          documentation: args.content,
          extensions: parsedExtensions,
        });
        result = { ...result, relationship };
        break;
      }
      case 'ensure_architecture_baseline': {
        const baseline = ensureCoreArchitectureBaseline(sharedGraph, {
          projectGoal: state.activeGoal,
          designSummary: args.content ?? state.designSummary,
        });
        result = {
          ...result,
          baseline,
          architectureCoverage: summarizeArchitectureCoverage(sharedGraph),
          intentionModel: summarizeIntentionModel(sharedGraph),
        };
        break;
      }
      default:
        throw new Error(`Unsupported action: ${args.action}. Supported actions include set_design_summary, record_decision, add_task, bulk_add_tasks, upsert_task, set_task_status, record_validation, log_issue, resolve_issue, record_release, reset_runtime, add_element, upsert_element, add_relationship, upsert_relationship, ensure_architecture_baseline.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`update_graph_model failed for action ${normalizedAction}: ${message}`);
    }

    syncRuntimeStateToSharedKnowledgeGraph(sharedGraph, state);
    saveRuntimeState(context.worktree, state);
    saveCanonicalKnowledgeGraph(context.worktree, sharedGraph);
    appendGraphUpdateLog(context.worktree, { action: normalizedAction, requestedAction: args.action, args, result });
    return asJson(result);
  },
});