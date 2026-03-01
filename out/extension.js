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
    initialPrompt: 'workprompt/initial-prompt.md',
    wrapPrompt: 'workprompt/Wrap-up Prompt.md',
    reversePrompt: 'workprompt/reverse-engineer-WHOLE.md',
    guidanceDoc: 'docs/system-engineer-guidance.md'
};
const GUIDED_DEFAULTS = {
    needallmaintenace: false,
    needbrowserlocation: true,
    maintenacetype: 'forllm'
};
let output;
let extensionInstallRoot = '';
function activate(context) {
    extensionInstallRoot = context.extensionUri.fsPath;
    output = vscode.window.createOutputChannel('AI4PB Orchestrator');
    output.appendLine('AI4PB Orchestrator activated.');
    void vscode.window.showInformationMessage(`AI4PB loaded: ${context.extension.id}`);
    const workflowViewProvider = new WorkflowViewProvider(context.extensionUri);
    context.subscriptions.push(output, vscode.window.registerWebviewViewProvider(WorkflowViewProvider.viewType, workflowViewProvider), vscode.commands.registerCommand('ai4pb.refreshArchitectureContext', refreshArchitectureContext), vscode.commands.registerCommand('ai4pb.startIterationFromModel', startIterationFromModel), vscode.commands.registerCommand('ai4pb.runDesignCodeAlignment', runDesignCodeAlignment), vscode.commands.registerCommand('ai4pb.generateWrapUpReport', generateWrapUpReport), vscode.commands.registerCommand('ai4pb.openNextAction', openNextAction), vscode.commands.registerCommand('ai4pb.runGuidedWorkflow', runGuidedWorkflow));
}
function deactivate() {
    output?.dispose();
}
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
            if (message.type === 'refreshStatus') {
                await this.postStatusSnapshot();
                return;
            }
            if (message.type === 'statusAction' && message.key) {
                await this.handleStatusAction(message.key);
                await this.postStatusSnapshot();
                return;
            }
            const command = message.command;
            if (!command) {
                return;
            }
            await vscode.commands.executeCommand(command);
            await this.postStatusSnapshot();
        });
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                void this.postStatusSnapshot();
            }
        });
        webviewView.onDidDispose(() => {
            this.webviewView = undefined;
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
                this.refreshTimer = undefined;
            }
        });
        this.refreshTimer = setInterval(() => {
            void this.postStatusSnapshot();
        }, 15000);
        void this.postStatusSnapshot();
    }
    async handleStatusAction(key) {
        try {
            const root = getWorkspaceRoot();
            const archPath = getArchitectureJsonPath(root);
            const aiConfigPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
            const promptPaths = getBundledPromptPaths();
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
            if (key === 'aicodingconfig') {
                ensureGuidedAiConfig(root);
                await openFileIfExists(aiConfigPath);
                return;
            }
            if (key === 'prompts') {
                let opened = 0;
                for (const promptPath of promptPaths) {
                    if (exists(promptPath)) {
                        await openFileIfExists(promptPath);
                        opened++;
                    }
                }
                if (opened === 0) {
                    void vscode.window.showWarningMessage('No bundled prompt files found in extension workprompt/.');
                }
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
    async postStatusSnapshot() {
        if (!this.webviewView) {
            return;
        }
        const payload = this.collectStatusSnapshot();
        await this.webviewView.webview.postMessage({ type: 'status', payload });
    }
    collectStatusSnapshot() {
        const now = new Date();
        const items = [];
        try {
            const root = getWorkspaceRoot();
            const archPath = getArchitectureJsonPath(root);
            const aiConfigPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
            const archExists = exists(archPath);
            const archMtime = archExists ? fileMtime(archPath) : undefined;
            const archHours = archMtime ? (Date.now() - archMtime.getTime()) / (1000 * 60 * 60) : Number.POSITIVE_INFINITY;
            items.push({
                key: 'architecture',
                label: 'Architecture JSON',
                state: !archExists ? 'error' : archHours > 24 ? 'warn' : 'ok',
                detail: !archExists
                    ? 'Missing'
                    : archHours > 24
                        ? `Stale (${Math.floor(archHours)}h old)`
                        : `Fresh (${toIsoLocal(archMtime)})`,
                actionLabel: archExists ? 'Open' : 'Refresh'
            });
            items.push({
                key: 'aicodingconfig',
                label: '.aicodingconfig',
                state: exists(aiConfigPath) ? 'ok' : 'warn',
                detail: exists(aiConfigPath) ? 'Found' : 'Missing',
                actionLabel: exists(aiConfigPath) ? 'Open' : 'Create'
            });
            const promptPaths = getBundledPromptPaths();
            const missingPrompts = promptPaths.filter((promptPath) => !exists(promptPath)).length;
            items.push({
                key: 'prompts',
                label: 'Prompt Set',
                state: missingPrompts === 0 ? 'ok' : missingPrompts === promptPaths.length ? 'error' : 'warn',
                detail: missingPrompts === 0 ? 'All present' : `${missingPrompts}/${promptPaths.length} missing`,
                actionLabel: 'Open'
            });
            const tempDir = resolvePath(root, 'TEMP');
            const latestReport = this.findLatestReportMtime(tempDir);
            items.push({
                key: 'reports',
                label: 'Latest Report',
                state: latestReport ? 'ok' : 'warn',
                detail: latestReport ? toIsoLocal(latestReport) : 'No alignment/wrap-up report yet',
                actionLabel: latestReport ? 'Open' : 'Generate'
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            items.push({
                key: 'workspace',
                label: 'Workspace',
                state: 'error',
                detail: message,
                actionLabel: 'Refresh'
            });
        }
        return {
            generatedAt: toIsoLocal(now),
            items
        };
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
    getHtml(webview) {
        const nonce = String(Date.now());
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: var(--vscode-font-family); padding: 8px; color: var(--vscode-foreground); }
    h3 { margin: 8px 0 10px; font-size: 12px; font-weight: 600; text-transform: uppercase; opacity: .85; }
    .desc { margin: 0 0 10px; font-size: 12px; opacity: .85; }
    .header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .tiny-btn { border: 1px solid var(--vscode-panel-border); border-radius: 4px; background: transparent; color: var(--vscode-foreground); padding: 2px 6px; cursor: pointer; font-size: 11px; }
    .tiny-btn:hover { background: var(--vscode-toolbar-hoverBackground); }
    .status { margin: 0 0 12px; display: grid; gap: 6px; }
    .status-item { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 6px; }
    .status-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .status-label { font-size: 12px; font-weight: 600; }
    .status-detail { font-size: 11px; opacity: .85; margin-top: 2px; }
    .status-actions { margin-top: 6px; display: flex; justify-content: flex-end; }
    .action-btn {
      border: 1px solid var(--vscode-panel-border);
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-foreground);
      padding: 2px 6px;
      cursor: pointer;
      font-size: 11px;
    }
    .action-btn:hover { background: var(--vscode-toolbar-hoverBackground); }
    .dot { font-size: 12px; }
    .dot.ok { color: var(--vscode-charts-green); }
    .dot.warn { color: var(--vscode-charts-yellow); }
    .dot.error { color: var(--vscode-charts-red); }
    .stamp { font-size: 10px; opacity: .7; margin: 0 0 8px; }
    .steps { display: grid; gap: 8px; }
    button {
      width: 100%; text-align: left; border: 1px solid var(--vscode-panel-border);
      background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground);
      padding: 8px; border-radius: 6px; cursor: pointer;
    }
    button:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .label { display: block; font-weight: 600; font-size: 12px; }
    .hint { display: block; margin-top: 2px; font-size: 11px; opacity: .8; }
  </style>
</head>
<body>
  <div class="header">
    <h3>AI4PB Workflow</h3>
    <button class="tiny-btn" id="refreshStatusBtn">Refresh</button>
  </div>
  <p id="statusStamp" class="stamp">Status: loading...</p>
  <div id="statusGrid" class="status"></div>
  <p class="desc">Run each phase in order for model-driven delivery.</p>
  <div class="steps">
    <button data-cmd="ai4pb.runGuidedWorkflow"><span class="label">▶ Run All (Guided)</span><span class="hint">Stop on error, execute end-to-end flow</span></button>
    <button data-cmd="ai4pb.refreshArchitectureContext"><span class="label">1) Refresh Context</span><span class="hint">Check model JSON, prompts, docs</span></button>
    <button data-cmd="ai4pb.openNextAction"><span class="label">2) Open Next Action</span><span class="hint">Auto-decide what to do now</span></button>
    <button data-cmd="ai4pb.startIterationFromModel"><span class="label">3) Start Iteration</span><span class="hint">Open architecture + initial prompt</span></button>
    <button data-cmd="ai4pb.runDesignCodeAlignment"><span class="label">4) Run Alignment</span><span class="hint">Generate design-code checklist report</span></button>
    <button data-cmd="ai4pb.generateWrapUpReport"><span class="label">5) Generate Wrap-up</span><span class="hint">Create iteration wrap-up template</span></button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const statusGrid = document.getElementById('statusGrid');
    const statusStamp = document.getElementById('statusStamp');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');

    function renderStatus(payload) {
      if (!payload || !payload.items) {
        return;
      }

      statusStamp.textContent = 'Status: ' + payload.generatedAt;
      statusGrid.innerHTML = '';

      payload.items.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'status-item';
        card.innerHTML =
          '<div class="status-top">' +
          '<span class="status-label">' + item.label + '</span>' +
          '<span class="dot ' + item.state + '">●</span>' +
          '</div>' +
          '<div class="status-detail">' + item.detail + '</div>' +
          '<div class="status-actions">' +
          '<button class="action-btn" data-action-key="' + item.key + '">' + item.actionLabel + '</button>' +
          '</div>';
        statusGrid.appendChild(card);
      });

      statusGrid.querySelectorAll('button[data-action-key]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-action-key');
          vscode.postMessage({ type: 'statusAction', key });
        });
      });
    }

    refreshStatusBtn.addEventListener('click', () => {
      vscode.postMessage({ type: 'refreshStatus' });
    });

    document.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const command = btn.getAttribute('data-cmd');
        vscode.postMessage({ command });
      });
    });

    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message && message.type === 'status') {
        renderStatus(message.payload);
      }
    });

    vscode.postMessage({ type: 'refreshStatus' });
  </script>
