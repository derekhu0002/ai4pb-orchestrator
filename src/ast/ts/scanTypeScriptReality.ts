import * as path from 'path';
import { Project } from 'ts-morph';
import type {
  AlignmentLogger,
  ArchitectureModelElement,
  ArchitectureModelRelationship,
  ArchitectureModelView,
  ArchitectureRealityModel
} from '../../architectureRealityService';

const DEFAULT_TS_EXCLUDES = [
  'node_modules',
  'out',
  'dist',
  'coverage',
  '.venv',
  'TEMP',
  'design/intention_reality_audit'
];

// @ArchitectureID: 1276
export function scanTypeScriptReality(
  workspaceRoot: string,
  explicitExcludes: string[],
  logger: AlignmentLogger
): ArchitectureRealityModel {
  const project = new Project({
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      target: 8
    },
    skipAddingFilesFromTsConfig: true
  });

  project.addSourceFilesAtPaths([
    path.join(workspaceRoot, '**/*.ts'),
    path.join(workspaceRoot, '**/*.tsx'),
    path.join(workspaceRoot, '**/*.js'),
    path.join(workspaceRoot, '**/*.jsx')
  ]);

  const elements: ArchitectureModelElement[] = [];
  const relationships: ArchitectureModelRelationship[] = [];
  const views: ArchitectureModelView[] = [];
  const allExcluded = [...DEFAULT_TS_EXCLUDES, ...explicitExcludes].map(normalizePath);
  const includedElementIds: string[] = [];
  const includedRelationshipIds: string[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    const relativePath = path.relative(workspaceRoot, sourceFile.getFilePath()).replace(/\\/g, '/');
    if (isExcluded(relativePath, allExcluded)) {
      continue;
    }

    const fileId = `ts:file:${relativePath}`;
    const fileElement: ArchitectureModelElement = {
      id: fileId,
      name: relativePath,
      type: 'SourceFile',
      file_path: relativePath,
      source: 'typescript',
      visibility: 'public',
      exported: true,
      extensions: {
        language: 'typescript'
      }
    };
    elements.push(fileElement);
    includedElementIds.push(fileId);

    for (const classDeclaration of sourceFile.getClasses()) {
      pushDeclarationElement(
        elements,
        relationships,
        includedElementIds,
        includedRelationshipIds,
        fileElement,
        relativePath,
        `ts:class:${relativePath}:${classDeclaration.getName() ?? 'anonymous'}`,
        classDeclaration.getName() ?? 'anonymous',
        'Class',
        classDeclaration.isExported(),
        classDeclaration.hasModifier('export') ? 'public' : 'unknown'
      );
    }

    for (const functionDeclaration of sourceFile.getFunctions()) {
      pushDeclarationElement(
        elements,
        relationships,
        includedElementIds,
        includedRelationshipIds,
        fileElement,
        relativePath,
        `ts:function:${relativePath}:${functionDeclaration.getName() ?? 'anonymous'}`,
        functionDeclaration.getName() ?? 'anonymous',
        'Function',
        functionDeclaration.isExported(),
        'public'
      );
    }

    for (const interfaceDeclaration of sourceFile.getInterfaces()) {
      pushDeclarationElement(
        elements,
        relationships,
        includedElementIds,
        includedRelationshipIds,
        fileElement,
        relativePath,
        `ts:interface:${relativePath}:${interfaceDeclaration.getName()}`,
        interfaceDeclaration.getName(),
        'Interface',
        interfaceDeclaration.isExported(),
        'public'
      );
    }

    for (const enumDeclaration of sourceFile.getEnums()) {
      pushDeclarationElement(
        elements,
        relationships,
        includedElementIds,
        includedRelationshipIds,
        fileElement,
        relativePath,
        `ts:enum:${relativePath}:${enumDeclaration.getName()}`,
        enumDeclaration.getName(),
        'Enum',
        enumDeclaration.isExported(),
        'public'
      );
    }

    for (const typeAliasDeclaration of sourceFile.getTypeAliases()) {
      pushDeclarationElement(
        elements,
        relationships,
        includedElementIds,
        includedRelationshipIds,
        fileElement,
        relativePath,
        `ts:type:${relativePath}:${typeAliasDeclaration.getName()}`,
        typeAliasDeclaration.getName(),
        'TypeAlias',
        typeAliasDeclaration.isExported(),
        'public'
      );
    }

    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const resolved = importDeclaration.getModuleSpecifierSourceFile();
      if (!resolved) {
        continue;
      }
      const targetRelativePath = path.relative(workspaceRoot, resolved.getFilePath()).replace(/\\/g, '/');
      if (isExcluded(targetRelativePath, allExcluded)) {
        continue;
      }
      const relationshipId = `ts:import:${relativePath}->${targetRelativePath}`;
      relationships.push({
        id: relationshipId,
        statement: `${relativePath} --(ArchiMate_Access)--> ${targetRelativePath}`,
        name: 'ArchiMate_Access',
        super_type: 'ArchiMate_Access',
        source_id: fileId,
        target_id: `ts:file:${targetRelativePath}`,
        source_name: relativePath,
        target_name: targetRelativePath,
        description: 'Source file imports another source file.',
        extensions: {
          language: 'typescript',
          moduleSpecifier: importDeclaration.getModuleSpecifierValue()
        }
      });
      includedRelationshipIds.push(relationshipId);
    }
  }

  views.push({
    view_id: 'ts:reality-scan',
    view_name: 'TypeScript Reality Scan',
    description: 'TypeScript/JavaScript repository view generated via ts-morph.',
    included_elements: includedElementIds,
    included_relationships: includedRelationshipIds,
    extensions: {
      scanner: 'ts-morph'
    }
  });

  logger.appendLine(`[AI4PB] TypeScript scanner analyzed ${includedElementIds.length} element(s).`);

  return {
    name: 'typescript-reality',
    description: 'TypeScript scanner output.',
    elements,
    relationships,
    views,
    extensions: {
      explicitExcludes,
      defaultExcludes: DEFAULT_TS_EXCLUDES
    }
  };
}

// @ArchitectureID: 1276
function pushDeclarationElement(
  elements: ArchitectureModelElement[],
  relationships: ArchitectureModelRelationship[],
  includedElementIds: string[],
  includedRelationshipIds: string[],
  parentFile: ArchitectureModelElement,
  relativePath: string,
  id: string,
  name: string,
  type: string,
  exported: boolean,
  visibility: 'public' | 'protected' | 'private' | 'unknown'
): void {
  const element: ArchitectureModelElement = {
    id,
    name,
    type,
    file_path: relativePath,
    source: 'typescript',
    visibility,
    exported,
    extensions: {
      language: 'typescript'
    }
  };
  elements.push(element);
  includedElementIds.push(id);

  const relationshipId = `ts:contains:${parentFile.id}->${id}`;
  relationships.push({
    id: relationshipId,
    statement: `${parentFile.name} --(ArchiMate_Composition)--> ${name}`,
    name: 'ArchiMate_Composition',
    super_type: 'ArchiMate_Composition',
    source_id: parentFile.id,
    target_id: id,
    source_name: parentFile.name,
    target_name: name,
    description: 'Source file contains declaration.',
    extensions: {
      language: 'typescript'
    }
  });
  includedRelationshipIds.push(relationshipId);
}

// @ArchitectureID: 1276
function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase();
}

// @ArchitectureID: 1276
function isExcluded(relativePath: string, excludes: string[]): boolean {
  const normalizedPath = normalizePath(relativePath);
  return excludes.some((exclude) => normalizedPath === exclude || normalizedPath.startsWith(`${exclude}/`));
}

