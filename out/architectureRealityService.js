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
exports.runArchitectureRealityAlignment = runArchitectureRealityAlignment;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const scanTypeScriptReality_1 = require("./ast/ts/scanTypeScriptReality");
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
    'src/ast/py/__pycache__'
];
// @ArchitectureID: 1156
async function runArchitectureRealityAlignment(workspaceRoot, architectureJsonPath, logger, options = {}) {
    const explicitExcludes = uniqueStrings(options.explicitExcludes ?? []);
    const reportDir = path.join(workspaceRoot, 'design', 'intention_reality_audit');
    fs.mkdirSync(reportDir, { recursive: true });
    logger.appendLine('[AI4PB] Architecture reality alignment started.');
    const typescriptModel = (0, scanTypeScriptReality_1.scanTypeScriptReality)(workspaceRoot, explicitExcludes, logger);
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
async function scanPythonReality(workspaceRoot, explicitExcludes, logger) {
    const scriptPath = path.join(workspaceRoot, 'src', 'ast', 'py', 'scan_python_reality.py');
    if (!fs.existsSync(scriptPath)) {
        throw new Error(`Python scanner script not found: ${scriptPath}`);
    }
    const pythonCommand = resolvePythonCommand(workspaceRoot);
    const payload = JSON.stringify({ targetRoot: workspaceRoot, excludePaths: explicitExcludes });
    logger.appendLine(`[AI4PB] Running Python scanner: ${pythonCommand.command} ${pythonCommand.args.join(' ')}`);
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(pythonCommand.command, [...pythonCommand.args, scriptPath, '--target-root', workspaceRoot], {
            cwd: workspaceRoot,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('Python scanner timed out after 60s'));
        }, 60000);
        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString();
        });
        child.stderr.on('data', (chunk) => {
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
                const parsed = JSON.parse(stdout);
                if (parsed.errors && parsed.errors.length > 0) {
                    logger.appendLine(`[AI4PB] Python scanner completed with ${parsed.errors.length} non-fatal parse error(s).`);
                }
                resolve(parsed);
            }
            catch (error) {
                reject(new Error(`Python scanner returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
        child.stdin.write(payload);
        child.stdin.end();
    });
}
// @ArchitectureID: 1275
function buildRealityModel(workspaceRoot, explicitExcludes, fragments) {
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
function reconcileArchitectureModels(intentModel, realityModel, intentModelPath, realityModelPath) {
    const realityElementsByName = buildNameIndex(realityModel.elements);
    const realityRelationshipKeys = new Set(realityModel.relationships.map((relationship) => normalizeRelationshipKey(relationship.source_name, relationship.target_name, relationship.name)));
    const missingElements = intentModel.elements.filter((element) => !realityElementsByName.has(normalizeName(element.name)));
    const missingRelationships = intentModel.relationships.filter((relationship) => !realityRelationshipKeys.has(normalizeRelationshipKey(relationship.source_name, relationship.target_name, relationship.name)));
    const intentNameIndex = buildNameIndex(intentModel.elements);
    const ignoredImplementationDetails = [];
    const publicUnmodeledApis = [];
    const orphanedPublicComponents = [];
    const differenceList = [];
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
function classifyOrphanedElement(element, relationships) {
    const normalizedPath = normalizeFilePath(element.file_path ?? '');
    const relatedCount = relationships.filter((relationship) => relationship.source_id === element.id || relationship.target_id === element.id).length;
    if (element.visibility === 'private' ||
        element.visibility === 'protected' ||
        element.name.startsWith('_') ||
        normalizedPath.includes('/internal/') ||
        normalizedPath.includes('/impl/') ||
        normalizedPath.includes('/helpers/') ||
        element.exported === false) {
        return 'ignored_private_detail';
    }
    if (element.exported || element.visibility === 'public') {
        return relatedCount > 0 ? 'public_unmodeled_api' : 'orphaned_public_component';
    }
    return 'ignored_private_detail';
}
// @ArchitectureID: 1281
function renderGapMarkdown(report) {
    const lines = [
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
    }
    else {
        for (const element of report.missingElements) {
            lines.push(`- ${element.name} (${element.type})`);
        }
    }
    lines.push('', '## Relationship Differences', '');
    if (report.missingRelationships.length === 0) {
        lines.push('- None');
    }
    else {
        for (const relationship of report.missingRelationships) {
            lines.push(`- ${relationship.statement}`);
        }
    }
    lines.push('', '## Ignored Implementation Details', '');
    if (report.ignoredImplementationDetails.length === 0) {
        lines.push('- None');
    }
    else {
        for (const element of report.ignoredImplementationDetails) {
            lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
        }
    }
    lines.push('', '## Public Unmodeled APIs', '');
    if (report.publicUnmodeledApis.length === 0) {
        lines.push('- None');
    }
    else {
        for (const element of report.publicUnmodeledApis) {
            lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
        }
    }
    lines.push('', '## Orphaned Public Components', '');
    if (report.orphanedPublicComponents.length === 0) {
        lines.push('- None');
    }
    else {
        for (const element of report.orphanedPublicComponents) {
            lines.push(`- ${element.name}${element.file_path ? ` (${element.file_path})` : ''}`);
        }
    }
    lines.push('', '## Difference List', '');
    if (report.differenceList.length === 0) {
        lines.push('- None');
    }
    else {
        for (const item of report.differenceList) {
            lines.push(`- [${item.severity.toUpperCase()}] ${item.summary}`);
        }
    }
    return lines.join('\n');
}
// @ArchitectureID: 1194
function readIntentArchitecture(architectureJsonPath) {
    const raw = fs.readFileSync(architectureJsonPath, 'utf-8');
    const parsed = JSON.parse(raw);
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
function resolvePythonCommand(workspaceRoot) {
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
function buildNameIndex(elements) {
    const index = new Map();
    for (const element of elements) {
        const key = normalizeName(element.name);
        if (!index.has(key)) {
            index.set(key, element);
        }
    }
    return index;
}
// @ArchitectureID: 1280
function normalizeRelationshipKey(sourceName, targetName, relationName) {
    return `${normalizeName(sourceName)}::${normalizeName(targetName)}::${normalizeName(relationName)}`;
}
// @ArchitectureID: 1280
function normalizeName(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}
// @ArchitectureID: 1280
function normalizeFilePath(filePath) {
    return filePath.replace(/\\/g, '/').toLowerCase();
}
// @ArchitectureID: 1280
function ratio(numerator, denominator) {
    if (denominator <= 0) {
        return 1;
    }
    return roundMetric(numerator / denominator);
}
// @ArchitectureID: 1280
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
// @ArchitectureID: 1280
function roundMetric(value) {
    return Math.round(value * 10000) / 10000;
}
// @ArchitectureID: 1281
function formatMetric(value) {
    return `${(value * 100).toFixed(2)}%`;
}
// @ArchitectureID: 1275
function uniqueStrings(values) {
    return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}
//# sourceMappingURL=architectureRealityService.js.map