import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { scanTypeScriptReality } from './ast/ts/scanTypeScriptReality';

export type AlignmentLogger = {
  appendLine(message: string): void;
};

export type ArchitectureModelElement = {
  id: string;
  name: string;
  type: string;
  browser_path?: string;
  description?: string;
  file_path?: string;
  source?: 'intent' | 'typescript' | 'python';
  visibility?: 'public' | 'protected' | 'private' | 'unknown';
  exported?: boolean;
  extensions?: Record<string, unknown>;
};

export type ArchitectureModelRelationship = {
  id: string;
  statement: string;
  name: string;
  super_type: string;
  source_id: string;
  target_id: string;
  source_name: string;
  target_name: string;
  description?: string;
  extensions?: Record<string, unknown>;
};

export type ArchitectureModelView = {
  view_id: string;
  view_name: string;
  description?: string;
  browser_path?: string;
  parent_element_id?: string;
  parent_element_name?: string;
  included_elements: string[];
  included_relationships: string[];
  extensions?: Record<string, unknown>;
};

export type ArchitectureRealityModel = {
  name: string;
  description: string;
  elements: ArchitectureModelElement[];
  relationships: ArchitectureModelRelationship[];
  views: ArchitectureModelView[];
  extensions?: Record<string, unknown>;
};

type OrphanClassification = 'ignored_private_detail' | 'public_unmodeled_api' | 'orphaned_public_component';

type DifferenceItem = {
  kind: string;
  severity: 'info' | 'warning' | 'error';
  summary: string;
  elementName?: string;
  relationshipStatement?: string;
  filePath?: string;
  classification?: OrphanClassification;
};

type ReconciliationReport = {
  generatedAt: string;
  intentModelPath: string;
  realityModelPath: string;
  metrics: {
    coverage: number;
    accuracy: number;
    purity: number;
    seamlessFitIndex?: number;
    totalIntentElements: number;
    totalIntentRelationships: number;
    totalRealityElements: number;
    actionableOrphanedElements: number;
    matchedIntentElements: number;
    matchedIntentRelationships: number;
  };
  missingElements: ArchitectureModelElement[];
  missingRelationships: ArchitectureModelRelationship[];
  ignoredImplementationDetails: ArchitectureModelElement[];
  publicUnmodeledApis: ArchitectureModelElement[];
  orphanedPublicComponents: ArchitectureModelElement[];
  differenceList: DifferenceItem[];
};

export type AlignmentRunResult = {
  realityModelPath: string;
  gapJsonPath: string;
  gapMarkdownPath: string;
  report: ReconciliationReport;
};

type AlignmentOptions = {
  explicitExcludes?: string[];
};

type PythonScannerResponse = ArchitectureRealityModel & {
  errors?: string[];
};

type IntentArchitectureDocument = ArchitectureRealityModel;

const DEFAULT_SCANNER_EXCLUDES = [
  '.git',
  '.hg',
  '.svn',
  '.venv',
  'node_modules',
  'out',
  'dist',
  'coverage',
  'TEMP',
  'design/intention_reality_audit',
  'ast/py/__pycache__'
];

// @ArchitectureID: 1156
export async function runArchitectureRealityAlignment(
  workspaceRoot: string,
  architectureJsonPath: string,
  logger: AlignmentLogger,
  options: AlignmentOptions = {}
): Promise<AlignmentRunResult> {
  const explicitExcludes = uniqueStrings(options.explicitExcludes ?? []);
  const reportDir = path.join(workspaceRoot, 'design', 'intention_reality_audit');
  fs.mkdirSync(reportDir, { recursive: true });

  logger.appendLine('[AI4PB] Architecture reality alignment started.');

  const typescriptModel = scanTypeScriptReality(workspaceRoot, explicitExcludes, logger);
  const pythonModel = await scanPythonReality(workspaceRoot, explicitExcludes, logger);
  const realityModel = buildRealityModel(workspaceRoot, explicitExcludes, [typescriptModel, pythonModel]);

  const realityModelPath = path.join(reportDir, 'reality.json');
  fs.writeFileSync(realityModelPath, JSON.stringify(realityModel, null, 2), 'utf-8');
  logger.appendLine(`[AI4PB] reality.json written to ${realityModelPath}`);

  const intentModel = readIntentArchitecture(architectureJsonPath);
  const report = reconcileArchitectureModels(intentModel, realityModel, architectureJsonPath, realityModelPath);

  const gapJsonPath = path.join(reportDir, 'arch_impl_gap.json');
  const gapMarkdownPath = path.join(reportDir, 'arch_impl_gap.md');
  fs.writeFileSync(gapJsonPath, JSON.stringify(report, null, 2), 'utf-8');
  fs.writeFileSync(gapMarkdownPath, renderGapMarkdown(report), 'utf-8');
  logger.appendLine(`[AI4PB] ARCH_IMPL_GAP reports written to ${gapJsonPath} and ${gapMarkdownPath}`);

  return {
    realityModelPath,
    gapJsonPath,
    gapMarkdownPath,
    report
  };
}

