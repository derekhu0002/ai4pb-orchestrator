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

export default tool({
  description: 'Record design, task, validation, issue, and release updates for the OpenCode orchestration runtime.',
  args: {
    action: tool.schema
      .string()
      .describe('Update operation. Supported: set_design_summary, record_decision, add_task, bulk_add_tasks, upsert_task, set_task_status, record_validation, log_issue, resolve_issue, record_release, reset_runtime. Common aliases and generic update_graph_model are accepted.'),
    taskId: tool.schema.string().optional().describe('Task ID for task-related updates.'),
    title: tool.schema.string().optional().describe('Title for a new task or release log.'),
    content: tool.schema.string().optional().describe('Summary or detailed content for the update.'),
    status: tool.schema.string().optional().describe('Status value for task, validation, or release updates.'),
    owner: tool.schema.string().optional().describe('Owner for a new task.'),
    kind: tool.schema.string().optional().describe('Validation or issue kind, such as qa, audit, or ArchitectureGap.'),
    issueId: tool.schema.string().optional().describe('Issue ID for resolve_issue operations.'),
    tasksJson: tool.schema.string().optional().describe('Optional JSON array of task objects for bulk_add_tasks or upsert_task.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const now = new Date().toISOString();
    const normalizedAction = normalizeAction(args.action, args as unknown as Record<string, unknown>);
    let result: Record<string, unknown> = { action: normalizedAction, requestedAction: args.action };

    switch (normalizedAction) {
      case 'set_design_summary': {
        state.designSummary = args.content ?? '';
        result = { action: normalizedAction, designSummary: state.designSummary };
        break;
      }
      case 'record_decision': {
        const decision = args.content?.trim();
        if (!decision) {
          throw new Error('record_decision requires content.');
        }
        state.designDecisions.push(decision);
        result = { action: normalizedAction, decisions: state.designDecisions };
        break;
      }
      case 'add_task': {
        const title = normalizeTaskTitle(args.title ?? args.content ?? 'Untitled task');
        const task = {
          id: nextTaskId(state),
          title,
          status: (args.status as 'todo' | 'in_progress' | 'done' | 'blocked') ?? 'todo',
          owner: args.owner ?? 'Implementation',
          summary: args.content ?? '',
          details: args.content ?? '',
          createdAt: now,
          updatedAt: now,
        };
        state.tasks.push(task);
        result = { action: normalizedAction, task };
        break;
      }
      case 'bulk_add_tasks': {
        const rawTasks = args.tasksJson ? JSON.parse(args.tasksJson) : parseTaskTitles(args.content).map((title) => ({ title }));
        if (!Array.isArray(rawTasks) || rawTasks.length === 0) {
          throw new Error('bulk_add_tasks requires tasksJson or content containing at least one task title.');
        }
        const createdTasks = rawTasks.map((item) => {
          const record = item as Record<string, unknown>;
          const title = normalizeTaskTitle(String(record.title ?? record.name ?? 'Untitled task'));
          return {
            id: nextTaskId(state),
            title,
            status: (String(record.status ?? args.status ?? 'todo') as 'todo' | 'in_progress' | 'done' | 'blocked'),
            owner: String(record.owner ?? args.owner ?? 'Implementation'),
            summary: String(record.summary ?? record.content ?? ''),
            details: String(record.details ?? record.content ?? ''),
            createdAt: now,
            updatedAt: now,
          };
        });
        state.tasks.push(...createdTasks);
        result = { action: normalizedAction, tasks: createdTasks };
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
          if (args.owner) {
            existing.owner = args.owner;
          }
          if (args.content) {
            existing.summary = args.content;
            existing.details = args.content;
          }
          existing.updatedAt = now;
          result = { action: normalizedAction, task: existing, operation: 'updated' };
          break;
        }

        const task = {
          id: args.taskId && args.taskId.trim() ? args.taskId.trim() : nextTaskId(state),
          title: normalizeTaskTitle(args.title ?? args.content ?? 'Untitled task'),
          status: (args.status as 'todo' | 'in_progress' | 'done' | 'blocked') ?? 'todo',
          owner: args.owner ?? 'Implementation',
          summary: args.content ?? '',
          details: args.content ?? '',
          createdAt: now,
          updatedAt: now,
        };
        state.tasks.push(task);
        result = { action: normalizedAction, task, operation: 'created' };
        break;
      }
      case 'set_task_status': {
        if (!args.taskId) {
          throw new Error('set_task_status requires taskId.');
        }
        const task = state.tasks.find((item) => item.id === args.taskId);
        if (!task) {
          throw new Error(`Task not found: ${args.taskId}`);
        }
        if (args.status) {
          task.status = args.status as 'todo' | 'in_progress' | 'done' | 'blocked';
        }
        if (args.content) {
          task.summary = args.content;
          task.details = args.content;
        }
        task.updatedAt = now;
        result = { action: normalizedAction, task };
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
          updatedAt: now,
        };
        result = { action: normalizedAction, validation: { kind, ...state.validations[kind] } };
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
        result = { action: normalizedAction, issue };
        break;
      }
      case 'resolve_issue': {
        const issueId = args.issueId ?? args.taskId;
        if (!issueId) {
          throw new Error('resolve_issue requires issueId.');
        }
        const issue = state.issues.find((item) => item.id === issueId);
        if (!issue) {
          throw new Error(`Issue not found: ${issueId}`);
        }
        issue.summary = `${issue.summary} [Resolved]`;
        if (args.content) {
          issue.details = args.content;
        }
        result = { action: normalizedAction, issue };
        break;
      }
      case 'record_release': {
        state.release = {
          status: args.status === 'completed' ? 'completed' : 'not_started',
          summary: args.content ?? '',
          releaseLogPath: args.title,
          updatedAt: now,
        };
        result = { action: normalizedAction, release: state.release };
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
        result = { action: normalizedAction, status: 'reset' };
        break;
      }
      default:
        throw new Error(`Unsupported action: ${args.action}. Supported actions include set_design_summary, record_decision, add_task, bulk_add_tasks, upsert_task, set_task_status, record_validation, log_issue, resolve_issue, record_release, reset_runtime.`);
    }

    saveRuntimeState(context.worktree, state);
    appendGraphUpdateLog(context.worktree, { action: normalizedAction, requestedAction: args.action, args, result });
    return asJson(result);
  },
});