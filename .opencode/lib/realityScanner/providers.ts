import * as fs from 'node:fs';
import * as path from 'node:path';

import { LANGUAGE_WORKFLOW_REGISTRY, type LanguageWorkflowProfile } from './languageRegistry';
import type { LanguageSupport, StructuralSymbol } from './types';
import { cLanguageProvider, cppLanguageProvider } from './providers/native';
import { csharpLanguageProvider, goLanguageProvider, javaLanguageProvider } from './providers/polyglot';
import { kotlinLanguageProvider } from './providers/kotlin';
import { pythonLanguageProvider } from './providers/python';
import { javaScriptLanguageProvider, typeScriptLanguageProvider } from './providers/typescript';
import type { RealityScannerLanguageProvider } from './providers/types';

const LANGUAGE_PROVIDERS: RealityScannerLanguageProvider[] = [
  typeScriptLanguageProvider,
  javaScriptLanguageProvider,
  pythonLanguageProvider,
  javaLanguageProvider,
  goLanguageProvider,
  csharpLanguageProvider,
  kotlinLanguageProvider,
  cLanguageProvider,
  cppLanguageProvider,
];

const PROVIDERS_BY_LANGUAGE = new Map(LANGUAGE_PROVIDERS.map((provider) => [provider.languageId, provider]));
const PROJECT_STANDARDS_FILE = path.join('.opencode', 'project-standards.json');

type ProjectStandardsConfig = Record<string, string[]>;

export function getRealityScannerLanguageProviders(): RealityScannerLanguageProvider[] {
  return [...LANGUAGE_PROVIDERS];
}

export function findLanguageWorkflowProfile(relativeFile: string): LanguageWorkflowProfile | undefined {
  const extension = path.extname(relativeFile).toLowerCase();
  return LANGUAGE_WORKFLOW_REGISTRY.find((profile) => profile.fileExtensions.includes(extension));
}

export function findRealityScannerLanguageProvider(relativeFile: string): RealityScannerLanguageProvider | undefined {
  const profile = findLanguageWorkflowProfile(relativeFile);
  if (!profile) {
    return undefined;
  }
  return PROVIDERS_BY_LANGUAGE.get(profile.languageId);
}

export function extractStructuralSymbolsForFile(relativeFile: string, content: string, worktree?: string): StructuralSymbol[] {
  const provider = findRealityScannerLanguageProvider(relativeFile);
  if (!provider) {
    return [];
  }

  return provider.extractSymbols(relativeFile, content, worktree);
}

function loadProjectStandards(worktree?: string): ProjectStandardsConfig {
  if (!worktree) {
    return {};
  }

  const configPath = path.join(worktree, PROJECT_STANDARDS_FILE);
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as { languages?: unknown };
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    const languages = parsed.languages;
    if (!languages || typeof languages !== 'object' || Array.isArray(languages)) {
      return {};
    }

    const standards: ProjectStandardsConfig = {};
    for (const [languageId, skills] of Object.entries(languages as Record<string, unknown>)) {
      const normalizedLanguageId = languageId.trim();
      if (!normalizedLanguageId || !Array.isArray(skills)) {
        continue;
      }

      const normalizedSkills = [...new Set(skills.map((skill) => String(skill ?? '').trim()).filter(Boolean))];
      if (normalizedSkills.length > 0) {
        standards[normalizedLanguageId] = normalizedSkills;
      }
    }

    return standards;
  } catch {
    return {};
  }
}

function mergeRecommendedSkills(defaultSkills: string[], projectSkills: string[]): string[] {
  return [...new Set([...defaultSkills, ...projectSkills])];
}

export function summarizeLanguageSupport(files: string[], symbols: StructuralSymbol[], worktree?: string): LanguageSupport[] {
  const projectStandards = loadProjectStandards(worktree);
  const fileCountByLanguage = new Map<string, number>();
  for (const file of files) {
    const profile = findLanguageWorkflowProfile(file);
    if (!profile) {
      continue;
    }

    fileCountByLanguage.set(profile.languageId, (fileCountByLanguage.get(profile.languageId) ?? 0) + 1);
  }

  const symbolCountByLanguage = new Map<string, number>();
  for (const symbol of symbols) {
    symbolCountByLanguage.set(symbol.languageId, (symbolCountByLanguage.get(symbol.languageId) ?? 0) + 1);
  }

  return LANGUAGE_WORKFLOW_REGISTRY
    .map((profile) => ({
      languageId: profile.languageId,
      displayName: profile.displayName,
      fileExtensions: profile.fileExtensions,
      extractionMode: PROVIDERS_BY_LANGUAGE.get(profile.languageId)?.extractionMode ?? 'regex',
      fileCount: fileCountByLanguage.get(profile.languageId) ?? 0,
      symbolCount: symbolCountByLanguage.get(profile.languageId) ?? 0,
      recommendedSkills: mergeRecommendedSkills(profile.recommendedSkills, projectStandards[profile.languageId] ?? []),
      recommendedTools: profile.recommendedTools,
    }))
    .filter((item) => item.fileCount > 0)
    .sort((left, right) => right.fileCount - left.fileCount || right.symbolCount - left.symbolCount);
}