// @ArchitectureID: 1277
async function scanPythonReality(
  workspaceRoot: string,
  explicitExcludes: string[],
  logger: AlignmentLogger
): Promise<ArchitectureRealityModel> {
  const scriptPath = path.join(workspaceRoot, 'ast', 'py', 'scan_python_reality.py');
  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Python scanner script not found: ${scriptPath}`);
  }

  const pythonCommand = resolvePythonCommand(workspaceRoot);
  const payload = JSON.stringify({ targetRoot: workspaceRoot, excludePaths: explicitExcludes });

  logger.appendLine(`[AI4PB] Running Python scanner: ${pythonCommand.command} ${pythonCommand.args.join(' ')}`);

  return new Promise<ArchitectureRealityModel>((resolve, reject) => {
    const child = spawn(pythonCommand.command, [...pythonCommand.args, scriptPath, '--target-root', workspaceRoot], {
      cwd: workspaceRoot,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('Python scanner timed out after 60s'));
    }, 60000);

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Python scanner failed with exit code ${code}: ${stderr.trim() || stdout.trim()}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as PythonScannerResponse;
        if (parsed.errors && parsed.errors.length > 0) {
          logger.appendLine(`[AI4PB] Python scanner completed with ${parsed.errors.length} non-fatal parse error(s).`);
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Python scanner returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`));
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}

// @ArchitectureID: 1275
function buildRealityModel(
  workspaceRoot: string,
  explicitExcludes: string[],
  fragments: ArchitectureRealityModel[]
): ArchitectureRealityModel {
  const elements = fragments.flatMap((fragment) => fragment.elements);
  const relationships = fragments.flatMap((fragment) => fragment.relationships);
  const views = fragments.flatMap((fragment) => fragment.views);

  views.push({
    view_id: 'reality:workspace-overview',
    view_name: 'Reality Workspace Overview',
    description: 'Aggregated reality view generated from TypeScript and Python scanner adapters.',
    included_elements: elements.map((element) => element.id),
    included_relationships: relationships.map((relationship) => relationship.id),
    extensions: {
      workspaceRoot,
      fragmentCount: fragments.length
    }
  });

  return {
    name: path.basename(workspaceRoot),
    description: 'Canonical reality model generated from repository source scanning.',
    elements,
    relationships,
    views,
    extensions: {
      explicitExcludes,
      defaultExcludes: DEFAULT_SCANNER_EXCLUDES,
      generatedAt: new Date().toISOString()
    }
  };
}

