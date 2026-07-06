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
      // Incomplete parallel frontend-anatomy migration WIP: untracked, not
      // wired into the app, excluded from all gates until finished (also
      // excluded in apps/web/tsconfig.json and vitest.config.ts).
      // See docs/final-validation-report.md.
      ".migration-wip/**",
      "apps/web/src/shared/**",
      "apps/web/src/packages/**",
      "apps/web/src/modules/**",
    ],
  },
];