</body>
</html>`;
    }
}
WorkflowViewProvider.viewType = 'ai4pb.workflowView';
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
function buildGuidedAiConfig(existing) {
    const existingAutoGen = existing?.EA_AUTOGEN_CONFIG;
    return {
        EA_AUTOGEN_CONFIG: {
            needallmaintenace: GUIDED_DEFAULTS.needallmaintenace,
            needbrowserlocation: GUIDED_DEFAULTS.needbrowserlocation,
            maintenacetype: GUIDED_DEFAULTS.maintenacetype,
            ...(existingAutoGen?.architectureJsonPath ? { architectureJsonPath: existingAutoGen.architectureJsonPath } : {})
        }
    };
}
function ensureGuidedAiConfig(root) {
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
    const normalized = buildGuidedAiConfig(existing);
    fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf-8');
    return normalized;
}
function exists(filePath) {
    return fs.existsSync(filePath);
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
            { label: '.aicodingconfig', filePath: resolvePath(root, RELATIVE_PATHS.aiConfig) },
            { label: 'Initial Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.initialPrompt) },
            { label: 'Wrap-up Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.wrapPrompt) },
            { label: 'Reverse Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.reversePrompt) },
            { label: 'Guidance Doc', filePath: resolveExtensionPath(BUNDLED_PATHS.guidanceDoc) }
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
        const guidancePath = resolveExtensionPath(BUNDLED_PATHS.guidanceDoc);
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
            `- .aicodingconfig: ${exists(resolvePath(root, RELATIVE_PATHS.aiConfig)) ? 'OK' : 'MISSING'}`,
            `- Guidance Doc: ${exists(guidancePath) ? 'OK' : 'MISSING'} (${guidancePath})`,
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
//# sourceMappingURL=extension.js.map