import {
  classLikeMatcher,
  createTreeSitterLanguageProvider,
  functionMatcher,
  identifierListVariableMatcher,
  methodMatcher,
  namedNodeMatcher,
  propertyMatcher,
  variableMatcher,
} from './treeSitter';

// Runtime imports — tree-sitter grammars are CJS native, need dynamic import() in ESM context
const { default: CSharp } = await import('tree-sitter-c-sharp');
const { default: Go } = await import('tree-sitter-go');
const { default: Java } = await import('tree-sitter-java');

export const javaLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'java',
  language: Java,
  matchers: [
    classLikeMatcher(['class_declaration'], 'class'),
    classLikeMatcher(['interface_declaration'], 'interface'),
    classLikeMatcher(['enum_declaration'], 'enum'),
    methodMatcher(['method_declaration']),
    methodMatcher(['constructor_declaration'], { constructor: true }),
    propertyMatcher(['field_declaration'], 'variable_declarator'),
  ],
});

export const goLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'go',
  language: Go,
  matchers: [
    namedNodeMatcher(['type_spec'], 'type'),
    functionMatcher(['function_declaration']),
    methodMatcher(['method_declaration']),
    variableMatcher(['var_declaration', 'const_declaration'], 'var_spec'),
    identifierListVariableMatcher(['short_var_declaration']),
  ],
});

export const csharpLanguageProvider = createTreeSitterLanguageProvider({
  languageId: 'csharp',
  language: CSharp,
  matchers: [
    classLikeMatcher(['class_declaration'], 'class'),
    classLikeMatcher(['interface_declaration'], 'interface'),
    classLikeMatcher(['struct_declaration'], 'struct'),
    classLikeMatcher(['enum_declaration'], 'enum'),
    classLikeMatcher(['record_declaration'], 'record'),
    methodMatcher(['method_declaration']),
    methodMatcher(['constructor_declaration'], { constructor: true }),
    propertyMatcher(['property_declaration'], 'identifier'),
    propertyMatcher(['field_declaration'], 'variable_declarator'),
  ],
});