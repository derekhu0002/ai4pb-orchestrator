import type { StructuralSource, StructuralSymbol } from '../types';

export type RealityScannerLanguageProvider = {
  languageId: string;
  extractionMode: StructuralSource;
  extractSymbols: (relativeFile: string, content: string, worktree?: string) => StructuralSymbol[];
};