import * as path from 'node:path';

import { LANGUAGE_WORKFLOW_REGISTRY, type LanguageWorkflowProfile } from './languageRegistry';
import type { LanguageSupport, StructuralSymbol } from './types';
import { pythonLanguageProvider } from './providers/python';
import { javaScriptLanguageProvider, typeScriptLanguageProvider } from './providers/typescript';
import type { RealityScannerLanguageProvider } from './providers/types';

const LANGUAGE_PROVIDERS: RealityScannerLanguageProvider[] = [
  typeScriptLanguageProvider,
  javaScriptLanguageProvider,
  pythonLanguageProvider,
];

const PROVIDERS_BY_LANGUAGE = new Map(LANGUAGE_PROVIDERS.map((provider) => [provider.languageId, provider]));

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

export function summarizeLanguageSupport(files: string[], symbols: StructuralSymbol[]): LanguageSupport[] {
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
      recommendedSkills: profile.recommendedSkills,
      recommendedTools: profile.recommendedTools,
    }))
    .filter((item) => item.fileCount > 0)
    .sort((left, right) => right.fileCount - left.fileCount || right.symbolCount - left.symbolCount);
}