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
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'java',
    displayName: 'Java',
    fileExtensions: ['.java'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop', 'android-qa-debugging-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph', 'generate_test_template'],
  },
  {
    languageId: 'go',
    displayName: 'Go',
    fileExtensions: ['.go'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'csharp',
    displayName: 'C#',
    fileExtensions: ['.cs'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'kotlin',
    displayName: 'Kotlin',
    fileExtensions: ['.kt', '.kts'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop', 'android-qa-debugging-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph', 'generate_test_template'],
  },
  {
    languageId: 'c',
    displayName: 'C',
    fileExtensions: ['.c', '.h'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
  {
    languageId: 'cpp',
    displayName: 'C++',
    fileExtensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.hh'],
    recommendedSkills: ['polyglot-backend-standards', 'verification-loop'],
    recommendedTools: ['run_reality_scanner', 'query_graph'],
  },
];