"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const RELATIVE_PATHS = {
    architectureJson: 'design/KG/SystemArchitecture.json',
    designTasksDir: 'design/tasks',
    aiConfig: '.aicodingconfig'
};
const BUNDLED_PATHS = {
    eaTemplate: 'EA-model-template/EA-model-template.feap',
    skillsRoot: '.github/skills',
    initialPrompt: 'workprompt/initial-prompt.md',
    wrapPrompt: 'workprompt/Wrap-up Prompt.md',
    reversePrompt: 'workprompt/reverse-engineer-WHOLE.md',
    taskListPrompt: 'workprompt/task-list-prompt.md',
    taskSupportPrompt: 'workprompt/task-support-prompt.md',
    weeklyReportPrompt: 'workprompt/weekly-report-prompt.md',
    iterationIssuesPrompt: 'workprompt/iteration-issues-prompt.md',
    iterationSummaryPrompt: 'workprompt/iteration-summary.md'
};
const TOOL_NAMES = {
    initPrompt: 'ai4pb_get_init_session_prompt',
    wrapPrompt: 'ai4pb_get_wrap_up_prompt',
    auditPrompt: 'ai4pb_get_design_audit_prompt',
    taskListPrompt: 'ai4pb_get_task_list_prompt',
    taskSupportPrompt: 'ai4pb_get_task_support_prompt',
    weeklyReportPrompt: 'ai4pb_get_weekly_report_prompt',
    iterationIssuesPrompt: 'ai4pb_get_iteration_issues_prompt',
    iterationSummaryPrompt: 'ai4pb_get_iteration_summary_prompt'
};
const SKILL_PROMPT_REFERENCE = {
    init: '#ai4pb-init',
    audit: '#ai4pb-audit',
    wrapup: '#ai4pb-wrapup',
    'iteration-summary': '#ai4pb-iteration-summary',
    'task-list': '#ai4pb-task-list',
    'task-support': '#ai4pb-task-support',
    'weekly-report': '#ai4pb-weekly-report',
    'iteration-issues': '#ai4pb-iteration-issues'
};
const SKILL_DISPLAY_LABEL = {
    init: '迭代启动',
    audit: '设计审计',
    wrapup: '迭代收尾',
    'iteration-summary': '提交总结',
    'task-list': '待办梳理',
    'task-support': '执行支持',
    'weekly-report': '周报输出',
    'iteration-issues': '问题处理'
};
const WORKFLOW_FLOW_OPTIONS = [
    {
        key: 'delivery',
        label: 'SCRUM敏捷开发流程',
        description: '待办梳理 -> 迭代启动 -> 问题处理 -> 迭代收尾 -> 提交总结',
        steps: [
            { key: 'task-list', label: '待办梳理' },
            { key: 'init', label: '迭代启动' },
            { key: 'iteration-issues', label: '问题处理' },
            { key: 'wrapup', label: '迭代收尾' },
            { key: 'iteration-summary', label: '提交总结' }
        ]
    },
    {
        key: 'audit',
        label: '设计审计流程',
        description: '架构对齐审计',
        steps: [{ key: 'audit', label: '设计审计' }]
    },
    {
        key: 'planning',
        label: '计划与汇报流程',
        description: '待办梳理 -> 周报输出',
        steps: [
            { key: 'task-list', label: '待办梳理' },
            { key: 'weekly-report', label: '周报输出' }
        ]
    },
    {
        key: 'support',
        label: '执行支持流程',
        description: '任务执行支持',
        steps: [{ key: 'task-support', label: '执行支持' }]
    }
];
const GUIDED_DEFAULTS = {
    needallmaintenace: 'onlyActive',
    needbrowserlocation: true,
    maintenacetype: 'forllm'
};
const GITHUB_DOC_BASE_URL = 'https://github.com/derekhu0002/ai4pb-orchestrator/blob/main';
const HELP_URLS = {
    menu: {
        auto: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        flow: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        config: `${GITHUB_DOC_BASE_URL}/docs/getting-started/04-orchestrator-extension.md`,
        send: `${GITHUB_DOC_BASE_URL}/docs/getting-started/04-orchestrator-extension.md`
    },
    flow: {
        delivery: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        audit: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        planning: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        support: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`
    },
    step: {
        init: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        audit: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        wrapup: `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        'iteration-summary': `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        'task-list': `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        'task-support': `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        'weekly-report': `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`,
        'iteration-issues': `${GITHUB_DOC_BASE_URL}/docs/getting-started/05-scrum-workflow.md`
    },
    config: {
        init: `${GITHUB_DOC_BASE_URL}/docs/getting-started/03-modeling-and-export.md`,
        options: `${GITHUB_DOC_BASE_URL}/docs/getting-started/04-orchestrator-extension.md`
    }
};
const WORKFLOW_VIEW_STATE_KEY = 'ai4pb.workflowViewState';
const DEFAULT_WORKFLOW_VIEW_STATE = {
    activeMenu: 'auto',
    confirmedMenu: 'auto',
    menuOpen: false,
    expandedConfig: false,
    expandedFlow: null,
    selectedFlow: null,
    selectedSkill: null,
    draftText: '',
    thread: [
        {
            kind: 'bubble',
            role: 'ai',
            text: '欢迎使用 AI4PB Skill Chat。可以手动选择 SKILL，或直接输入自然语言由系统自动路由。'
        }
    ]
};
let output;
let extensionInstallRoot = '';
function activate(context) {
    extensionInstallRoot = context.extensionUri.fsPath;
    output = vscode.window.createOutputChannel('AI4PB Orchestrator');
    output.appendLine('AI4PB Orchestrator activated.');
    ensureWorkspaceSkillsInstalled();
    void vscode.window.showInformationMessage(`AI4PB loaded: ${context.extension.id}`);
    const extensionVersion = String(context.extension.packageJSON?.version ?? 'unknown');
    const workflowViewProvider = new WorkflowViewProvider(context.extensionUri, extensionVersion, context);
    registerPromptTools(context);
    context.subscriptions.push(output, vscode.window.registerWebviewViewProvider(WorkflowViewProvider.viewType, workflowViewProvider), vscode.commands.registerCommand('ai4pb.initializeFromTemplate', initializeFromTemplate), vscode.commands.registerCommand('ai4pb.refreshArchitectureContext', refreshArchitectureContext), vscode.commands.registerCommand('ai4pb.startIterationFromModel', startIterationFromModel), vscode.commands.registerCommand('ai4pb.runDesignCodeAlignment', runDesignCodeAlignment), vscode.commands.registerCommand('ai4pb.generateWrapUpReport', generateWrapUpReport), vscode.commands.registerCommand('ai4pb.openNextAction', openNextAction), vscode.commands.registerCommand('ai4pb.runGuidedWorkflow', runGuidedWorkflow), vscode.commands.registerCommand('ai4pb.openCopilotWithInitPrompt', openCopilotWithInitPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithDesignAuditPrompt', openCopilotWithDesignAuditPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithWrapUpPrompt', openCopilotWithWrapUpPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithTaskListPrompt', openCopilotWithTaskListPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithTaskSupportPrompt', openCopilotWithTaskSupportPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithWeeklyReportPrompt', openCopilotWithWeeklyReportPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithIterationIssuesPrompt', openCopilotWithIterationIssuesPrompt), vscode.commands.registerCommand('ai4pb.openCopilotWithIterationSummaryPrompt', openCopilotWithIterationSummaryPrompt));
}
function deactivate() {
    output?.dispose();
}
class PromptTemplateTool {
    constructor(label, promptRelativePath) {
        this.label = label;
        this.promptRelativePath = promptRelativePath;
    }
    prepareInvocation(_options, _token) {
        return {
            invocationMessage: `Loading ${this.label} prompt template`
        };
    }
    invoke(_options, _token) {
        const promptPath = resolveExtensionPath(this.promptRelativePath);
        if (!exists(promptPath)) {
            throw new Error(`AI4PB prompt file not found: ${promptPath}`);
        }
        const content = fs.readFileSync(promptPath, 'utf-8').trim();
        if (!content) {
            throw new Error(`AI4PB prompt file is empty: ${promptPath}`);
        }
        const resultText = [
            `AI4PB ${this.label} prompt template from ${this.promptRelativePath}:`,
            '',
            content
        ].join('\n');
        return new vscode.LanguageModelToolResult([new vscode.LanguageModelTextPart(resultText)]);
    }
}
// @ArchitectureID: 1187
function registerPromptTools(context) {
    const toolDefinitions = [
        { name: TOOL_NAMES.initPrompt, label: 'Init Session', promptRelativePath: BUNDLED_PATHS.initialPrompt },
        { name: TOOL_NAMES.wrapPrompt, label: 'Wrap-up', promptRelativePath: BUNDLED_PATHS.wrapPrompt },
        { name: TOOL_NAMES.auditPrompt, label: 'Design Audit', promptRelativePath: BUNDLED_PATHS.reversePrompt },
        { name: TOOL_NAMES.taskListPrompt, label: 'Task List', promptRelativePath: BUNDLED_PATHS.taskListPrompt },
        { name: TOOL_NAMES.taskSupportPrompt, label: 'Task Support', promptRelativePath: BUNDLED_PATHS.taskSupportPrompt },
        { name: TOOL_NAMES.weeklyReportPrompt, label: 'Weekly Report', promptRelativePath: BUNDLED_PATHS.weeklyReportPrompt },
        { name: TOOL_NAMES.iterationIssuesPrompt, label: 'Iteration Issues', promptRelativePath: BUNDLED_PATHS.iterationIssuesPrompt },
        { name: TOOL_NAMES.iterationSummaryPrompt, label: 'Iteration Summary', promptRelativePath: BUNDLED_PATHS.iterationSummaryPrompt }
    ];
    for (const tool of toolDefinitions) {
        context.subscriptions.push(vscode.lm.registerTool(tool.name, new PromptTemplateTool(tool.label, tool.promptRelativePath)));
        output.appendLine(`[AI4PB] Tool registered: ${tool.name}`);
    }
}
// @ArchitectureID: 1213
class WorkflowViewProvider {
    constructor(extensionUri, extensionVersion, context) {
        this.extensionUri = extensionUri;
        this.extensionVersion = extensionVersion;
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview, this.getSavedState());
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'syncState' && message.state) {
                await this.saveState(message.state);
                return;
            }
            if (message.type === 'openHelp' && message.url) {
                await vscode.env.openExternal(vscode.Uri.parse(message.url));
                return;
            }
            if (message.type === 'chatRequest') {
                await this.handleChatRequest(message.text, message.skill);
                return;
            }
            if (message.type === 'autoConfirm') {
                await this.handleAutoConfirm(message.text, message.skill);
                return;
            }
            if (message.type === 'statusAction' && message.key) {
                await this.handleStatusAction(message.key);
                return;
            }
            const command = message.command;
            if (!command) {
                return;
            }
            await vscode.commands.executeCommand(command);
        });
        webviewView.onDidDispose(() => {
            this.webviewView = undefined;
        });
    }
    getSavedState() {
        const raw = this.context.workspaceState.get(WORKFLOW_VIEW_STATE_KEY);
        return sanitizeWorkflowViewState(raw);
    }
    async saveState(raw) {
        await this.context.workspaceState.update(WORKFLOW_VIEW_STATE_KEY, sanitizeWorkflowViewState(raw));
    }
    // @ArchitectureID: 1209
    async handleChatRequest(rawText, rawSkill) {
        const text = (rawText ?? '').trim();
        const explicitSkill = normalizeSkillKey(rawSkill);
        if (explicitSkill) {
            const seedText = buildSkillSeedText(explicitSkill, text);
            await openCopilotWithPromptReference(seedText, `${SKILL_DISPLAY_LABEL[explicitSkill]} skill`);
            return;
        }
        if (!text) {
            await this.webviewView?.webview.postMessage({
                type: 'autoAnalysisError',
                message: '请输入任务描述后再进行 AUTO 分析。'
            });
            return;
        }
        const suggestions = await analyzeAutoSkillSuggestions(text);
        await this.webviewView?.webview.postMessage({
            type: 'autoSuggestion',
            text,
            suggestions: suggestions.map((suggestion) => ({
                skill: suggestion.skill,
                skillLabel: SKILL_DISPLAY_LABEL[suggestion.skill],
                promptRef: SKILL_PROMPT_REFERENCE[suggestion.skill],
                reason: suggestion.reason
            }))
        });
    }
    // @ArchitectureID: 1213
    async handleAutoConfirm(rawText, rawSkill) {
        const text = (rawText ?? '').trim();
        const selectedSkill = normalizeSkillKey(rawSkill) ?? inferSkillFromText(text);
        const seedText = buildSkillSeedText(selectedSkill, text);
        await openCopilotWithPromptReference(seedText, `${SKILL_DISPLAY_LABEL[selectedSkill]} skill (auto confirmed)`);
        await this.webviewView?.webview.postMessage({
            type: 'autoDispatchDone',
            skill: selectedSkill,
            skillLabel: SKILL_DISPLAY_LABEL[selectedSkill]
        });
    }
    // @ArchitectureID: 1213
    async handleStatusAction(key) {
        try {
            const root = getWorkspaceRoot();
            const archPath = getArchitectureJsonPath(root);
            if (key === 'architecture') {
                if (exists(archPath)) {
                    await openFileIfExists(archPath);
                }
                else {
                    await vscode.commands.executeCommand('ai4pb.refreshArchitectureContext');
                    void vscode.window.showWarningMessage('Architecture JSON is missing. Run EA export first.');
                }
                return;
            }
            if (key === 'init') {
                await vscode.commands.executeCommand('ai4pb.initializeFromTemplate');
                return;
            }
            if (key === 'options') {
                await configureGuidedOptions(root);
                return;
            }
            if (key === 'copilotInit') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithInitPrompt');
                return;
            }
            if (key === 'copilotAudit') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithDesignAuditPrompt');
                return;
            }
            if (key === 'copilotWrapUp') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithWrapUpPrompt');
                return;
            }
            if (key === 'copilotTaskList') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithTaskListPrompt');
                return;
            }
            if (key === 'copilotTaskSupport') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithTaskSupportPrompt');
                return;
            }
            if (key === 'copilotWeeklyReport') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithWeeklyReportPrompt');
                return;
            }
            if (key === 'copilotIterationIssues') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithIterationIssuesPrompt');
                return;
            }
            if (key === 'copilotIterationSummary') {
                await vscode.commands.executeCommand('ai4pb.openCopilotWithIterationSummaryPrompt');
                return;
            }
            if (key === 'reports') {
                const latestReportPath = this.findLatestReportPath(resolvePath(root, 'TEMP'));
                if (latestReportPath) {
                    await openFileIfExists(latestReportPath);
                }
                else {
                    await vscode.commands.executeCommand('ai4pb.generateWrapUpReport');
                }
                return;
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(`AI4PB status action failed: ${message}`);
        }
    }
    findLatestReportMtime(tempDir) {
        if (!exists(tempDir)) {
            return undefined;
        }
        const entries = fs.readdirSync(tempDir);
        let latest;
        for (const entry of entries) {
            if (!/^design-code-alignment-|^wrap-up-/.test(entry) || !entry.endsWith('.md')) {
                continue;
            }
            const fullPath = path.join(tempDir, entry);
            if (!exists(fullPath)) {
                continue;
            }
            const mtime = fileMtime(fullPath);
            if (!mtime) {
                continue;
            }
            if (!latest || mtime.getTime() > latest.getTime()) {
                latest = mtime;
            }
        }
        return latest;
    }
    findLatestReportPath(tempDir) {
        if (!exists(tempDir)) {
            return undefined;
        }
        const entries = fs.readdirSync(tempDir);
        let latestPath;
        let latestTime = 0;
        for (const entry of entries) {
            if (!/^design-code-alignment-|^wrap-up-/.test(entry) || !entry.endsWith('.md')) {
                continue;
            }
            const fullPath = path.join(tempDir, entry);
            const mtime = fileMtime(fullPath);
            const ms = mtime?.getTime() ?? 0;
            if (ms > latestTime) {
                latestTime = ms;
                latestPath = fullPath;
            }
        }
        return latestPath;
    }
    // @ArchitectureID: 1209
    getHtml(webview, initialState) {
        const nonce = String(Date.now());
        const flowsJson = JSON.stringify(WORKFLOW_FLOW_OPTIONS);
        const helpUrlsJson = JSON.stringify(HELP_URLS);
        const initialStateJson = JSON.stringify(initialState);
        const versionText = this.extensionVersion;
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    :root {
      --chat-radius: 14px;
      --chat-panel: color-mix(in srgb, var(--vscode-editor-background) 86%, var(--vscode-editorWidget-background) 14%);
      --chat-border: color-mix(in srgb, var(--vscode-foreground) 18%, transparent);
    }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background:
        radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--vscode-textLink-foreground) 16%, transparent) 0%, transparent 44%),
        radial-gradient(circle at 8% 92%, color-mix(in srgb, var(--vscode-button-background) 14%, transparent) 0%, transparent 40%),
        var(--vscode-editor-background);
      padding: 10px;
      margin: 0;
    }
    .shell {
      display: grid;
      grid-template-rows: auto 1fr auto auto;
      gap: 10px;
      height: calc(100vh - 20px);
      min-height: 440px;
    }
    .title {
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      opacity: 0.85;
    }
    .status-banner {
      display: grid;
      gap: 8px;
      padding: 10px 12px;
      border: 1px solid color-mix(in srgb, var(--vscode-button-background) 30%, var(--chat-border));
      border-radius: 14px;
      background:
        linear-gradient(135deg, color-mix(in srgb, var(--vscode-button-background) 18%, transparent), transparent 55%),
        color-mix(in srgb, var(--chat-panel) 92%, var(--vscode-editorWidget-background) 8%);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-button-background) 12%, transparent);
    }
    .status-banner-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-banner-title svg {
      width: 16px;
      height: 16px;
      flex: 0 0 auto;
      color: var(--vscode-button-background);
    }
    .status-banner-items {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--chat-border);
      background: color-mix(in srgb, var(--chat-panel) 72%, transparent);
      font-size: 11px;
      line-height: 1.35;
    }
    .status-chip svg {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
      opacity: 0.9;
    }
    .status-chip.mode {
      border-color: color-mix(in srgb, var(--vscode-button-background) 36%, transparent);
      background: color-mix(in srgb, var(--vscode-button-background) 18%, var(--chat-panel));
    }
    .status-chip.flow {
      border-color: color-mix(in srgb, var(--vscode-textLink-foreground) 36%, transparent);
    }
    .status-chip.step {
      border-color: color-mix(in srgb, var(--vscode-terminal-ansiGreen) 36%, transparent);
    }
    .status-chip.hint {
      opacity: 0.86;
    }
    .skills {
      position: relative;
      display: block;
      min-height: 44px;
      overflow: visible;
    }
    .menu-context-shell {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 320px;
      max-width: calc(100vw - 40px);
      max-height: 220px;
      overflow-y: auto;
      display: block;
      padding: 0;
      z-index: 3;
      pointer-events: auto;
      opacity: 1;
      transform: translateY(0);
      transition: opacity 120ms ease, transform 120ms ease;
      border: 1px solid var(--chat-border);
      border-radius: 14px;
      background: color-mix(in srgb, var(--chat-panel) 94%, var(--vscode-editorWidget-background) 6%);
      box-shadow: 0 12px 32px color-mix(in srgb, #000 24%, transparent);
      backdrop-filter: blur(10px);
    }
    .menu-context-shell.hidden {
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
      visibility: hidden;
    }
    .primary-menu-row {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      z-index: 1;
    }
    .primary-menu-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--chat-border);
      background: color-mix(in srgb, var(--chat-panel) 78%, transparent);
      color: var(--vscode-foreground);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 11px;
      cursor: pointer;
      transition: background 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
    }
    .primary-menu-btn.active {
      border-color: var(--vscode-button-background);
      background: color-mix(in srgb, var(--vscode-button-background) 24%, var(--chat-panel));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-button-background) 28%, transparent);
    }
    .primary-menu-btn.current {
      border-color: color-mix(in srgb, var(--vscode-button-background) 48%, transparent);
      background: color-mix(in srgb, var(--vscode-button-background) 18%, var(--chat-panel));
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-button-background) 18%, transparent);
    }
    .primary-menu-btn svg {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
      opacity: 0.92;
    }
    .button-with-help {
      position: relative;
      display: inline-flex;
      align-items: center;
      max-width: 100%;
    }
    .help-btn {
      width: 20px;
      height: 20px;
      position: absolute;
      top: -8px;
      right: -8px;
      border-radius: 999px;
      border: 1px solid var(--chat-border);
      background: color-mix(in srgb, var(--chat-panel) 82%, transparent);
      color: var(--vscode-descriptionForeground, var(--vscode-foreground));
      cursor: pointer;
      font-size: 11px;
      line-height: 1;
      padding: 0;
      flex: 0 0 auto;
      opacity: 0;
      transform: scale(0.9);
      pointer-events: none;
      transition: opacity 120ms ease, transform 120ms ease, border-color 120ms ease, color 120ms ease;
      z-index: 2;
    }
    .button-with-help:hover .help-btn,
    .button-with-help:focus-within .help-btn {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }
    .help-btn:hover {
      border-color: var(--vscode-textLink-foreground);
      color: var(--vscode-textLink-foreground);
    }
    .flow-toggle-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 10px 0;
    }
    .flow-toggle {
      border: 1px solid var(--chat-border);
      background: color-mix(in srgb, var(--chat-panel) 78%, transparent);
      color: var(--vscode-foreground);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 11px;
      cursor: pointer;
    }
    .flow-toggle.current {
      border-color: color-mix(in srgb, var(--vscode-button-background) 45%, transparent);
    }
    .flow-toggle.expanded {
      border-color: var(--vscode-button-background);
      background: color-mix(in srgb, var(--vscode-button-background) 18%, var(--chat-panel));
    }
    .flow-panel {
      border-top: 1px solid color-mix(in srgb, var(--chat-border) 85%, transparent);
      border-radius: 0 0 14px 14px;
      padding: 10px;
      background: transparent;
      display: grid;
      gap: 8px;
    }
    .flow-panel.current {
      border-color: var(--vscode-button-background);
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-button-background) 35%, transparent);
    }
    .flow-panel-header {
      display: grid;
      gap: 4px;
    }
    .flow-panel-title {
      font-size: 12px;
      font-weight: 600;
    }
    .flow-panel-desc {
      font-size: 11px;
      opacity: 0.76;
      line-height: 1.4;
    }
    .flow-step-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .skill-chip {
      border: 1px solid var(--chat-border);
      background: color-mix(in srgb, var(--chat-panel) 76%, transparent);
      color: var(--vscode-foreground);
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
    }
    .skill-chip.active {
      border-color: var(--vscode-button-background);
      background: color-mix(in srgb, var(--vscode-button-background) 20%, var(--chat-panel));
    }
    .flow-step {
      font-size: 11px;
    }
    .thread {
      border: 1px solid var(--chat-border);
      border-radius: var(--chat-radius);
      padding: 10px;
      overflow-y: auto;
      background: var(--chat-panel);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bubble {
      border-radius: 12px;
      padding: 8px 10px;
      line-height: 1.45;
      font-size: 12px;
      max-width: 95%;
      white-space: pre-wrap;
    }
    .bubble.ai {
      background: color-mix(in srgb, var(--vscode-editorWidget-background) 78%, transparent);
      border: 1px solid var(--chat-border);
      align-self: flex-start;
    }
    .bubble.user {
      background: color-mix(in srgb, var(--vscode-button-background) 26%, var(--chat-panel));
      border: 1px solid color-mix(in srgb, var(--vscode-button-background) 45%, transparent);
      align-self: flex-end;
    }
    .composer {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }
    .skills {
      margin-top: 2px;
    }
    .config-toggle-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .config-panel {
      border-radius: 14px;
      padding: 10px;
      background: transparent;
      display: grid;
      gap: 8px;
    }
    .config-panel-title {
      font-size: 12px;
      font-weight: 600;
    }
    .config-panel-desc {
      font-size: 11px;
      opacity: 0.76;
      line-height: 1.4;
    }
    .auto-panel {
      border-radius: 14px;
      padding: 10px;
      background: transparent;
      display: grid;
      gap: 6px;
    }
    .auto-panel-title {
      font-size: 12px;
      font-weight: 600;
    }
    .auto-panel-desc {
      font-size: 11px;
      opacity: 0.78;
      line-height: 1.45;
    }
    .version-chip {
      border: 1px solid var(--chat-border);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      opacity: 0.8;
      white-space: nowrap;
    }
    .quick-btn {
      border: 1px solid var(--chat-border);
      border-radius: 10px;
      padding: 8px 12px;
      background: color-mix(in srgb, var(--vscode-button-background) 16%, var(--chat-panel));
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 11px;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vscode-button-background) 16%, transparent);
    }
    .quick-btn:hover {
      border-color: var(--vscode-button-background);
    }
    textarea {
      width: 100%;
      min-height: 72px;
      resize: vertical;
      border-radius: 12px;
      border: 1px solid var(--chat-border);
      padding: 10px;
      box-sizing: border-box;
      color: var(--vscode-input-foreground);
      background: var(--vscode-input-background);
      font-family: var(--vscode-font-family);
      font-size: 12px;
    }
    .composer-row {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: flex-end;
    }
    .meta {
      font-size: 11px;
      opacity: 0.75;
    }
    .send-btn {
      border: none;
      border-radius: 999px;
      padding: 6px 14px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, #fff);
      cursor: pointer;
    }
    .send-btn:hover {
      background: var(--vscode-button-hoverBackground, #1177bb);
    }
    .confirm-card {
      display: grid;
      gap: 8px;
    }
    .confirm-reason {
      font-size: 11px;
      opacity: 0.82;
      line-height: 1.45;
    }
    .confirm-btn {
      justify-self: start;
      border: 1px solid var(--vscode-button-background, #0e639c);
      border-radius: 999px;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--vscode-button-background, #0e639c) 22%, var(--chat-panel));
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 11px;
    }
    .stamp {
      font-size: 10px;
      opacity: 0.6;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="status-banner" id="skillMeta"></div>
    <div class="thread" id="thread"></div>
    <div class="composer">
      <textarea id="promptInput" placeholder="输入业务诉求，或先选择一个流程环节再发送。"></textarea>
      <div class="composer-row">
        <div class="button-with-help">
          <button id="sendBtn" class="send-btn">发送至 Copilot</button>
          <button id="sendHelpBtn" class="help-btn" title="查看发送帮助">?</button>
        </div>
      </div>
      <div class="skills" id="skills"></div>
    </div>
    <p class="stamp">AI4PB Skill Chat v${versionText}</p>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const flows = ${flowsJson};
    const helpUrls = ${helpUrlsJson};
    const initialState = ${initialStateJson};
    const persistedState = vscode.getState();
    const restoredState = persistedState && typeof persistedState === 'object' ? persistedState : initialState;
    const state = {
      activeMenu: restoredState.activeMenu || (restoredState.expandedConfig ? 'config' : (restoredState.selectedFlow || restoredState.expandedFlow ? 'flow' : 'auto')),
      confirmedMenu: restoredState.confirmedMenu === 'auto' || restoredState.confirmedMenu === 'flow'
        ? restoredState.confirmedMenu
        : 'auto',
      menuOpen: restoredState.menuOpen === true,
      expandedConfig: restoredState.expandedConfig === true,
      expandedFlow: restoredState.expandedFlow || restoredState.selectedFlow || null,
      selectedFlow: restoredState.selectedFlow || null,
      selectedSkill: restoredState.selectedSkill || null,
      draftText: String(restoredState.draftText || ''),
      thread: Array.isArray(restoredState.thread) ? restoredState.thread : []
    };

    const thread = document.getElementById('thread');
    const skillsContainer = document.getElementById('skills');
    const skillMeta = document.getElementById('skillMeta');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const sendHelpBtn = document.getElementById('sendHelpBtn');

    function getStatusIcon(kind) {
      if (kind === 'mode') {
        return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
      }
      if (kind === 'flow') {
        return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 4h10M3 8h7M3 12h10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
      }
      if (kind === 'step') {
        return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      if (kind === 'hint') {
        return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2.1v3.1m0 2.25h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
      return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.4"/></svg>';
    }

    function getPrimaryMenuIcon(menuKey) {
      if (menuKey === 'config') {
        return '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6.4 2.5h3.2l.4 1.5c.3.1.7.3 1 .5l1.4-.6 1.6 1.6-.6 1.4c.2.3.4.7.5 1l1.5.4v3.2l-1.5.4c-.1.3-.3.7-.5 1l.6 1.4-1.6 1.6-1.4-.6c-.3.2-.7.4-1 .5l-.4 1.5H6.4L6 13.9c-.3-.1-.7-.3-1-.5l-1.4.6L2 12.4l.6-1.4c-.2-.3-.4-.7-.5-1L1 9.6V6.4L2.5 6c.1-.3.3-.7.5-1L2.4 3.6 4 2l1.4.6c.3-.2.7-.4 1-.5l.4-1.5Z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/><circle cx="8" cy="8" r="2.1" stroke="currentColor" stroke-width="1.1"/></svg>';
      }
      return '';
    }

    function renderStatusBanner(title, items) {
      const safeItems = Array.isArray(items) ? items : [];
      const chips = safeItems.map((item) => {
        return '<span class="status-chip ' + item.kind + '">' + getStatusIcon(item.kind) + '<span>' + item.text + '</span></span>';
      }).join('');

      skillMeta.innerHTML = '<div class="status-banner-title">'
        + '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M8 2.5 3 5.2v5.6L8 13.5l5-2.7V5.2L8 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M5.5 6.5h5M5.5 8.5h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
        + '<span>' + title + '</span></div>'
        + '<div class="status-banner-items">' + chips + '</div>';
    }

    function openHelp(url) {
      if (!url) {
        return;
      }
      vscode.postMessage({
        type: 'openHelp',
        url
      });
    }

    function createHelpButton(url, title) {
      const btn = document.createElement('button');
      btn.className = 'help-btn';
      btn.textContent = '?';
      btn.title = title || '查看帮助';
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        openHelp(url);
      });
      return btn;
    }

    function appendButtonWithHelp(container, button, url, title) {
      const wrapper = document.createElement('div');
      wrapper.className = 'button-with-help';
      wrapper.appendChild(button);
      if (url) {
        wrapper.appendChild(createHelpButton(url, title));
      }
      container.appendChild(wrapper);
      return wrapper;
    }

    function positionMenuPopup(contextShell, anchor) {
      if (!contextShell || !anchor) {
        return;
      }

      const containerRect = skillsContainer.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const desiredWidth = state.activeMenu === 'flow' ? 420 : 320;
      const containerWidth = Math.max(0, Math.floor(containerRect.width));
      const width = Math.max(Math.min(desiredWidth, containerWidth), Math.min(220, containerWidth));
      let left = anchorRect.left - containerRect.left;
      if (left + width > containerWidth) {
        left = Math.max(0, containerWidth - width);
      }
      if (left < 0) {
        left = 0;
      }

      contextShell.style.width = width + 'px';
      contextShell.style.left = left + 'px';
      contextShell.style.bottom = anchor.offsetHeight + 8 + 'px';
    }

    function findFlow(flowKey) {
      return flows.find((flow) => flow.key === flowKey) || null;
    }

    function findFlowStep(flow, skillKey) {
      if (!flow) {
        return null;
      }
      return flow.steps.find((step) => step.key === skillKey) || null;
    }

    function inferFlowForSkill(skillKey) {
      if (!skillKey) {
        return null;
      }
      return flows.find((flow) => flow.steps.some((step) => step.key === skillKey)) || null;
    }

    function getExpandedFlow() {
      return findFlow(state.expandedFlow) || getCurrentFlow();
    }

    function getCurrentFlow() {
      return findFlow(state.selectedFlow) || inferFlowForSkill(state.selectedSkill);
    }

    function getCurrentStep() {
      const currentFlow = getCurrentFlow();
      return findFlowStep(currentFlow, state.selectedSkill);
    }

    function getFocusedFlow() {
      if (state.activeMenu === 'flow') {
        return getExpandedFlow() || getCurrentFlow();
      }
      return getCurrentFlow();
    }

    function syncState() {
      vscode.setState(state);
      vscode.postMessage({
        type: 'syncState',
        state
      });
    }

    function appendBubble(role, text) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + role;
      bubble.textContent = text;
      thread.appendChild(bubble);
      thread.scrollTop = thread.scrollHeight;

      state.thread.push({
        kind: 'bubble',
        role,
        text: String(text || '')
      });
      syncState();
    }

    function appendAutoSuggestion(message, skipPersist) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble ai';

      const card = document.createElement('div');
      card.className = 'confirm-card';

      const title = document.createElement('div');
      title.textContent = '建议执行以下动作，请选择一个确认发送到 Copilot：';
      card.appendChild(title);

      const suggestions = Array.isArray(message.suggestions) ? message.suggestions : [];
      suggestions.forEach((suggestion, index) => {
        const option = document.createElement('div');
        option.className = 'confirm-card';

        const optionTitle = document.createElement('div');
        optionTitle.textContent = String(index + 1) + '. ' + suggestion.skillLabel + ' (' + suggestion.promptRef + ')';
        option.appendChild(optionTitle);

        const reason = document.createElement('div');
        reason.className = 'confirm-reason';
        reason.textContent = '分析依据: ' + (suggestion.reason || '已根据输入内容完成自动分析。');
        option.appendChild(reason);

        const btn = document.createElement('button');
        btn.className = 'confirm-btn';
        btn.textContent = '确认执行';
        btn.addEventListener('click', () => {
          vscode.postMessage({
            type: 'autoConfirm',
            text: message.text,
            skill: suggestion.skill
          });
          btn.disabled = true;
          btn.textContent = '已确认，正在发送...';
        });
        option.appendChild(btn);

        card.appendChild(option);
      });

      bubble.appendChild(card);
      thread.appendChild(bubble);
      thread.scrollTop = thread.scrollHeight;

      if (!skipPersist) {
        state.thread.push({
          kind: 'autoSuggestion',
          text: String(message.text || ''),
          suggestions: suggestions.map((suggestion) => ({
            skill: suggestion.skill,
            skillLabel: suggestion.skillLabel,
            promptRef: suggestion.promptRef,
            reason: suggestion.reason || ''
          }))
        });
        syncState();
      }
    }

    function updateSkillMeta() {
      if (state.confirmedMenu === 'auto') {
        renderStatusBanner('当前工作状态', [
          { kind: 'mode', text: '智能路由' },
          { kind: 'hint', text: '系统将根据输入自动匹配最合适环节' }
        ]);
        return;
      }

      const currentFlow = getCurrentFlow();
      const currentStep = getCurrentStep();
      if (state.confirmedMenu === 'flow' && currentFlow && currentStep) {
        renderStatusBanner('当前工作状态', [
          { kind: 'mode', text: '已确认流程' },
          { kind: 'flow', text: currentFlow.label },
          { kind: 'step', text: currentStep.label }
        ]);
        return;
      }

      renderStatusBanner('当前工作状态', [
        { kind: 'mode', text: '待确认选择' },
        { kind: 'hint', text: '请先完成子菜单选择，顶部状态再同步更新' }
      ]);
    }

    function togglePrimaryMenu(menuKey) {
      const isSameMenu = state.activeMenu === menuKey;
      state.activeMenu = menuKey;
      state.menuOpen = isSameMenu ? !state.menuOpen : true;

      if (menuKey === 'auto') {
        state.confirmedMenu = 'auto';
        state.expandedConfig = false;
        state.expandedFlow = null;
      } else if (menuKey === 'flow') {
        state.expandedConfig = false;
        if (!state.expandedFlow) {
          state.expandedFlow = state.selectedFlow || 'delivery';
        }
      } else if (menuKey === 'config') {
        state.expandedConfig = true;
      }

      renderSkills();
      updateSkillMeta();
      syncState();
    }

    function renderSkills() {
      skillsContainer.innerHTML = '';
      const isMenuOpen = state.menuOpen === true;
      let autoAnchor = null;
      let flowAnchor = null;
      let configAnchor = null;

      const primaryRow = document.createElement('div');
      primaryRow.className = 'primary-menu-row';
      primaryRow.addEventListener('click', (event) => {
        event.stopPropagation();
      });

      const autoBtn = document.createElement('button');
      autoBtn.className = 'primary-menu-btn' + (state.activeMenu === 'auto' ? (isMenuOpen ? ' active' : ' current') : '');
      autoBtn.textContent = '智能路由';
      autoBtn.addEventListener('click', () => {
        togglePrimaryMenu('auto');
      });
      autoAnchor = appendButtonWithHelp(primaryRow, autoBtn, helpUrls.menu.auto, '查看智能路由帮助');

      const flowMenuBtn = document.createElement('button');
      flowMenuBtn.className = 'primary-menu-btn' + (state.activeMenu === 'flow' ? (isMenuOpen ? ' active' : ' current') : '');
      flowMenuBtn.textContent = '流程导航';
      flowMenuBtn.addEventListener('click', () => {
        togglePrimaryMenu('flow');
      });
      flowAnchor = appendButtonWithHelp(primaryRow, flowMenuBtn, helpUrls.menu.flow, '查看流程导航帮助');

      const configMenuBtn = document.createElement('button');
      configMenuBtn.className = 'primary-menu-btn' + (state.activeMenu === 'config' ? (isMenuOpen ? ' active' : ' current') : '');
      configMenuBtn.innerHTML = getPrimaryMenuIcon('config') + '<span>配置中心</span>';
      configMenuBtn.addEventListener('click', () => {
        togglePrimaryMenu('config');
      });
      configAnchor = appendButtonWithHelp(primaryRow, configMenuBtn, helpUrls.menu.config, '查看配置中心帮助');

      const contextShell = document.createElement('div');
      contextShell.className = 'menu-context-shell' + (isMenuOpen ? '' : ' hidden');
      contextShell.addEventListener('click', (event) => {
        event.stopPropagation();
      });
      skillsContainer.appendChild(contextShell);
      skillsContainer.appendChild(primaryRow);

      if (!isMenuOpen) {
        return;
      }

      const activeAnchor = state.activeMenu === 'flow'
        ? flowAnchor
        : state.activeMenu === 'config'
          ? configAnchor
          : autoAnchor;

      positionMenuPopup(contextShell, activeAnchor);

      if (state.activeMenu === 'auto') {
        const panel = document.createElement('div');
        panel.className = 'auto-panel';

        const title = document.createElement('div');
        title.className = 'auto-panel-title';
        title.textContent = '智能路由';
        panel.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'auto-panel-desc';
        desc.textContent = '根据你的输入自动匹配最合适的 SCRUM 环节。若你已经明确知道当前所处流程，可切换到“流程导航”直接选择具体环节。';
        panel.appendChild(desc);

        contextShell.appendChild(panel);
        return;
      }

      if (state.activeMenu === 'config') {
        const panel = document.createElement('div');
        panel.className = 'config-panel';

        const title = document.createElement('div');
        title.className = 'config-panel-title';
        title.textContent = '环境配置';
        panel.appendChild(title);

        const desc = document.createElement('div');
        desc.className = 'config-panel-desc';
        desc.textContent = '集中处理 EA 模板初始化与导出参数配置。';
        panel.appendChild(desc);

        const actions = document.createElement('div');
        actions.className = 'config-toggle-row';

        const initBtn = document.createElement('button');
        initBtn.className = 'quick-btn';
        initBtn.textContent = 'EA模板初始化';
        initBtn.addEventListener('click', () => {
          state.menuOpen = false;
          appendBubble('user', '[执行 EA 模板初始化]');
          vscode.postMessage({ type: 'statusAction', key: 'init' });
          renderSkills();
          syncState();
        });
        appendButtonWithHelp(actions, initBtn, helpUrls.config.init, '查看 EA 模板初始化帮助');

        const configBtn = document.createElement('button');
        configBtn.className = 'quick-btn';
        configBtn.textContent = 'EA导出参数配置';
        configBtn.addEventListener('click', () => {
          state.menuOpen = false;
          appendBubble('user', '[打开 EA 导出参数配置]');
          vscode.postMessage({ type: 'statusAction', key: 'options' });
          renderSkills();
          syncState();
        });
        appendButtonWithHelp(actions, configBtn, helpUrls.config.options, '查看 EA 导出参数配置帮助');

        panel.appendChild(actions);
        contextShell.appendChild(panel);
        return;
      }

      const toggleRow = document.createElement('div');
      toggleRow.className = 'flow-toggle-row';

      flows.forEach((flow) => {
        const toggle = document.createElement('button');
        const isCurrentFlow = state.selectedFlow === flow.key;
        const isExpanded = state.expandedFlow === flow.key || (!state.expandedFlow && isCurrentFlow);
        toggle.className = 'flow-toggle' + (isCurrentFlow ? ' current' : '') + (isExpanded ? ' expanded' : '');
        toggle.textContent = flow.label;
        toggle.addEventListener('click', () => {
          state.activeMenu = 'flow';
          state.expandedConfig = false;
          state.expandedFlow = state.expandedFlow === flow.key ? null : flow.key;
          renderSkills();
          updateSkillMeta();
          syncState();
        });
        appendButtonWithHelp(toggleRow, toggle, helpUrls.flow[flow.key], '查看' + flow.label + '帮助');
      });

      contextShell.appendChild(toggleRow);

      const expandedFlow = getExpandedFlow();
      if (!expandedFlow) {
        return;
      }

      const panel = document.createElement('div');
      panel.className = 'flow-panel' + (state.selectedFlow === expandedFlow.key ? ' current' : '');

      const header = document.createElement('div');
      header.className = 'flow-panel-header';

      const title = document.createElement('div');
      title.className = 'flow-panel-title';
      title.textContent = expandedFlow.label;
      header.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'flow-panel-desc';
      desc.textContent = expandedFlow.description;
      header.appendChild(desc);

      panel.appendChild(header);

      const row = document.createElement('div');
      row.className = 'flow-step-row';

      expandedFlow.steps.forEach((step, index) => {
        const button = document.createElement('button');
        const isActive = state.selectedFlow === expandedFlow.key && state.selectedSkill === step.key;
        button.className = 'skill-chip flow-step' + (isActive ? ' active' : '');
        button.textContent = String(index + 1) + '. ' + step.label;
        button.addEventListener('click', () => {
          state.activeMenu = 'flow';
          state.confirmedMenu = 'flow';
          state.menuOpen = false;
          state.expandedFlow = expandedFlow.key;
          state.selectedFlow = expandedFlow.key;
          state.selectedSkill = step.key;
          renderSkills();
          updateSkillMeta();
          syncState();
        });
        appendButtonWithHelp(row, button, helpUrls.step[step.key], '查看' + step.label + '帮助');
      });

      panel.appendChild(row);
      contextShell.appendChild(panel);
    }

    function sendRequest() {
      const effectiveSkill = state.activeMenu === 'flow' ? state.selectedSkill : null;
      const text = String(promptInput.value || '').trim();
      if (!text && !effectiveSkill) {
        appendBubble('ai', '请输入业务诉求，或先选择一个流程环节。');
        return;
      }

      appendBubble('user', text || '[使用所选流程环节直接开始]');

      if (effectiveSkill) {
        const currentFlow = getCurrentFlow();
        const currentStep = getCurrentStep();
        const flowText = currentFlow ? currentFlow.label : '未命名流程';
        const stepText = currentStep ? currentStep.label : effectiveSkill;
        appendBubble('ai', '已提交到 Copilot，当前流程: ' + flowText + '，当前环节: ' + stepText + '。');
      } else {
        appendBubble('ai', '智能路由分析中，请稍候...');
      }

      vscode.postMessage({
        type: 'chatRequest',
        text,
        skill: effectiveSkill
      });

      promptInput.value = '';
      state.draftText = '';
      syncState();
    }

    window.addEventListener('message', (event) => {
      const message = event.data || {};
      if (message.type === 'autoSuggestion') {
        appendAutoSuggestion(message);
        return;
      }
      if (message.type === 'autoDispatchDone') {
        appendBubble('ai', '已确认并发送到 Copilot，执行技能: ' + message.skillLabel + '。');
        return;
      }
      if (message.type === 'autoAnalysisError') {
        appendBubble('ai', message.message || '智能路由分析失败，请重试或手动选择流程环节。');
      }
    });

    sendBtn.addEventListener('click', sendRequest);
    sendHelpBtn.addEventListener('click', () => {
      openHelp(helpUrls.menu.send);
    });
    promptInput.addEventListener('input', () => {
      state.draftText = String(promptInput.value || '');
      syncState();
    });

    promptInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendRequest();
      }
    });

    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!state.menuOpen) {
        return;
      }

      if (skillsContainer.contains(target)) {
        return;
      }

      state.menuOpen = false;
      renderSkills();
      syncState();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !state.menuOpen) {
        return;
      }

      state.menuOpen = false;
      renderSkills();
      syncState();
    });

    function restoreThread() {
      const items = Array.isArray(state.thread) ? state.thread : [];
      if (items.length === 0) {
        appendBubble('ai', '欢迎使用 AI4PB Skill Chat。可以手动选择 SKILL，或直接输入自然语言由系统自动路由。');
        return;
      }

      items.forEach((item) => {
        if (!item || typeof item !== 'object') {
          return;
        }

        if (item.kind === 'bubble') {
          const bubble = document.createElement('div');
          bubble.className = 'bubble ' + item.role;
          bubble.textContent = String(item.text || '');
          thread.appendChild(bubble);
          return;
        }

        if (item.kind === 'autoSuggestion') {
          appendAutoSuggestion(item, true);
        }
      });

      thread.scrollTop = thread.scrollHeight;
    }

    restoreThread();
    promptInput.value = state.draftText;
    renderSkills();
    updateSkillMeta();
    syncState();
  </script>
</body>
</html>`;
    }
}
WorkflowViewProvider.viewType = 'ai4pb.workflowView';
function sanitizeWorkflowViewState(raw) {
    if (!raw) {
        return {
            activeMenu: DEFAULT_WORKFLOW_VIEW_STATE.activeMenu,
            confirmedMenu: DEFAULT_WORKFLOW_VIEW_STATE.confirmedMenu,
            menuOpen: DEFAULT_WORKFLOW_VIEW_STATE.menuOpen,
            expandedConfig: DEFAULT_WORKFLOW_VIEW_STATE.expandedConfig,
            expandedFlow: DEFAULT_WORKFLOW_VIEW_STATE.expandedFlow,
            selectedFlow: DEFAULT_WORKFLOW_VIEW_STATE.selectedFlow,
            selectedSkill: DEFAULT_WORKFLOW_VIEW_STATE.selectedSkill,
            draftText: DEFAULT_WORKFLOW_VIEW_STATE.draftText,
            thread: DEFAULT_WORKFLOW_VIEW_STATE.thread.map((entry) => ({ ...entry }))
        };
    }
    const activeMenu = raw.activeMenu === 'flow' || raw.activeMenu === 'config' ? raw.activeMenu : 'auto';
    const confirmedMenu = raw.confirmedMenu === 'auto' || raw.confirmedMenu === 'flow'
        ? raw.confirmedMenu
        : 'auto';
    const menuOpen = raw.menuOpen === true;
    const expandedConfig = raw.expandedConfig === true;
    const expandedFlow = WORKFLOW_FLOW_OPTIONS.some((flow) => flow.key === raw.expandedFlow) ? raw.expandedFlow : null;
    const selectedFlow = WORKFLOW_FLOW_OPTIONS.some((flow) => flow.key === raw.selectedFlow) ? raw.selectedFlow : null;
    const selectedSkill = normalizeSkillKey(raw.selectedSkill ?? undefined) ?? null;
    const draftText = typeof raw.draftText === 'string' ? raw.draftText : '';
    const rawThread = Array.isArray(raw.thread) ? raw.thread : [];
    const thread = [];
    for (const item of rawThread) {
        if (!item || typeof item !== 'object') {
            continue;
        }
        if (item.kind === 'bubble') {
            thread.push({
                kind: 'bubble',
                role: item.role === 'user' ? 'user' : 'ai',
                text: typeof item.text === 'string' ? item.text : ''
            });
            continue;
        }
        if (item.kind === 'autoSuggestion') {
            const suggestions = Array.isArray(item.suggestions)
                ? item.suggestions
                    .map((suggestion) => {
                    const skill = normalizeSkillKey(typeof suggestion?.skill === 'string' ? suggestion.skill : undefined);
                    if (!skill) {
                        return undefined;
                    }
                    return {
                        skill,
                        skillLabel: typeof suggestion.skillLabel === 'string' ? suggestion.skillLabel : SKILL_DISPLAY_LABEL[skill],
                        promptRef: typeof suggestion.promptRef === 'string' ? suggestion.promptRef : SKILL_PROMPT_REFERENCE[skill],
                        reason: typeof suggestion.reason === 'string' ? suggestion.reason : ''
                    };
                })
                    .filter((suggestion) => Boolean(suggestion))
                : [];
            thread.push({
                kind: 'autoSuggestion',
                text: typeof item.text === 'string' ? item.text : '',
                suggestions
            });
        }
    }
    return {
        activeMenu,
        confirmedMenu,
        menuOpen,
        expandedConfig,
        expandedFlow,
        selectedFlow,
        selectedSkill,
        draftText,
        thread: thread.length > 0 ? thread : DEFAULT_WORKFLOW_VIEW_STATE.thread.map((entry) => ({ ...entry }))
    };
}
// @ArchitectureID: 1209
function normalizeSkillKey(value) {
    const normalized = (value ?? '').trim().toLowerCase();
    switch (normalized) {
        case 'init':
            return 'init';
        case 'audit':
            return 'audit';
        case 'wrapup':
        case 'wrap-up':
            return 'wrapup';
        case 'iteration-summary':
        case 'git commit':
        case 'git提交':
        case 'git 提交':
            return 'iteration-summary';
        case 'task-list':
        case 'task list':
            return 'task-list';
        case 'task-support':
        case 'task support':
            return 'task-support';
        case 'weekly-report':
        case 'weekly report':
            return 'weekly-report';
        case 'iteration-issues':
        case 'iteration issues':
            return 'iteration-issues';
        default:
            return undefined;
    }
}
// @ArchitectureID: 1209
function inferSkillFromText(input) {
    const text = input.toLowerCase();
    if (/task\s*list|任务列表|待办清单|task-list/.test(text)) {
        return 'task-list';
    }
    if (/task\s*support|任务支持|执行步骤|task-support/.test(text)) {
        return 'task-support';
    }
    if (/weekly\s*report|周报|weekly-report/.test(text)) {
        return 'weekly-report';
    }
    if (/issue|问题|缺陷|风险|阻塞|iteration/.test(text)) {
        return 'iteration-issues';
    }
    if (/audit|对齐|审计|差异|reverse/.test(text)) {
        return 'audit';
    }
    if (/wrap|收尾|总结|复盘/.test(text)) {
        return 'wrapup';
    }
    if (/git\s*commit|提交信息|提交消息|提交/.test(text)) {
        return 'iteration-summary';
    }
    return 'init';
}
// @ArchitectureID: 1209
async function analyzeAutoSkillSuggestions(userText) {
    const fallback = buildFallbackAutoSkillSuggestions(userText);
    try {
        const copilotModels = await vscode.lm.selectChatModels({ vendor: 'copilot' });
        const genericModels = copilotModels.length > 0 ? copilotModels : await vscode.lm.selectChatModels();
        const model = genericModels[0];
        if (!model) {
            return fallback;
        }
        const instruction = [
            '你是 AI4PB workflow router。',
            '根据用户输入，在以下技能中选出最匹配的 3 个 key，并按优先级排序：',
            'init, audit, wrapup, iteration-summary, task-list, task-support, weekly-report, iteration-issues。',
            '只返回 JSON 数组，格式: [{"skill":"<key>","reason":"<中文一句话理由>"}]。',
            '如果不足 3 个，也至少返回 1 个。不要输出 markdown。',
            `用户输入: ${userText}`
        ].join('\n');
        const response = await model.sendRequest([
            vscode.LanguageModelChatMessage.User(instruction)
        ]);
        let responseText = '';
        for await (const part of response.text) {
            responseText += part;
        }
        const parsed = parseAutoSuggestionJson(responseText);
        if (!parsed || parsed.length === 0) {
            return fallback;
        }
        const normalized = parsed
            .map((item) => {
            const skill = normalizeSkillKey(item.skill);
            if (!skill) {
                return undefined;
            }
            return {
                skill,
                reason: item.reason || '已基于输入语义匹配到候选流程。'
            };
        })
            .filter((item) => Boolean(item));
        return normalized.length > 0 ? dedupeAutoSkillSuggestions(normalized) : fallback;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.appendLine(`[AI4PB] AUTO intent analysis failed: ${message}`);
        return fallback;
    }
}
// @ArchitectureID: 1209
function parseAutoSuggestionJson(raw) {
    const text = raw.trim();
    if (!text) {
        return undefined;
    }
    const direct = safeParseJson(text);
    if (direct) {
        return direct;
    }
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket >= 0 && lastBracket > firstBracket) {
        return safeParseJson(text.slice(firstBracket, lastBracket + 1));
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace < 0 || lastBrace <= firstBrace) {
        return undefined;
    }
    return safeParseJson(text.slice(firstBrace, lastBrace + 1));
}
// @ArchitectureID: 1209
function safeParseJson(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter((item) => item && typeof item === 'object');
        }
        if (!parsed || typeof parsed !== 'object') {
            return undefined;
        }
        return [parsed];
    }
    catch {
        return undefined;
    }
}
// @ArchitectureID: 1209
function buildFallbackAutoSkillSuggestions(userText) {
    const rankedSkills = rankSkillsFromText(userText);
    return rankedSkills.slice(0, 3).map((skill, index) => ({
        skill,
        reason: index === 0 ? '模型不可用，已使用内置规则推断最优流程。' : '模型不可用，已提供备选流程供人工确认。'
    }));
}
// @ArchitectureID: 1209
function rankSkillsFromText(input) {
    const text = input.toLowerCase();
    const scores = new Map([
        ['init', 0],
        ['audit', 0],
        ['wrapup', 0],
        ['iteration-summary', 0],
        ['task-list', 0],
        ['task-support', 0],
        ['weekly-report', 0],
        ['iteration-issues', 0]
    ]);
    const addScore = (skill, value) => {
        scores.set(skill, (scores.get(skill) ?? 0) + value);
    };
    if (/task\s*list|任务列表|待办清单|task-list/.test(text)) {
        addScore('task-list', 5);
    }
    if (/task\s*support|任务支持|执行步骤|task-support|怎么做|如何实现/.test(text)) {
        addScore('task-support', 5);
    }
    if (/weekly\s*report|周报|weekly-report|汇报/.test(text)) {
        addScore('weekly-report', 5);
    }
    if (/issue|问题|缺陷|风险|阻塞|iteration|修复|bug/.test(text)) {
        addScore('iteration-issues', 5);
    }
    if (/audit|对齐|审计|差异|reverse|实现了哪些|业务代码/.test(text)) {
        addScore('audit', 5);
    }
    if (/wrap|收尾|总结|复盘/.test(text)) {
        addScore('wrapup', 5);
    }
    if (/git\s*commit|提交信息|提交消息|提交/.test(text)) {
        addScore('iteration-summary', 5);
    }
    if (/开始|启动|init|初始化|kickoff/.test(text)) {
        addScore('init', 4);
    }
    addScore(inferSkillFromText(input), 2);
    return Array.from(scores.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([skill]) => skill);
}
// @ArchitectureID: 1209
function dedupeAutoSkillSuggestions(suggestions) {
    const seen = new Set();
    const deduped = [];
    for (const suggestion of suggestions) {
        if (seen.has(suggestion.skill)) {
            continue;
        }
        seen.add(suggestion.skill);
        deduped.push(suggestion);
        if (deduped.length >= 3) {
            break;
        }
    }
    return deduped;
}
// @ArchitectureID: 1209
function buildSkillSeedText(skill, userText) {
    const promptRef = SKILL_PROMPT_REFERENCE[skill];
    const userDirective = userText.trim();
    const lines = [
        `请使用 ${promptRef}。`,
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。'
    ];
    if (userDirective.length > 0) {
        lines.push(`补充上下文：${userDirective}`);
    }
    lines.push('请现在开始。');
    return lines.join('\n');
}
function getWorkspaceRoot() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        throw new Error('No workspace folder opened.');
    }
    return folders[0].uri.fsPath;
}
function resolvePath(root, relativePath) {
    return path.join(root, ...relativePath.split('/'));
}
function resolveExtensionPath(relativePath) {
    if (!extensionInstallRoot) {
        throw new Error('Extension root not initialized.');
    }
    return path.join(extensionInstallRoot, ...relativePath.split('/'));
}
function getBundledPromptPaths() {
    return [
        resolveExtensionPath(BUNDLED_PATHS.initialPrompt),
        resolveExtensionPath(BUNDLED_PATHS.wrapPrompt),
        resolveExtensionPath(BUNDLED_PATHS.reversePrompt)
    ];
}
// @ArchitectureID: 1209
function getEffectiveGuidedOptions(config) {
    const existingAutoGen = config?.EA_AUTOGEN_CONFIG;
    const configuredScope = existingAutoGen?.needallmaintenace;
    const normalizedScope = configuredScope === true
        ? 'All'
        : configuredScope === false
            ? 'onlyActive'
            : configuredScope === 'ActiveAndVerified' || configuredScope === 'All' || configuredScope === 'onlyActive'
                ? configuredScope
                : GUIDED_DEFAULTS.needallmaintenace;
    return {
        needallmaintenace: normalizedScope,
        needbrowserlocation: typeof existingAutoGen?.needbrowserlocation === 'boolean'
            ? existingAutoGen.needbrowserlocation
            : GUIDED_DEFAULTS.needbrowserlocation,
        maintenacetype: typeof existingAutoGen?.maintenacetype === 'string' && existingAutoGen.maintenacetype.trim().length > 0
            ? existingAutoGen.maintenacetype
            : GUIDED_DEFAULTS.maintenacetype
    };
}
// @ArchitectureID: 1209
function buildGuidedAiConfig(existing, overrides) {
    const existingAutoGen = existing?.EA_AUTOGEN_CONFIG;
    const effectiveOptions = getEffectiveGuidedOptions(existing);
    if (overrides?.needallmaintenace === 'onlyActive'
        || overrides?.needallmaintenace === 'ActiveAndVerified'
        || overrides?.needallmaintenace === 'All') {
        effectiveOptions.needallmaintenace = overrides.needallmaintenace;
    }
    if (typeof overrides?.needbrowserlocation === 'boolean') {
        effectiveOptions.needbrowserlocation = overrides.needbrowserlocation;
    }
    if (typeof overrides?.maintenacetype === 'string' && overrides.maintenacetype.trim().length > 0) {
        effectiveOptions.maintenacetype = overrides.maintenacetype;
    }
    return {
        EA_AUTOGEN_CONFIG: {
            needallmaintenace: effectiveOptions.needallmaintenace,
            needbrowserlocation: effectiveOptions.needbrowserlocation,
            maintenacetype: effectiveOptions.maintenacetype,
            ...(existingAutoGen?.architectureJsonPath ? { architectureJsonPath: existingAutoGen.architectureJsonPath } : {})
        }
    };
}
function ensureGuidedAiConfig(root, overrides) {
    const configPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
    let existing;
    if (exists(configPath)) {
        try {
            existing = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        catch {
            existing = undefined;
        }
    }
    const normalized = buildGuidedAiConfig(existing, overrides);
    fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf-8');
    return normalized;
}
// @ArchitectureID: 1209
async function configureGuidedOptions(root) {
    const current = getEffectiveGuidedOptions(loadAiConfig(root));
    const modePick = await vscode.window.showQuickPick([
        { label: 'forllm', description: 'AI-first maintenance mode', value: 'forllm' },
        { label: 'forproject', description: 'Project-driven maintenance mode', value: 'forproject' }
    ], {
        title: 'AI4PB: Select maintenance type',
        placeHolder: `Current: ${current.maintenacetype}`,
        ignoreFocusOut: true
    });
    if (!modePick) {
        return;
    }
    const browserPathPick = await vscode.window.showQuickPick([
        { label: 'On', description: 'Include browser path in exports', value: true },
        { label: 'Off', description: 'Do not include browser path', value: false }
    ], {
        title: 'AI4PB: Include browser path',
        placeHolder: `Current: ${current.needbrowserlocation ? 'On' : 'Off'}`,
        ignoreFocusOut: true
    });
    if (!browserPathPick) {
        return;
    }
    const allMaintenancePick = await vscode.window.showQuickPick([
        { label: 'onlyActive', description: 'Only include Active tasks', value: 'onlyActive' },
        { label: 'ActiveAndVerified', description: 'Include Active and Verified tasks', value: 'ActiveAndVerified' },
        { label: 'All', description: 'Include tasks in all statuses', value: 'All' }
    ], {
        title: 'AI4PB: Select maintenance scope',
        placeHolder: `Current: ${current.needallmaintenace}`,
        ignoreFocusOut: true
    });
    if (!allMaintenancePick) {
        return;
    }
    ensureGuidedAiConfig(root, {
        maintenacetype: modePick.value,
        needbrowserlocation: browserPathPick.value,
        needallmaintenace: allMaintenancePick.value
    });
    void vscode.window.showInformationMessage('AI4PB options updated. Configuration is maintained in background.');
}
function exists(filePath) {
    return fs.existsSync(filePath);
}
// @ArchitectureID: 1220
function ensureWorkspaceSkillsInstalled() {
    try {
        const root = getWorkspaceRoot();
        const bundledSkillsRoot = resolveExtensionPath(BUNDLED_PATHS.skillsRoot);
        if (!exists(bundledSkillsRoot)) {
            output.appendLine(`[AI4PB] Bundled skills not found: ${bundledSkillsRoot}`);
            return;
        }
        const workspaceSkillsRoot = resolvePath(root, BUNDLED_PATHS.skillsRoot);
        copyFilesRecursivelyOverwrite(bundledSkillsRoot, workspaceSkillsRoot);
        output.appendLine(`[AI4PB] Skills synchronized to workspace: ${workspaceSkillsRoot}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.appendLine(`[AI4PB] Skills auto-install skipped: ${message}`);
    }
}
// @ArchitectureID: 1220
function copyFilesRecursivelyOverwrite(sourceDir, targetDir) {
    fs.mkdirSync(targetDir, { recursive: true });
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path.join(sourceDir, entry.name);
        const targetPath = path.join(targetDir, entry.name);
        if (entry.isDirectory()) {
            copyFilesRecursivelyOverwrite(sourcePath, targetPath);
            continue;
        }
        if (entry.isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}
function fileMtime(filePath) {
    if (!exists(filePath)) {
        return undefined;
    }
    return fs.statSync(filePath).mtime;
}
function clearDirectoryContents(dirPath) {
    if (!exists(dirPath)) {
        return 0;
    }
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        fs.rmSync(entryPath, { recursive: true, force: true });
    }
    return entries.length;
}
function toIsoLocal(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').substring(0, 19);
}
function loadAiConfig(root) {
    const configPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
    if (!exists(configPath)) {
        return undefined;
    }
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
}
function getArchitectureJsonPath(root) {
    const config = loadAiConfig(root);
    const fromConfig = config?.EA_AUTOGEN_CONFIG?.architectureJsonPath;
    if (fromConfig && fromConfig.trim().length > 0) {
        return path.isAbsolute(fromConfig) ? fromConfig : resolvePath(root, fromConfig);
    }
    return resolvePath(root, RELATIVE_PATHS.architectureJson);
}
async function openFileIfExists(filePath) {
    if (!exists(filePath)) {
        return;
    }
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, { preview: false });
}
async function refreshArchitectureContext() {
    try {
        const root = getWorkspaceRoot();
        ensureGuidedAiConfig(root);
        const archPath = getArchitectureJsonPath(root);
        const checks = [
            { label: 'Architecture JSON', filePath: archPath },
            { label: 'Managed Options Config', filePath: resolvePath(root, RELATIVE_PATHS.aiConfig) },
            { label: 'Initial Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.initialPrompt) },
            { label: 'Wrap-up Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.wrapPrompt) },
            { label: 'Reverse Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.reversePrompt) }
        ];
        output.clear();
        output.appendLine('[AI4PB] Refresh Architecture Context');
        output.appendLine(`Workspace: ${root}`);
        const missing = [];
        for (const check of checks) {
            const ok = exists(check.filePath);
            const mtime = ok ? fileMtime(check.filePath) : undefined;
            output.appendLine(`${ok ? 'OK  ' : 'MISS'} ${check.label}: ${check.filePath}${mtime ? ` (updated ${toIsoLocal(mtime)})` : ''}`);
            if (!ok) {
                missing.push(check.label);
            }
        }
        output.show(true);
        if (missing.length === 0) {
            void vscode.window.showInformationMessage('AI4PB context refreshed: all required artifacts are present.');
        }
        else {
            void vscode.window.showWarningMessage(`AI4PB context refreshed with missing items: ${missing.join(', ')}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB refresh failed: ${message}`);
    }
}
async function initializeFromTemplate() {
    try {
        const root = getWorkspaceRoot();
        const templatePath = resolveExtensionPath(BUNDLED_PATHS.eaTemplate);
        if (!exists(templatePath)) {
            void vscode.window.showErrorMessage(`Bundled EA template not found: ${templatePath}`);
            return;
        }
        const workspaceName = path.basename(root);
        const targetFileName = workspaceName && workspaceName.trim().length > 0 ? `${workspaceName}.feap` : 'EA-model-template.feap';
        const targetPath = path.join(root, targetFileName);
        if (exists(targetPath)) {
            const choice = await vscode.window.showWarningMessage(`Target file already exists: ${targetFileName}`, { modal: true }, 'Overwrite', 'Open Existing');
            if (choice === 'Open Existing') {
                await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(targetPath));
                return;
            }
            if (choice !== 'Overwrite') {
                return;
            }
        }
        fs.copyFileSync(templatePath, targetPath);
        output.appendLine(`[AI4PB] EA template initialized: ${targetPath}`);
        output.show(true);
        const openChoice = await vscode.window.showInformationMessage(`EA template created: ${targetFileName}`, 'Reveal in Explorer');
        if (openChoice === 'Reveal in Explorer') {
            await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(targetPath));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB initialize failed: ${message}`);
    }
}
async function startIterationFromModel() {
    try {
        const root = getWorkspaceRoot();
        const archPath = getArchitectureJsonPath(root);
        const designTasksDir = resolvePath(root, RELATIVE_PATHS.designTasksDir);
        const initialPromptPath = resolveExtensionPath(BUNDLED_PATHS.initialPrompt);
        if (!exists(archPath)) {
            void vscode.window.showErrorMessage(`Architecture JSON not found: ${archPath}`);
            return;
        }
        fs.mkdirSync(designTasksDir, { recursive: true });
        const clearedItems = clearDirectoryContents(designTasksDir);
        output.appendLine(`[AI4PB] Iteration init cleanup: cleared ${clearedItems} item(s) under ${designTasksDir}`);
        await openFileIfExists(archPath);
        await openFileIfExists(initialPromptPath);
        const stateDir = resolvePath(root, 'TEMP');
        fs.mkdirSync(stateDir, { recursive: true });
        const statePath = path.join(stateDir, 'iteration-state.json');
        const state = {
            startedAt: new Date().toISOString(),
            architectureJson: archPath,
            architectureJsonMtime: fileMtime(archPath)?.toISOString() ?? null
        };
        fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
        output.appendLine(`[AI4PB] Iteration started. State saved to: ${statePath}`);
        output.show(true);
        void vscode.window.showInformationMessage('AI4PB iteration initialized from current architecture model.');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB start iteration failed: ${message}`);
    }
}
async function runDesignCodeAlignment() {
    try {
        const root = getWorkspaceRoot();
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const reportDir = resolvePath(root, 'TEMP');
        fs.mkdirSync(reportDir, { recursive: true });
        const archPath = getArchitectureJsonPath(root);
        const initPrompt = resolveExtensionPath(BUNDLED_PATHS.initialPrompt);
        const wrapPrompt = resolveExtensionPath(BUNDLED_PATHS.wrapPrompt);
        const reversePrompt = resolveExtensionPath(BUNDLED_PATHS.reversePrompt);
        const reportPath = path.join(reportDir, `design-code-alignment-${stamp}.md`);
        const lines = [
            '# Design-Code Alignment Report',
            '',
            `- Generated At: ${toIsoLocal(now)}`,
            `- Workspace: ${root}`,
            '',
            '## Artifact Checks',
            '',
            `- Architecture JSON: ${exists(archPath) ? 'OK' : 'MISSING'} (${archPath})`,
            `- Managed Options Config: ${exists(resolvePath(root, RELATIVE_PATHS.aiConfig)) ? 'OK' : 'MISSING'}`,
            `- Initial Prompt: ${exists(initPrompt) ? 'OK' : 'MISSING'}`,
            `- Wrap-up Prompt: ${exists(wrapPrompt) ? 'OK' : 'MISSING'}`,
            `- Reverse Prompt: ${exists(reversePrompt) ? 'OK' : 'MISSING'}`,
            '',
            '## Suggested Review Checklist',
            '',
            '- [ ] Confirm architecture JSON reflects latest EA export',
            '- [ ] Confirm generated/changed code maps to active tasks in model',
            '- [ ] Confirm unresolved issues are fed back into model tasks',
            '- [ ] Run wrap-up and reverse-engineer prompts before closing iteration',
            ''
        ];
        fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
        await openFileIfExists(reportPath);
        output.appendLine(`[AI4PB] Alignment report generated: ${reportPath}`);
        output.show(true);
        void vscode.window.showInformationMessage('AI4PB design-code alignment report generated.');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB alignment failed: ${message}`);
    }
}
async function generateWrapUpReport() {
    try {
        const root = getWorkspaceRoot();
        const now = new Date();
        const stamp = now.toISOString().replace(/[:.]/g, '-');
        const reportDir = resolvePath(root, 'TEMP');
        fs.mkdirSync(reportDir, { recursive: true });
        const reportPath = path.join(reportDir, `wrap-up-${stamp}.md`);
        const content = [
            '# Iteration Wrap-up',
            '',
            `- Generated At: ${toIsoLocal(now)}`,
            `- Architecture JSON: ${getArchitectureJsonPath(root)}`,
            '',
            '## Completed Tasks',
            '',
            '- ',
            '',
            '## Open Issues',
            '',
            '- ',
            '',
            '## Design-Code Gaps',
            '',
            '- ',
            '',
            '## Next Iteration Actions',
            '',
            '- '
        ].join('\n');
        fs.writeFileSync(reportPath, content, 'utf-8');
        await openFileIfExists(resolveExtensionPath(BUNDLED_PATHS.wrapPrompt));
        await openFileIfExists(reportPath);
        output.appendLine(`[AI4PB] Wrap-up report created: ${reportPath}`);
        output.show(true);
        void vscode.window.showInformationMessage('AI4PB wrap-up report template generated.');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB wrap-up generation failed: ${message}`);
    }
}
async function openNextAction() {
    try {
        const root = getWorkspaceRoot();
        const archPath = getArchitectureJsonPath(root);
        if (!exists(archPath)) {
            await vscode.commands.executeCommand('ai4pb.refreshArchitectureContext');
            void vscode.window.showWarningMessage('Architecture JSON missing. Run EA export and refresh context first.');
            return;
        }
        const ageHours = (Date.now() - (fileMtime(archPath)?.getTime() ?? Date.now())) / (1000 * 60 * 60);
        if (ageHours > 24) {
            await vscode.commands.executeCommand('ai4pb.refreshArchitectureContext');
            void vscode.window.showInformationMessage('Architecture JSON appears stale (>24h). Refresh model export first.');
            return;
        }
        await vscode.commands.executeCommand('ai4pb.startIterationFromModel');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        void vscode.window.showErrorMessage(`AI4PB next action failed: ${message}`);
    }
}
function getGuidedPrecheck(root) {
    const errors = [];
    const archPath = getArchitectureJsonPath(root);
    if (!exists(archPath)) {
        errors.push(`Architecture JSON missing: ${archPath}`);
    }
    else {
        const ageHours = (Date.now() - (fileMtime(archPath)?.getTime() ?? Date.now())) / (1000 * 60 * 60);
        if (ageHours > 24) {
            errors.push(`Architecture JSON stale: ${Math.floor(ageHours)}h old`);
        }
    }
    const requiredPrompts = getBundledPromptPaths();
    for (const promptPath of requiredPrompts) {
        if (!exists(promptPath)) {
            errors.push(`Missing prompt file: ${promptPath}`);
        }
    }
    return {
        ok: errors.length === 0,
        errors
    };
}
async function runGuidedWorkflow() {
    try {
        const root = getWorkspaceRoot();
        output.clear();
        output.appendLine('[AI4PB] Guided workflow started');
        output.appendLine(`Workspace: ${root}`);
        output.appendLine('[AI4PB] Step 1/5: Refresh context');
        await refreshArchitectureContext();
        output.appendLine('[AI4PB] Step 2/5: Precheck');
        const precheck = getGuidedPrecheck(root);
        if (!precheck.ok) {
            for (const err of precheck.errors) {
                output.appendLine(`ERROR: ${err}`);
            }
            output.show(true);
            void vscode.window.showErrorMessage('AI4PB guided workflow stopped: precheck failed. See output for details.');
            return;
        }
        output.appendLine('[AI4PB] Step 3/5: Start iteration from model');
        await startIterationFromModel();
        output.appendLine('[AI4PB] Step 4/5: Run design-code alignment');
        await runDesignCodeAlignment();
        output.appendLine('[AI4PB] Step 5/5: Generate wrap-up report');
        await generateWrapUpReport();
        output.appendLine('[AI4PB] Guided workflow completed');
        output.show(true);
        void vscode.window.showInformationMessage('AI4PB Run All (Guided) completed successfully.');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        output.appendLine(`[AI4PB] Guided workflow failed: ${message}`);
        output.show(true);
        void vscode.window.showErrorMessage(`AI4PB Run All (Guided) failed: ${message}`);
    }
}
// @ArchitectureID: 1187
async function openCopilotWithInitPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-init。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'init prompt workflow');
}
// @ArchitectureID: 1187
async function openCopilotWithDesignAuditPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-audit。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'design audit workflow');
}
// @ArchitectureID: 1187
async function openCopilotWithWrapUpPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-wrapup。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'wrap-up workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithTaskListPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-task-list。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'task list workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithTaskSupportPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-task-support。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'task support workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithWeeklyReportPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-weekly-report。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'weekly report workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithIterationIssuesPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-iteration-issues。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'iteration issues workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithIterationSummaryPrompt() {
    await openCopilotWithPromptReference([
        '请使用 #ai4pb-iteration-summary。',
        '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
        '请现在开始。'
    ].join('\n'), 'iteration summary workflow');
}
// @ArchitectureID: 1209
async function openCopilotWithPromptReference(seedText, label) {
    try {
        await vscode.commands.executeCommand('workbench.action.chat.open', { query: seedText });
        await trySubmitCopilotChat();
        output.appendLine(`[AI4PB] Opened Copilot chat with ${label} reference.`);
        return;
    }
    catch {
        try {
            await vscode.commands.executeCommand('workbench.action.chat.open');
            await vscode.commands.executeCommand('workbench.action.chat.focusInput');
            await vscode.commands.executeCommand('type', { text: seedText });
            await trySubmitCopilotChat();
            output.appendLine(`[AI4PB] Opened Copilot chat and inserted ${label} reference via fallback.`);
            return;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(`AI4PB failed to open Copilot chat: ${message}`);
        }
    }
}
// @ArchitectureID: 1209
async function trySubmitCopilotChat() {
    try {
        await vscode.commands.executeCommand('workbench.action.chat.submit');
    }
    catch {
        // Older VS Code builds may not expose submit command; ignore safely.
    }
}
//# sourceMappingURL=extension.js.map