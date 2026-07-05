import js from '@eslint/js';

/**
 * Core JavaScript rules and clean-code size guardrails.
 */
export default [
  js.configs.recommended,
  {
    rules: {
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-nested-ternary': 'error',
      'no-else-return': 'error',
      'no-param-reassign': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 4],
      'max-params': ['error', 5],
      complexity: ['error', 12],
    },
  },
  {
    // NestJS composition roots inject collaborators via constructor
    // parameters; managers legitimately coordinate more than 5 services.
    // Documented in docs/eslint-architecture.md.
    files: ['apps/api/src/**/managers/*.ts', 'apps/api/src/**/*.module.ts'],
    rules: {
      'max-params': ['error', 8],
    },
  },
];
