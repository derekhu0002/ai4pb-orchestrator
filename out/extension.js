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
    iterationIssuesPrompt: 'workprompt/iteration-issues-prompt.md'
};
const TOOL_NAMES = {
    initPrompt: 'ai4pb_get_init_session_prompt',
    wrapPrompt: 'ai4pb_get_wrap_up_prompt',
    auditPrompt: 'ai4pb_get_design_audit_prompt',
    taskListPrompt: 'ai4pb_get_task_list_prompt',
    taskSupportPrompt: 'ai4pb_get_task_support_prompt',
    weeklyReportPrompt: 'ai4pb_get_weekly_report_prompt',
    iterationIssuesPrompt: 'ai4pb_get_iteration_issues_prompt'
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
    init: 'Init Session',
    audit: 'Design Audit',
    wrapup: 'Wrap-up',
    'iteration-summary': 'Git Commit',
    'task-list': 'Task List',
    'task-support': 'Task Support',
    'weekly-report': 'Weekly Report',
    'iteration-issues': 'Iteration Issues'
};
const CHAT_SKILL_OPTIONS = [
    // Flow 1: task list -> init -> issues -> wrap-up -> git commit (iteration-summary)
    { key: 'task-list', label: 'Task List' },
    { key: 'init', label: 'Init' },
    { key: 'iteration-issues', label: 'Issues' },
    { key: 'wrapup', label: 'Wrap-up' },
    { key: 'iteration-summary', label: 'Git 提交' },
    // Flow 2: audit
    { key: 'audit', label: 'Audit' },
    // Flow 3: task list -> weekly report
    { key: 'weekly-report', label: 'Weekly Report' },
    // Supplemental task execution support
    { key: 'task-support', label: 'Task Support' },
];
const GUIDED_DEFAULTS = {
    needallmaintenace: 'onlyActive',
    needbrowserlocation: true,
    maintenacetype: 'forllm'
};
let output;
let extensionInstallRoot = '';
function activate(context) {
    extensionInstallRoot = context.extensionUri.fsPath;
    output = vscode.window.createOutputChannel('AI4PB Orchestrator');
    output.appendLine('AI4PB Orchestrator activated.');
    ensureWorkspaceSkillsInstalled();
    void vscode.window.showInformationMessage(`AI4PB loaded: ${context.extension.id}`);
    const workflowViewProvider = new WorkflowViewProvider(context.extensionUri);
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
        { name: TOOL_NAMES.iterationIssuesPrompt, label: 'Iteration Issues', promptRelativePath: BUNDLED_PATHS.iterationIssuesPrompt }
    ];
    for (const tool of toolDefinitions) {
        context.subscriptions.push(vscode.lm.registerTool(tool.name, new PromptTemplateTool(tool.label, tool.promptRelativePath)));
        output.appendLine(`[AI4PB] Tool registered: ${tool.name}`);
    }
}
// @ArchitectureID: 1213
class WorkflowViewProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView) {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'chatRequest') {
                await this.handleChatRequest(message.text, message.skill);
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
    // @ArchitectureID: 1209
    async handleChatRequest(rawText, rawSkill) {
        const text = (rawText ?? '').trim();
        const selectedSkill = normalizeSkillKey(rawSkill) ?? inferSkillFromText(text);
        const seedText = buildSkillSeedText(selectedSkill, text);
        const label = selectedSkill ? `${SKILL_DISPLAY_LABEL[selectedSkill]} skill` : 'auto skill';
        await openCopilotWithPromptReference(seedText, label);
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
    getHtml(webview) {
        const nonce = String(Date.now());
        const skillsJson = JSON.stringify(CHAT_SKILL_OPTIONS);
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
    .skills {
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
    .quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .flow-guide {
      border: 1px solid var(--chat-border);
      border-radius: 12px;
      padding: 8px 10px;
      background: color-mix(in srgb, var(--chat-panel) 74%, transparent);
      display: grid;
      gap: 6px;
    }
    .flow-title {
      font-size: 11px;
      font-weight: 600;
      opacity: 0.9;
      letter-spacing: 0.02em;
    }
    .flow-item {
      font-size: 11px;
      line-height: 1.45;
      opacity: 0.88;
    }
    .flow-tools {
      font-size: 10px;
      opacity: 0.7;
    }
    .quick-btn {
      border: 1px solid var(--chat-border);
      border-radius: 999px;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--chat-panel) 70%, transparent);
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 11px;
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
      justify-content: space-between;
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
    .stamp {
      font-size: 10px;
      opacity: 0.6;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="title">AI4PB Skill Chat</div>
    <div class="thread" id="thread"></div>
    <div class="composer">
      <div class="skills" id="skills"></div>
      <div class="flow-guide">
        <div class="flow-title">流程说明 (SCRUM)</div>
        <div class="flow-item">流程1 开发迭代: Task List -> Init -> Issues -> Wrap-up -> Git Commit </div>
        <div class="flow-item">流程2 审计: Audit</div>
        <div class="flow-item">流程3 计划与汇报: Task List -> Weekly Report</div>
        <div class="flow-tools">工具入口: EA初始化, EA导出配置</div>
      </div>
      <div class="quick-actions">
        <button id="initBtn" class="quick-btn">EA初始化</button>
        <button id="configBtn" class="quick-btn">EA导出配置</button>
      </div>
      <textarea id="promptInput" placeholder="输入需求，或先点一个 SKILL 再发送。"></textarea>
      <div class="composer-row">
        <div class="meta" id="skillMeta">当前模式: Auto Skill</div>
        <button id="sendBtn" class="send-btn">发送到 Copilot</button>
      </div>
    </div>
    <p class="stamp">AI4PB Skill Chat</p>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const skills = ${skillsJson};
    const state = {
      selectedSkill: null,
      status: null
    };

    const thread = document.getElementById('thread');
    const skillsContainer = document.getElementById('skills');
    const skillMeta = document.getElementById('skillMeta');
    const promptInput = document.getElementById('promptInput');
    const sendBtn = document.getElementById('sendBtn');
    const initBtn = document.getElementById('initBtn');
    const configBtn = document.getElementById('configBtn');

    function appendBubble(role, text) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + role;
      bubble.textContent = text;
      thread.appendChild(bubble);
      thread.scrollTop = thread.scrollHeight;
    }

    function updateSkillMeta() {
      skillMeta.textContent = '当前模式: ' + (state.selectedSkill ? state.selectedSkill : 'Auto Skill');
    }

    function renderSkills() {
      skillsContainer.innerHTML = '';

      const autoBtn = document.createElement('button');
      autoBtn.className = 'skill-chip' + (!state.selectedSkill ? ' active' : '');
      autoBtn.textContent = 'Auto';
      autoBtn.addEventListener('click', () => {
        state.selectedSkill = null;
        renderSkills();
        updateSkillMeta();
      });
      skillsContainer.appendChild(autoBtn);

      skills.forEach((skill) => {
        const button = document.createElement('button');
        button.className = 'skill-chip' + (state.selectedSkill === skill.key ? ' active' : '');
        button.textContent = skill.label;
        button.addEventListener('click', () => {
          state.selectedSkill = skill.key;
          renderSkills();
          updateSkillMeta();
        });
        skillsContainer.appendChild(button);
      });
    }

    function sendRequest() {
      const text = String(promptInput.value || '').trim();
      if (!text && !state.selectedSkill) {
        appendBubble('ai', '请输入任务描述，或先选择一个 SKILL。');
        return;
      }

      appendBubble('user', text || '[使用所选 SKILL 直接开始]');

      const skillText = state.selectedSkill ? ('指定 SKILL: ' + state.selectedSkill) : '自动选择 SKILL';
      appendBubble('ai', '已提交到 Copilot，模式: ' + skillText + '。');

      vscode.postMessage({
        type: 'chatRequest',
        text,
        skill: state.selectedSkill
      });

      promptInput.value = '';
    }

    sendBtn.addEventListener('click', sendRequest);
    initBtn.addEventListener('click', () => {
      appendBubble('user', '[执行 EA 初始化]');
      vscode.postMessage({ type: 'statusAction', key: 'init' });
    });

    configBtn.addEventListener('click', () => {
      appendBubble('user', '[打开 EA 导出配置]');
      vscode.postMessage({ type: 'statusAction', key: 'options' });
    });

    promptInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendRequest();
      }
    });

    appendBubble('ai', '欢迎使用 AI4PB Skill Chat。可以手动选择 SKILL，或直接输入自然语言由系统自动路由。');
    renderSkills();
    updateSkillMeta();
  </script>
