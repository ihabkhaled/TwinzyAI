import promise from 'eslint-plugin-promise';

/**
 * Promise correctness rules.
 */
export default [
  {
    ...promise.configs['flat/recommended'],
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
  },
];
