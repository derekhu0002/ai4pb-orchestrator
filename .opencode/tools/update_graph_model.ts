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

export default tool({
  description: 'Record design, task, validation, issue, and release updates for the OpenCode orchestration runtime.',
  args: {
    action: tool.schema
      .string()
      .describe('One of: set_design_summary, record_decision, add_task, set_task_status, record_validation, log_issue, record_release.'),
    taskId: tool.schema.string().optional().describe('Task ID for task-related updates.'),
    title: tool.schema.string().optional().describe('Title for a new task or release log.'),
    content: tool.schema.string().optional().describe('Summary or detailed content for the update.'),
    status: tool.schema.string().optional().describe('Status value for task, validation, or release updates.'),
    owner: tool.schema.string().optional().describe('Owner for a new task.'),
    kind: tool.schema.string().optional().describe('Validation or issue kind, such as qa, audit, or ArchitectureGap.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const now = new Date().toISOString();
    let result: Record<string, unknown> = { action: args.action };

    switch (args.action) {
      case 'set_design_summary': {
        state.designSummary = args.content ?? '';
        result = { action: args.action, designSummary: state.designSummary };
        break;
      }
      case 'record_decision': {
        const decision = args.content?.trim();
        if (!decision) {
          throw new Error('record_decision requires content.');
        }
        state.designDecisions.push(decision);
        result = { action: args.action, decisions: state.designDecisions };
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
        result = { action: args.action, task };
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
        result = { action: args.action, task };
        break;
      }
      case 'record_validation': {
        const kind = args.kind === 'audit' ? 'audit' : 'qa';
        state.validations[kind] = {
          status: (args.status as 'passed' | 'failed' | 'not_run') ?? 'not_run',
          summary: args.content ?? '',
          details: args.content ?? '',
          updatedAt: now,
        };
        result = { action: args.action, validation: { kind, ...state.validations[kind] } };
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
        result = { action: args.action, issue };
        break;
      }
      case 'record_release': {
        state.release = {
          status: args.status === 'completed' ? 'completed' : 'not_started',
          summary: args.content ?? '',
          releaseLogPath: args.title,
          updatedAt: now,
        };
        result = { action: args.action, release: state.release };
        break;
      }
      default:
        throw new Error(`Unsupported action: ${args.action}`);
    }

    saveRuntimeState(context.worktree, state);
    appendGraphUpdateLog(context.worktree, { action: args.action, args, result });
    return asJson(result);
  },
});