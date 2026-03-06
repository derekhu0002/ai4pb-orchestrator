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
  reversePrompt: 'workprompt/reverse-engineer-WHOLE.md'
};

const TOOL_NAMES = {
  initPrompt: 'ai4pb_get_init_session_prompt',
  wrapPrompt: 'ai4pb_get_wrap_up_prompt',
  auditPrompt: 'ai4pb_get_design_audit_prompt'
} as const;

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

  registerPromptTools(context);

  context.subscriptions.push(
    output,
    vscode.window.registerWebviewViewProvider(WorkflowViewProvider.viewType, workflowViewProvider),
    vscode.commands.registerCommand('ai4pb.initializeFromTemplate', initializeFromTemplate),
    vscode.commands.registerCommand('ai4pb.refreshArchitectureContext', refreshArchitectureContext),
    vscode.commands.registerCommand('ai4pb.startIterationFromModel', startIterationFromModel),
    vscode.commands.registerCommand('ai4pb.runDesignCodeAlignment', runDesignCodeAlignment),
    vscode.commands.registerCommand('ai4pb.generateWrapUpReport', generateWrapUpReport),
    vscode.commands.registerCommand('ai4pb.openNextAction', openNextAction),
    vscode.commands.registerCommand('ai4pb.runGuidedWorkflow', runGuidedWorkflow),
    vscode.commands.registerCommand('ai4pb.openCopilotWithInitPrompt', openCopilotWithInitPrompt),
    vscode.commands.registerCommand('ai4pb.openCopilotWithDesignAuditPrompt', openCopilotWithDesignAuditPrompt),
    vscode.commands.registerCommand('ai4pb.openCopilotWithWrapUpPrompt', openCopilotWithWrapUpPrompt)
  );
}

export function deactivate(): void {
  output?.dispose();
}

type PromptToolInput = Record<string, never>;

class PromptTemplateTool implements vscode.LanguageModelTool<PromptToolInput> {
  constructor(
    private readonly label: string,
    private readonly promptRelativePath: string
  ) {}

  prepareInvocation(
    _options: vscode.LanguageModelToolInvocationPrepareOptions<PromptToolInput>,
    _token: vscode.CancellationToken
  ): vscode.PreparedToolInvocation {
    return {
      invocationMessage: `Loading ${this.label} prompt template`
    };
  }

  invoke(
    _options: vscode.LanguageModelToolInvocationOptions<PromptToolInput>,
    _token: vscode.CancellationToken
  ): vscode.LanguageModelToolResult {
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

function registerPromptTools(context: vscode.ExtensionContext): void {
  const toolDefinitions: Array<{ name: string; label: string; promptRelativePath: string }> = [
    { name: TOOL_NAMES.initPrompt, label: 'Init Session', promptRelativePath: BUNDLED_PATHS.initialPrompt },
    { name: TOOL_NAMES.wrapPrompt, label: 'Wrap-up', promptRelativePath: BUNDLED_PATHS.wrapPrompt },
    { name: TOOL_NAMES.auditPrompt, label: 'Design Audit', promptRelativePath: BUNDLED_PATHS.reversePrompt }
  ];

  for (const tool of toolDefinitions) {
    context.subscriptions.push(
      vscode.lm.registerTool(
        tool.name,
        new PromptTemplateTool(tool.label, tool.promptRelativePath)
      )
    );
    output.appendLine(`[AI4PB] Tool registered: ${tool.name}`);
  }
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
        label: '初始化 EA 模板',
        state: 'ok',
        detail: '将 EA 模板复制到工作区根目录，并按项目名称命名。',
        actionLabel: '执行'
      });

      items.push({
        key: 'options',
        label: '导出选项',
        state: exists(aiConfigPath) ? 'ok' : 'warn',
        detail: `模式=${options.maintenacetype}，浏览器路径=${options.needbrowserlocation ? '开启' : '关闭'}，全量维护=${options.needallmaintenace ? '开启' : '关闭'}`,
        actionLabel: '设置'
      });

      const promptPaths = getBundledPromptPaths();
      const missingPrompts = promptPaths.filter((promptPath) => !exists(promptPath)).length;

      items.push({
        key: 'prompts',
        label: '提示词集合',
        state: missingPrompts === 0 ? 'ok' : missingPrompts === promptPaths.length ? 'error' : 'warn',
        detail: `初始化会话：${exists(promptPaths[0]) ? '正常' : '缺失'} | 收尾总结：${exists(promptPaths[1]) ? '正常' : '缺失'} | 设计审计：${exists(promptPaths[2]) ? '正常' : '缺失'}`,
        actionLabel: '打开'
      });

      items.push({
        key: 'copilotInit',
        label: '打开 Copilot（Init Prompt）',
        state: 'ok',
        detail: '一键打开 Copilot Chat，并自动使用 #ai4pb-init。',
        actionLabel: '打开'
      });

