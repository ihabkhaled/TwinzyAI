import unicorn from 'eslint-plugin-unicorn';

/**
 * Unicorn rules. Relaxations (documented in docs/eslint-architecture.md):
 * - prevent-abbreviations: renames env/props/params wholesale — too destructive
 * - no-null: React and DOM APIs use null by design
 * - prefer-top-level-await: the API entrypoint is CommonJS
 */
export default [
  {
    ...unicorn.configs.recommended,
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    rules: {
      ...unicorn.configs.recommended.rules,
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/filename-case': [
        'error',
        { cases: { kebabCase: true, pascalCase: true } },
      ],
    },
  },
];
