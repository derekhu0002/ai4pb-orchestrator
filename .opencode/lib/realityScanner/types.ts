import type { EnvironmentProfile } from './environmentRegistry';

export type TraceSource = 'comment' | 'mapping-path' | 'mapping-glob' | 'mapping-symbol';

export type StructuralSource = 'ast' | 'regex';

export type ArchitectureReference = {
  file: string;
  architectureId: string;
  line: number;
  snippet: string;
  source: TraceSource;
  symbolName?: string;
  mappingFile?: string;
};

export type StructuralSymbol = {
  file: string;
  line: number;
  kind: string;
  name: string;
  signature: string;
  snippet: string;
  source: StructuralSource;
  languageId: string;
};

export type SemanticCandidate = {
  architectureId: string;
  title: string;
  elementType: string;
  score: number;
  documentationSnippet: string;
};

export type SemanticTrace = {
  file: string;
  line: number;
  kind: string;
  symbolName: string;
  signature: string;
  languageId: string;
  candidates: SemanticCandidate[];
};

export type LanguageSupport = {
  languageId: string;
  displayName: string;
  fileExtensions: string[];
  extractionMode: StructuralSource | 'ast-heuristic';
  fileCount: number;
  symbolCount: number;
  recommendedSkills: string[];
  recommendedTools: string[];
};

export type MappingFileSummary = {
  file: string;
  format: 'json' | 'yaml';
  mappingCount: number;
};

export type ScanResult = {
  fileCount: number;
  extensionCounts: Record<string, number>;
  architectureReferences: ArchitectureReference[];
  verifiedIntentIds: string[];
  structuralSymbols: StructuralSymbol[];
  semanticTraces: SemanticTrace[];
  languageSupport: LanguageSupport[];
  detectedEnvironments: EnvironmentProfile[];
  mappingFiles: MappingFileSummary[];
  mappingWarnings: string[];
  sampleFiles: string[];
};