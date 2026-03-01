import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

type AiConfig = {
  EA_AUTOGEN_CONFIG?: {
    needCode?: boolean;
    needContent?: boolean;
    needdoc?: boolean;
    needallmaintenace?: boolean;
    needbrowserlocation?: boolean;
    maintenacetype?: string;
    architectureJsonPath?: string;
  };
};

type GuidedOptions = {
  needallmaintenace: boolean;
  needbrowserlocation: boolean;
  maintenacetype: string;
};

const RELATIVE_PATHS = {
  architectureJson: 'design/KG/SystemArchitecture.json',
  aiConfig: '.aicodingconfig'
};

const BUNDLED_PATHS = {
  eaTemplate: 'EA-model-template/EA-model-template.feap',
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

let output: vscode.OutputChannel;
let extensionInstallRoot = '';

export function activate(context: vscode.ExtensionContext): void {
  extensionInstallRoot = context.extensionUri.fsPath;
  output = vscode.window.createOutputChannel('AI4PB Orchestrator');
  output.appendLine('AI4PB Orchestrator activated.');
  void vscode.window.showInformationMessage(`AI4PB loaded: ${context.extension.id}`);
  const workflowViewProvider = new WorkflowViewProvider(context.extensionUri);

  context.subscriptions.push(
    output,
    vscode.window.registerWebviewViewProvider(WorkflowViewProvider.viewType, workflowViewProvider),
    vscode.commands.registerCommand('ai4pb.initializeFromTemplate', initializeFromTemplate),
    vscode.commands.registerCommand('ai4pb.refreshArchitectureContext', refreshArchitectureContext),
    vscode.commands.registerCommand('ai4pb.startIterationFromModel', startIterationFromModel),
    vscode.commands.registerCommand('ai4pb.runDesignCodeAlignment', runDesignCodeAlignment),
    vscode.commands.registerCommand('ai4pb.generateWrapUpReport', generateWrapUpReport),
    vscode.commands.registerCommand('ai4pb.openNextAction', openNextAction),
    vscode.commands.registerCommand('ai4pb.runGuidedWorkflow', runGuidedWorkflow)
  );
}

export function deactivate(): void {
  output?.dispose();
}

class WorkflowViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'ai4pb.workflowView';
  private webviewView?: vscode.WebviewView;
  private refreshTimer?: NodeJS.Timeout;

  constructor(private readonly extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: { command?: string; type?: string; key?: string }) => {
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

  private async handleStatusAction(key: string): Promise<void> {
    try {
      const root = getWorkspaceRoot();
      const archPath = getArchitectureJsonPath(root);
      const promptPaths = getBundledPromptPaths();

      if (key === 'architecture') {
        if (exists(archPath)) {
          await openFileIfExists(archPath);
        } else {
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
        } else {
          await vscode.commands.executeCommand('ai4pb.generateWrapUpReport');
        }
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(`AI4PB status action failed: ${message}`);
    }
  }

  private async postStatusSnapshot(): Promise<void> {
    if (!this.webviewView) {
      return;
    }
    const payload = this.collectStatusSnapshot();
    await this.webviewView.webview.postMessage({ type: 'status', payload });
  }

  private collectStatusSnapshot(): {
    generatedAt: string;
    items: Array<{ key: string; label: string; state: 'ok' | 'warn' | 'error'; detail: string; actionLabel: string }>;
  } {
    const now = new Date();
    const items: Array<{ key: string; label: string; state: 'ok' | 'warn' | 'error'; detail: string; actionLabel: string }> = [];

    try {
      const root = getWorkspaceRoot();
      const aiConfigPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
      const options = getEffectiveGuidedOptions(loadAiConfig(root));

      items.push({
        key: 'init',
        label: 'Initialize EA Template',
        state: 'ok',
        detail: 'Copy EA template to workspace root and name it by project',
        actionLabel: 'Run'
      });

      items.push({
        key: 'options',
        label: 'Workflow Options',
        state: exists(aiConfigPath) ? 'ok' : 'warn',
        detail: `mode=${options.maintenacetype}, browserPath=${options.needbrowserlocation ? 'on' : 'off'}, allMaintenance=${options.needallmaintenace ? 'on' : 'off'}`,
        actionLabel: 'Select'
      });

      const promptPaths = getBundledPromptPaths();
      const missingPrompts = promptPaths.filter((promptPath) => !exists(promptPath)).length;

      items.push({
        key: 'prompts',
        label: 'Prompt Set',
        state: missingPrompts === 0 ? 'ok' : missingPrompts === promptPaths.length ? 'error' : 'warn',
        detail: `Init Session: ${exists(promptPaths[0]) ? 'ok' : 'missing'}<br/>Wrap Up: ${exists(promptPaths[1]) ? 'ok' : 'missing'}<br/>Design Audit: ${exists(promptPaths[2]) ? 'ok' : 'missing'}`,
        actionLabel: 'Open'
      });
    } catch (error) {
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

  private findLatestReportMtime(tempDir: string): Date | undefined {
    if (!exists(tempDir)) {
      return undefined;
    }

    const entries = fs.readdirSync(tempDir);
    let latest: Date | undefined;

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

  private findLatestReportPath(tempDir: string): string | undefined {
    if (!exists(tempDir)) {
      return undefined;
    }

    const entries = fs.readdirSync(tempDir);
    let latestPath: string | undefined;
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

  private getHtml(webview: vscode.Webview): string {
    const nonce = String(Date.now());
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { 
      font-family: var(--vscode-font-family); 
      padding: 16px 12px; 
      color: var(--vscode-foreground); 
      background-color: var(--vscode-editor-background); 
    }
    .header { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 20px; 
    }
    h3 { 
      margin: 0; 
      font-size: 13px; 
      font-weight: 600; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
      opacity: 0.9; 
    }
    .tiny-btn { 
      border: 1px solid var(--vscode-panel-border); 
      border-radius: 4px; 
      background: transparent; 
      color: var(--vscode-foreground); 
      padding: 4px 8px; 
      cursor: pointer; 
      font-size: 11px; 
      transition: all 0.2s; 
    }
    .tiny-btn:hover { 
      background: var(--vscode-toolbar-hoverBackground); 
    }
    
    .grid-container { 
      display: flex; 
      flex-direction: column; 
      gap: 12px; 
      margin-bottom: 16px; 
    }
    
    button { 
      outline: none; 
      font-family: inherit; 
    }
    
    .glass-card {
      position: relative;
      display: flex;
      flex-direction: column;
      text-align: left;
      border: 1px solid var(--vscode-widget-border, var(--vscode-panel-border));
      background: var(--vscode-editorWidget-background);
      border-radius: 6px;
      padding: 12px 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
      width: 100%;
      box-sizing: border-box;
      color: var(--vscode-foreground);
    }
    .glass-card:hover {
      background: var(--vscode-list-hoverBackground);
      border-color: var(--vscode-focusBorder);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }
    .glass-card:active {
      transform: translateY(0);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .card-top { 
      display: flex; 
      align-items: center; 
      justify-content: space-between; 
      margin-bottom: 4px; 
      width: 100%; 
    }
    .card-label { 
      font-size: 13px; 
      font-weight: 600; 
    }
    .card-detail { 
      font-size: 12px; 
      opacity: 0.8; 
      line-height: 1.4; 
    }
    
    .dot { font-size: 12px; }
    .dot.ok { color: var(--vscode-testing-iconPassed); }
    .dot.warn { color: var(--vscode-editorWarning-foreground); }
    .dot.error { color: var(--vscode-editorError-foreground); }
    
    .stamp { 
      font-size: 10px; 
      opacity: 0.5; 
      margin-top: 20px; 
      text-align: right; 
    }
  </style>
</head>
<body>
  <div class="header">
    <h3>AI4PB Studio</h3>
  </div>
  
  <div class="grid-container" id="statusGrid">
    <!-- Dynamic cards injected here -->
  </div>
  
  <p id="statusStamp" class="stamp">Status: loading...</p>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const statusGrid = document.getElementById('statusGrid');
    const statusStamp = document.getElementById('statusStamp');

    function renderStatus(payload) {
      if (!payload || !payload.items) {
        return;
      }

      statusStamp.textContent = 'Updated: ' + payload.generatedAt;
      statusGrid.innerHTML = '';

      payload.items.forEach((item) => {
        const card = document.createElement('button');
        card.className = 'glass-card';
        card.setAttribute('data-action-key', item.key);
        
        card.innerHTML =
          '<div class="card-top">' +
          '<span class="card-label">' + item.label + '</span>' +
          '<span class="dot ' + item.state + '">●</span>' +
          '</div>' +
          '<div class="card-detail">' + item.detail + '</div>';
          
        statusGrid.appendChild(card);
      });

      statusGrid.querySelectorAll('.glass-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          const key = btn.getAttribute('data-action-key');
          vscode.postMessage({ type: 'statusAction', key });
        });
      });
    }

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

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error('No workspace folder opened.');
  }
  return folders[0].uri.fsPath;
}

function resolvePath(root: string, relativePath: string): string {
  return path.join(root, ...relativePath.split('/'));
}

function resolveExtensionPath(relativePath: string): string {
  if (!extensionInstallRoot) {
    throw new Error('Extension root not initialized.');
  }
  return path.join(extensionInstallRoot, ...relativePath.split('/'));
}

function getBundledPromptPaths(): string[] {
  return [
    resolveExtensionPath(BUNDLED_PATHS.initialPrompt),
    resolveExtensionPath(BUNDLED_PATHS.wrapPrompt),
    resolveExtensionPath(BUNDLED_PATHS.reversePrompt)
  ];
}

function getEffectiveGuidedOptions(config?: AiConfig): GuidedOptions {
  const existingAutoGen = config?.EA_AUTOGEN_CONFIG;

  return {
    needallmaintenace:
      typeof existingAutoGen?.needallmaintenace === 'boolean'
        ? existingAutoGen.needallmaintenace
        : GUIDED_DEFAULTS.needallmaintenace,
    needbrowserlocation:
      typeof existingAutoGen?.needbrowserlocation === 'boolean'
        ? existingAutoGen.needbrowserlocation
        : GUIDED_DEFAULTS.needbrowserlocation,
    maintenacetype:
      typeof existingAutoGen?.maintenacetype === 'string' && existingAutoGen.maintenacetype.trim().length > 0
        ? existingAutoGen.maintenacetype
        : GUIDED_DEFAULTS.maintenacetype
  };
}

function buildGuidedAiConfig(
  existing?: AiConfig,
  overrides?: Partial<GuidedOptions>
): AiConfig {
  const existingAutoGen = existing?.EA_AUTOGEN_CONFIG;
  const effectiveOptions = getEffectiveGuidedOptions(existing);

  if (typeof overrides?.needallmaintenace === 'boolean') {
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

function ensureGuidedAiConfig(root: string, overrides?: Partial<GuidedOptions>): AiConfig {
  const configPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
  let existing: AiConfig | undefined;

  if (exists(configPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as AiConfig;
    } catch {
      existing = undefined;
    }
  }

  const normalized = buildGuidedAiConfig(existing, overrides);
  fs.writeFileSync(configPath, JSON.stringify(normalized, null, 2), 'utf-8');
  return normalized;
}

async function configureGuidedOptions(root: string): Promise<void> {
  const current = getEffectiveGuidedOptions(loadAiConfig(root));

  const modePick = await vscode.window.showQuickPick(
    [
      { label: 'forllm', description: 'AI-first maintenance mode', value: 'forllm' },
      { label: 'forproject', description: 'Project-driven maintenance mode', value: 'forproject' }
    ],
    {
      title: 'AI4PB: Select maintenance type',
      placeHolder: `Current: ${current.maintenacetype}`,
      ignoreFocusOut: true
    }
  );

  if (!modePick) {
    return;
  }

  const browserPathPick = await vscode.window.showQuickPick(
    [
      { label: 'On', description: 'Include browser path in exports', value: true },
      { label: 'Off', description: 'Do not include browser path', value: false }
    ],
    {
      title: 'AI4PB: Include browser path',
      placeHolder: `Current: ${current.needbrowserlocation ? 'On' : 'Off'}`,
      ignoreFocusOut: true
    }
  );

  if (!browserPathPick) {
    return;
  }

  const allMaintenancePick = await vscode.window.showQuickPick(
    [
      { label: 'On', description: 'Enable all maintenance', value: true },
      { label: 'Off', description: 'Disable all maintenance', value: false }
    ],
    {
      title: 'AI4PB: Enable all maintenance',
      placeHolder: `Current: ${current.needallmaintenace ? 'On' : 'Off'}`,
      ignoreFocusOut: true
    }
  );

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

function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function fileMtime(filePath: string): Date | undefined {
  if (!exists(filePath)) {
    return undefined;
  }
  return fs.statSync(filePath).mtime;
}

function toIsoLocal(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').substring(0, 19);
}

function loadAiConfig(root: string): AiConfig | undefined {
  const configPath = resolvePath(root, RELATIVE_PATHS.aiConfig);
  if (!exists(configPath)) {
    return undefined;
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as AiConfig;
}

function getArchitectureJsonPath(root: string): string {
  const config = loadAiConfig(root);
  const fromConfig = config?.EA_AUTOGEN_CONFIG?.architectureJsonPath;
  if (fromConfig && fromConfig.trim().length > 0) {
    return path.isAbsolute(fromConfig) ? fromConfig : resolvePath(root, fromConfig);
  }
  return resolvePath(root, RELATIVE_PATHS.architectureJson);
}

async function openFileIfExists(filePath: string): Promise<void> {
  if (!exists(filePath)) {
    return;
  }
  const doc = await vscode.workspace.openTextDocument(filePath);
  await vscode.window.showTextDocument(doc, { preview: false });
}

async function refreshArchitectureContext(): Promise<void> {
  try {
    const root = getWorkspaceRoot();
    ensureGuidedAiConfig(root);
    const archPath = getArchitectureJsonPath(root);

    const checks: Array<{ label: string; filePath: string }> = [
      { label: 'Architecture JSON', filePath: archPath },
      { label: 'Managed Options Config', filePath: resolvePath(root, RELATIVE_PATHS.aiConfig) },
      { label: 'Initial Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.initialPrompt) },
      { label: 'Wrap-up Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.wrapPrompt) },
      { label: 'Reverse Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.reversePrompt) },
      { label: 'Guidance Doc', filePath: resolveExtensionPath(BUNDLED_PATHS.guidanceDoc) }
    ];

    output.clear();
    output.appendLine('[AI4PB] Refresh Architecture Context');
    output.appendLine(`Workspace: ${root}`);

    const missing: string[] = [];
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
    } else {
      void vscode.window.showWarningMessage(`AI4PB context refreshed with missing items: ${missing.join(', ')}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB refresh failed: ${message}`);
  }
}

async function initializeFromTemplate(): Promise<void> {
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
      const choice = await vscode.window.showWarningMessage(
        `Target file already exists: ${targetFileName}`,
        { modal: true },
        'Overwrite',
        'Open Existing'
      );

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

    const openChoice = await vscode.window.showInformationMessage(
      `EA template created: ${targetFileName}`,
      'Reveal in Explorer'
    );

    if (openChoice === 'Reveal in Explorer') {
      await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(targetPath));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB initialize failed: ${message}`);
  }
}

async function startIterationFromModel(): Promise<void> {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB start iteration failed: ${message}`);
  }
}

async function runDesignCodeAlignment(): Promise<void> {
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
      `- Managed Options Config: ${exists(resolvePath(root, RELATIVE_PATHS.aiConfig)) ? 'OK' : 'MISSING'}`,
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB alignment failed: ${message}`);
  }
}

async function generateWrapUpReport(): Promise<void> {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB wrap-up generation failed: ${message}`);
  }
}

async function openNextAction(): Promise<void> {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    void vscode.window.showErrorMessage(`AI4PB next action failed: ${message}`);
  }
}

function getGuidedPrecheck(root: string): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const archPath = getArchitectureJsonPath(root);
  if (!exists(archPath)) {
    errors.push(`Architecture JSON missing: ${archPath}`);
  } else {
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

async function runGuidedWorkflow(): Promise<void> {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    output.appendLine(`[AI4PB] Guided workflow failed: ${message}`);
    output.show(true);
    void vscode.window.showErrorMessage(`AI4PB Run All (Guided) failed: ${message}`);
  }
}