// @ArchitectureID: 1280
function reconcileArchitectureModels(
  intentModel: IntentArchitectureDocument,
  realityModel: ArchitectureRealityModel,
  intentModelPath: string,
  realityModelPath: string
): ReconciliationReport {
  const realityElementsByName = buildNameIndex(realityModel.elements);
  const realityRelationshipKeys = new Set(
    realityModel.relationships.map((relationship) => normalizeRelationshipKey(relationship.source_name, relationship.target_name, relationship.name))
  );

  const missingElements = intentModel.elements.filter((element) => !realityElementsByName.has(normalizeName(element.name)));
  const missingRelationships = intentModel.relationships.filter(
    (relationship) => !realityRelationshipKeys.has(normalizeRelationshipKey(relationship.source_name, relationship.target_name, relationship.name))
  );

  const intentNameIndex = buildNameIndex(intentModel.elements);
  const ignoredImplementationDetails: ArchitectureModelElement[] = [];
  const publicUnmodeledApis: ArchitectureModelElement[] = [];
  const orphanedPublicComponents: ArchitectureModelElement[] = [];
  const differenceList: DifferenceItem[] = [];

  for (const realityElement of realityModel.elements) {
    if (intentNameIndex.has(normalizeName(realityElement.name))) {
      continue;
    }

    const classification = classifyOrphanedElement(realityElement, realityModel.relationships);
    if (classification === 'ignored_private_detail') {
      ignoredImplementationDetails.push(realityElement);
      differenceList.push({
        kind: 'EXTRA_ELEMENT',
        severity: 'info',
        summary: `Ignored private implementation detail: ${realityElement.name}`,
        elementName: realityElement.name,
        filePath: realityElement.file_path,
        classification
      });
      continue;
    }

    if (classification === 'public_unmodeled_api') {
      publicUnmodeledApis.push(realityElement);
      differenceList.push({
        kind: 'EXTRA_ELEMENT',
        severity: 'warning',
        summary: `Public unmodeled API detected: ${realityElement.name}`,
        elementName: realityElement.name,
        filePath: realityElement.file_path,
        classification
      });
      continue;
    }

    orphanedPublicComponents.push(realityElement);
    differenceList.push({
      kind: 'EXTRA_ELEMENT',
      severity: 'warning',
      summary: `Orphaned public component detected: ${realityElement.name}`,
      elementName: realityElement.name,
      filePath: realityElement.file_path,
      classification
    });
  }

  for (const missingElement of missingElements) {
    differenceList.push({
      kind: 'MISSING_ELEMENT',
      severity: 'error',
      summary: `Intent element missing in reality scan: ${missingElement.name}`,
      elementName: missingElement.name
    });
  }

  for (const missingRelationship of missingRelationships) {
    differenceList.push({
      kind: 'MISSING_RELATIONSHIP',
      severity: 'error',
      summary: `Intent relationship missing in reality scan: ${missingRelationship.statement}`,
      relationshipStatement: missingRelationship.statement
    });
  }

  const matchedIntentElements = Math.max(intentModel.elements.length - missingElements.length, 0);
  const matchedIntentRelationships = Math.max(intentModel.relationships.length - missingRelationships.length, 0);
  const actionableOrphanedElements = publicUnmodeledApis.length + orphanedPublicComponents.length;
  const totalRealityElements = realityModel.elements.filter((element) => element.type !== 'SourceFile' && element.type !== 'PythonModule').length;

  const coverage = ratio(matchedIntentElements, intentModel.elements.length);
  const accuracy = ratio(matchedIntentRelationships, intentModel.relationships.length);
  const purity = totalRealityElements === 0 ? 1 : clamp01(1 - actionableOrphanedElements / totalRealityElements);
  const seamlessFitIndex = roundMetric(coverage * accuracy * purity);

  return {
    generatedAt: new Date().toISOString(),
    intentModelPath,
    realityModelPath,
    metrics: {
      coverage,
      accuracy,
      purity,
      seamlessFitIndex,
      totalIntentElements: intentModel.elements.length,
      totalIntentRelationships: intentModel.relationships.length,
      totalRealityElements,
      actionableOrphanedElements,
      matchedIntentElements,
      matchedIntentRelationships
    },
    missingElements,
    missingRelationships,
    ignoredImplementationDetails,
    publicUnmodeledApis,
    orphanedPublicComponents,
    differenceList
  };
}

// @ArchitectureID: 1280
function classifyOrphanedElement(
  element: ArchitectureModelElement,
  relationships: ArchitectureModelRelationship[]
): OrphanClassification {
  const normalizedPath = normalizeFilePath(element.file_path ?? '');
  const relatedCount = relationships.filter(
    (relationship) => relationship.source_id === element.id || relationship.target_id === element.id
  ).length;

  if (
    element.visibility === 'private' ||
    element.visibility === 'protected' ||
    element.name.startsWith('_') ||
    normalizedPath.includes('/internal/') ||
    normalizedPath.includes('/impl/') ||
    normalizedPath.includes('/helpers/') ||
    element.exported === false
  ) {
    return 'ignored_private_detail';
  }

  if (element.exported || element.visibility === 'public') {
    return relatedCount > 0 ? 'public_unmodeled_api' : 'orphaned_public_component';
  }

  return 'ignored_private_detail';
}

