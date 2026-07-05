import architecturePlugin from './architecture-plugin.mjs';

/**
 * Applies the custom architecture rules. Every rule is an error — the
 * architecture is non-negotiable and never weakened to make code pass.
 */
export default [
  {
    files: ['apps/**/*.ts', 'apps/**/*.tsx', 'packages/**/*.ts'],
    plugins: {
      architecture: architecturePlugin,
    },
    rules: {
      'architecture/controller-no-logic': 'error',
      'architecture/manager-layer-boundaries': 'error',
      'architecture/no-restricted-layer-imports': 'error',
      'architecture/no-inline-domain-definitions': 'error',
      'architecture/no-direct-sdk-imports': 'error',
      'architecture/no-direct-env-access': 'error',
      'architecture/no-raw-library-imports': 'error',
      'architecture/tsx-pure-composition': 'error',
      'architecture/repository-persistence-only': 'error',
    },
  },
];
