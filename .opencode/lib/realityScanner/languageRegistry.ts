export type LanguageWorkflowProfile = {
  languageId: string;
  displayName: string;
  fileExtensions: string[];
  recommendedSkills: string[];
  recommendedTools: string[];
};

export const LANGUAGE_WORKFLOW_REGISTRY: LanguageWorkflowProfile[] = [
  {
    languageId: 'typescript',
    displayName: 'TypeScript',
    fileExtensions: ['.ts', '.tsx'],
    recommendedSkills: ['coding-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'javascript',
    displayName: 'JavaScript',
    fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    recommendedSkills: ['coding-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'python',
    displayName: 'Python',
    fileExtensions: ['.py'],
    recommendedSkills: ['verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
];