</body>
</html>`;
    }
}
WorkflowViewProvider.viewType = 'ai4pb.workflowView';
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
function buildSkillSeedText(skill, userText) {
    if (skill === 'iteration-summary') {
        const promptPath = resolveExtensionPath('workprompt/iteration-summary.md');
        if (exists(promptPath)) {
            const promptContent = fs.readFileSync(promptPath, 'utf-8').trim();
            if (promptContent.length > 0) {
                const lines = [
                    '请严格执行以下提示词并生成本次迭代的提交信息：',
                    '',
                    promptContent
                ];
                if (userText.trim().length > 0) {
                    lines.push('', `补充上下文：${userText.trim()}`);
                }
                lines.push('', '请现在开始。');
                return lines.join('\n');
            }
        }
    }
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
        const initialPromptPath = resolveExtensionPath(BUNDLED_PATHS.initialPrompt);
        if (!exists(archPath)) {
            void vscode.window.showErrorMessage(`Architecture JSON not found: ${archPath}`);
            return;
        }
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
    const promptPath = resolveExtensionPath('workprompt/iteration-summary.md');
    if (!exists(promptPath)) {
        void vscode.window.showErrorMessage(`AI4PB iteration summary prompt missing: ${promptPath}`);
        return;
    }
    const promptContent = fs.readFileSync(promptPath, 'utf-8').trim();
    if (!promptContent) {
        void vscode.window.showErrorMessage('AI4PB iteration summary prompt is empty.');
        return;
    }
    await openCopilotWithPromptReference([
        '请严格执行以下提示词并生成本次迭代的提交信息：',
        '',
        promptContent,
        '',
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