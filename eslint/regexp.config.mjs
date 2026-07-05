import * as regexp from 'eslint-plugin-regexp';

/**
 * Regular expression correctness and safety rules (includes catastrophic
 * backtracking detection).
 */
export default [
  {
    ...regexp.configs['flat/recommended'],
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
  },
];
