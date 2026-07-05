import importX, { createNodeResolver } from 'eslint-plugin-import-x';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * Import hygiene: sorted groups, no duplicates, no cycles, no dead imports.
 * Module resolution correctness is TypeScript's job (no-unresolved off).
 */
export default [
  {
    plugins: {
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    settings: {
      'import-x/resolver-next': [createNodeResolver()],
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^node:'],
            [String.raw`^@?\w`],
            ['^@twinzy/'],
            ['^@/'],
            [String.raw`^\.\.`],
            [String.raw`^\.`],
            [String.raw`\.css$`],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-cycle': ['error', { maxDepth: 4 }],
    },
  },
];