      items.push({
        key: 'copilotAudit',
        label: '打开 Copilot（Design Audit）',
        state: 'ok',
        detail: '一键打开 Copilot Chat，并自动使用 #ai4pb-audit。',
        actionLabel: '打开'
      });

      items.push({
        key: 'copilotWrapUp',
        label: '打开 Copilot（Wrap-up）',
        state: 'ok',
        detail: '一键打开 Copilot Chat，并自动使用 #ai4pb-wrapup。',
        actionLabel: '打开'
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      items.push({
        key: 'workspace',
        label: '工作区',
        state: 'error',
        detail: message,
        actionLabel: '刷新'
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { 
      font-family: var(--vscode-font-family); 
      padding: 14px 12px;
      color: var(--vscode-foreground); 
      background-color: var(--vscode-editor-background); 
    }
    .header { display: none; }
    
    .grid-container { 
      display: flex; 
      flex-direction: column; 
      gap: 36px;
      margin-bottom: 24px;
      width: 100%;
    }
    
    button { 
      outline: none; 
      font-family: inherit; 
      text-align: center;
    }

    .info-text {
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
      text-align: left;
    }
    
    .call-to-action-btn {
      background-color: var(--vscode-button-background, #0e639c) !important;
      color: var(--vscode-button-foreground, #ffffff) !important;
      border: none !important;
      border-radius: 3px;
      padding: 6px 12px;
      cursor: pointer;
      display: block;
      width: 100% !important;
      box-sizing: border-box;
      font-size: 13px;
      font-weight: 500;
      min-height: 30px;
      text-align: center;
    }
    .call-to-action-btn:hover {
      background-color: var(--vscode-button-hoverBackground, #1177bb) !important;
    }
    
    .block-container {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: min(360px, calc(100% - 8px));
      margin: 0 auto;
      box-sizing: border-box;
    }

    .stamp { 
      font-size: 10px; 
      opacity: 0.5; 
      margin-top: 20px; 
      text-align: right; 
    }
  </style>
</head>
<body>
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
        const block = document.createElement('div');
        block.className = 'block-container';

        const infoText = document.createElement('div');
        infoText.className = 'info-text';
        infoText.textContent = item.detail;

        const actionButton = document.createElement('button');
        actionButton.className = 'call-to-action-btn';
        actionButton.setAttribute('data-action-key', item.key);
        actionButton.textContent = item.label;

        block.appendChild(infoText);
        block.appendChild(actionButton);
          
        statusGrid.appendChild(block);
      });

      statusGrid.querySelectorAll('.call-to-action-btn').forEach((btn) => {
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
      { label: 'Reverse Prompt', filePath: resolveExtensionPath(BUNDLED_PATHS.reversePrompt) }
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

async function openCopilotWithInitPrompt(): Promise<void> {
  await openCopilotWithPromptReference(
    [
      '请使用 #ai4pb-init。',
      '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
      '请现在开始。'
    ].join('\n'),
    'init prompt workflow'
  );
}

async function openCopilotWithDesignAuditPrompt(): Promise<void> {
  await openCopilotWithPromptReference(
    [
      '请使用 #ai4pb-audit。',
      '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
      '请现在开始。'
    ].join('\n'),
    'design audit workflow'
  );
}

async function openCopilotWithWrapUpPrompt(): Promise<void> {
  await openCopilotWithPromptReference(
    [
      '请使用 #ai4pb-wrapup。',
      '具体需要执行的工作已在提示词中定义，请严格按提示词执行，不要在提示词之外额外布置任务。',
      '请现在开始。'
    ].join('\n'),
    'wrap-up workflow'
  );
}

async function openCopilotWithPromptReference(seedText: string, label: string): Promise<void> {
  try {
    await vscode.commands.executeCommand('workbench.action.chat.open', { query: seedText });
    await trySubmitCopilotChat();
    output.appendLine(`[AI4PB] Opened Copilot chat with ${label} reference.`);
    return;
  } catch {
    try {
      await vscode.commands.executeCommand('workbench.action.chat.open');
      await vscode.commands.executeCommand('workbench.action.chat.focusInput');
      await vscode.commands.executeCommand('type', { text: seedText });
      await trySubmitCopilotChat();
      output.appendLine(`[AI4PB] Opened Copilot chat and inserted ${label} reference via fallback.`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showErrorMessage(`AI4PB failed to open Copilot chat: ${message}`);
    }
  }
}

async function trySubmitCopilotChat(): Promise<void> {
  try {
    await vscode.commands.executeCommand('workbench.action.chat.submit');
  } catch {
    // Older VS Code builds may not expose submit command; ignore safely.
  }
}
