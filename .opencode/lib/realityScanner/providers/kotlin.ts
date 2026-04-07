import {
  classLikeMatcher,
  createTreeSitterLanguageProvider,
  functionMatcher,
  methodMatcher,
  propertyMatcher,
} from './treeSitter';

// tree-sitter-kotlin is a CJS native module without type declarations
// @ts-ignore — no @types/tree-sitter-kotlin available
const { default: Kotlin } = await import('tree-sitter-kotlin');

export const kotlinLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'kotlin',
  language: Kotlin,
  matchers: [
    classLikeMatcher(['class_declaration'], 'class'),
    classLikeMatcher(['object_declaration'], 'class'),
    functionMatcher(['function_declaration']),
    methodMatcher(['function_declaration']),
    propertyMatcher(['property_declaration'], 'variable_declarator'),
  ],
});
