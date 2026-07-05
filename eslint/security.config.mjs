import security from 'eslint-plugin-security';

/**
 * Node security rules. `detect-object-injection` is disabled: it flags
 * every computed property access and produces near-100% false positives in
 * typed code (decision documented in docs/eslint-architecture.md).
 */
export default [
  {
    ...security.configs.recommended,
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    rules: {
      ...security.configs.recommended.rules,
      'security/detect-object-injection': 'off',
    },
  },
  {
    // The prompt loader resolves files from a hardcoded candidate list and
    // a constant key→filename map — no user input can reach the path.
    // Documented in docs/eslint-architecture.md.
    files: ['apps/api/src/modules/ai/prompts/prompt-loader.service.ts'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
    },
  },
];
