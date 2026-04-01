import { tool } from '@opencode-ai/plugin';

import { asJson, extractGoalParts, loadRuntimeState, nextTaskId, normalizeTaskTitle, saveRuntimeState } from '../lib/runtimeState';

export default tool({
  description: 'Break a high-level goal into planning backlog items and persist them for architectural decomposition.',
  args: {
    goal: tool.schema.string().describe('The high-level requirement or goal to decompose.'),
    maxTasks: tool.schema.number().int().min(1).max(12).optional().describe('Maximum number of tasks to create.'),
  },
  async execute(args, context) {
    const state = loadRuntimeState(context.worktree);
    const maxTasks = args.maxTasks ?? 5;
    const parts = extractGoalParts(args.goal, maxTasks);
    const now = new Date().toISOString();

    state.activeGoal = normalizeTaskTitle(args.goal);
    state.tasks = parts.map((title) => ({
      id: nextTaskId(state),
      title,
      status: 'todo',
      kind: 'planning',
      owner: 'SystemArchitect',
      summary: 'Created by decompose_goal as planning input for software-unit decomposition.',
      details: 'SystemArchitect must refine this planning item into concrete software-unit-scoped implementation tasks.',
      createdAt: now,
      updatedAt: now,
    }));
    state.designSummary = '';
    state.designDecisions = [];
    state.issues = [];
    state.validations.qa = {
      status: 'not_run',
      summary: 'QA not run for the current goal.',
      updatedAt: now,
    };
    state.validations.audit = {
      status: 'not_run',
      summary: 'Audit not run for the current goal.',
      updatedAt: now,
    };
    state.release = {
      status: 'not_started',
      summary: 'Release not prepared for the current goal.',
      updatedAt: now,
    };

    saveRuntimeState(context.worktree, state);

    return asJson({
      goal: state.activeGoal,
      createdTaskIds: state.tasks.map((task) => task.id),
      tasks: state.tasks.map((task) => ({ id: task.id, title: task.title, status: task.status, kind: task.kind })),
      nextStep: 'Invoke SystemArchitect to decompose the architecture into software units and derive implementation tasks.',
    });
  },
});