// @ArchitectureID: 1281
function renderGapMarkdown(report: ReconciliationReport): string {
  const lines: string[] = [
    '# ARCH_IMPL_GAP',
    '',
    `- Generated At: ${report.generatedAt}`,
    `- Intent Model: ${report.intentModelPath}`,
    `- Reality Model: ${report.realityModelPath}`,
    '',
    '## Raw Metrics',
    '',
    `- Coverage: ${formatMetric(report.metrics.coverage)}`,
    `- Accuracy: ${formatMetric(report.metrics.accuracy)}`,
    `- Purity: ${formatMetric(report.metrics.purity)}`,
    `- Seamless Fit Index: ${formatMetric(report.metrics.seamlessFitIndex ?? 0)}`,
    `- Total Intent Elements: ${report.metrics.totalIntentElements}`,
    `- Total Intent Relationships: ${report.metrics.totalIntentRelationships}`,
    `- Total Reality Elements: ${report.metrics.totalRealityElements}`,
    '',
    '## Missing Elements',
    ''
  ];

  if (report.missingElements.length === 0) {
    lines.push('- None');
  } else {
    for (const element of report.missingElements) {
      lines.push(`- ${element.name} (${element.type})`);
    }
  }

  lines.push('', '## Relationship Differences', '');
  if (report.missingRelationships.length === 0) {
    lines.push('- None');
  } else {
    for (const relationship of report.missingRelationships) {
      lines.push(`- ${relationship.statement}`);
    }
  }

  lines.push('', '## Ignored Implementation Details', '');
  if (report.ignoredImplementationDetails.length === 0) {
    lines.push('- None');
  } else {
    for (const element of report.ignoredImplementationDetails) {
      lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
    }
  }

  lines.push('', '## Public Unmodeled APIs', '');
  if (report.publicUnmodeledApis.length === 0) {
    lines.push('- None');
  } else {
    for (const element of report.publicUnmodeledApis) {
      lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
    }
  }

  lines.push('', '## Orphaned Public Components', '');
  if (report.orphanedPublicComponents.length === 0) {
    lines.push('- None');
  } else {
    for (const element of report.orphanedPublicComponents) {
      lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
    }
  }

  lines.push('', '## Difference List', '');
  if (report.differenceList.length === 0) {
    lines.push('- None');
  } else {
    for (const item of report.differenceList) {
      lines.push(`- [${item.severity.toUpperCase()}] ${item.summary}`);
    }
  }

  return lines.join('\n');
}

// @ArchitectureID: 1194
function readIntentArchitecture(architectureJsonPath: string): IntentArchitectureDocument {
  const raw = fs.readFileSync(architectureJsonPath, 'utf-8');
  const parsed = JSON.parse(raw) as Partial<IntentArchitectureDocument>;
  return {
    name: parsed.name ?? 'intent-model',
    description: parsed.description ?? '',
    elements: Array.isArray(parsed.elements) ? parsed.elements : [],
    relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
    views: Array.isArray(parsed.views) ? parsed.views : [],
    extensions: parsed.extensions
  };
}

// @ArchitectureID: 1277
function resolvePythonCommand(workspaceRoot: string): { command: string; args: string[] } {
  const windowsVenv = path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe');
  if (fs.existsSync(windowsVenv)) {
    return { command: windowsVenv, args: [] };
  }

  const unixVenv = path.join(workspaceRoot, '.venv', 'bin', 'python');
  if (fs.existsSync(unixVenv)) {
    return { command: unixVenv, args: [] };
  }

  return { command: process.platform === 'win32' ? 'python' : 'python3', args: [] };
}

// @ArchitectureID: 1280
function buildNameIndex(elements: ArchitectureModelElement[]): Map<string, ArchitectureModelElement> {
  const index = new Map<string, ArchitectureModelElement>();
  for (const element of elements) {
    const key = normalizeName(element.name);
    if (!index.has(key)) {
      index.set(key, element);
    }
  }
  return index;
}

// @ArchitectureID: 1280
function normalizeRelationshipKey(sourceName: string, targetName: string, relationName: string): string {
  return `${normalizeName(sourceName)}::${normalizeName(targetName)}::${normalizeName(relationName)}`;
}

// @ArchitectureID: 1280
function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}

// @ArchitectureID: 1280
function normalizeFilePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

// @ArchitectureID: 1280
function ratio(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 1;
  }
  return roundMetric(numerator / denominator);
}

// @ArchitectureID: 1280
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// @ArchitectureID: 1280
function roundMetric(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// @ArchitectureID: 1281
function formatMetric(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// @ArchitectureID: 1275
function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}