/**
 * Global ignore list. Build output, dependency folders, and generated
 * files are never linted.
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/playwright-report/**",
      "**/test-results/**",
      "**/*.tsbuildinfo",
      "apps/web/next-env.d.ts",
      "apps/web/public/**",
      ".husky/**",
      ".claude/**",
      // Scratch dir for any throwaway migration experiments; never linted.
      ".migration-wip/**",
    ],
  },
];
