import {
  classLikeMatcher,
  createTreeSitterLanguageProvider,
  functionMatcher,
  methodMatcher,
  namedNodeMatcher,
  propertyMatcher,
  variableMatcher,
} from './treeSitter';

// Runtime imports — tree-sitter grammars are CJS native, need dynamic import() in ESM context
const { default: C } = await import('tree-sitter-c');
const { default: Cpp } = await import('tree-sitter-cpp');

export const cLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'c',
  language: C,
  matchers: [
    namedNodeMatcher(['struct_specifier'], 'struct'),
    namedNodeMatcher(['enum_specifier'], 'enum'),
    namedNodeMatcher(['type_definition'], 'type'),
    functionMatcher(['function_definition']),
    variableMatcher(['declaration'], 'init_declarator'),
  ],
});

export const cppLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'cpp',
  language: Cpp,
  matchers: [
    classLikeMatcher(['class_specifier'], 'class'),
    namedNodeMatcher(['struct_specifier'], 'struct'),
    namedNodeMatcher(['enum_specifier'], 'enum'),
    namedNodeMatcher(['type_definition'], 'type'),
    functionMatcher(['function_definition']),
    methodMatcher(['function_definition']),
    propertyMatcher(['field_declaration'], 'field_declarator'),
    variableMatcher(['declaration'], 'init_declarator'),
  ],
});
