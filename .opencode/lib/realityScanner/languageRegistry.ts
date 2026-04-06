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
  {
    languageId: 'java',
    displayName: 'Java',
    fileExtensions: ['.java'],
    recommendedSkills: ['verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'go',
    displayName: 'Go',
    fileExtensions: ['.go'],
    recommendedSkills: ['verification-loop', 'api-design'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'csharp',
    displayName: 'C#',
    fileExtensions: ['.cs'],
    recommendedSkills: ['verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
];