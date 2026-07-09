import unicorn from "eslint-plugin-unicorn";

/**
 * Unicorn rules. Relaxations (documented in docs/eslint-architecture.md):
 * - prevent-abbreviations + its v71 successor name-replacements: rename
 *   env/props/params wholesale — too destructive
 * - no-null: React and DOM APIs use null by design
 * - prefer-top-level-await: the API entrypoint is CommonJS
 * - consistent-boolean-name: boolean naming is governed by the repo naming
 *   rules (is/has/can/should) — the unicorn variant conflicts with domain
 *   names like 'ok', 'aborted', 'clean'
 * - consistent-class-member-order: member order follows the layer templates
 *   (constructor-after-fields for Nest DI); wholesale reordering is churn
 * - prefer-await: fire-and-safe detached promises (shadow runs, void chains)
 *   legitimately use .catch(); async discipline is owned by plugin:promise
 * - no-non-function-verb-prefix: Nest use-case DI fields are named after their
 *   class (createXUseCase) and *Label props carry verb-shaped copy keys —
 *   naming is owned by the repo naming rules
 * - isolated-functions (e2e only): Playwright page.evaluate callbacks execute
 *   in the BROWSER where document/getComputedStyle are globals
 * - max-nested-calls (tests only): expect(...) around builders/Array.from is
 *   idiomatic assertion style
 * - top-level side effects/assignment (scripts + vitest setup only): CLI
 *   entrypoints and the test-setup shim are side-effect programs by design
 */
export default [
  {
    ...unicorn.configs.recommended,
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs"],
    rules: {
      ...unicorn.configs.recommended.rules,
      "unicorn/prevent-abbreviations": "off",
      "unicorn/name-replacements": "off",
      "unicorn/consistent-boolean-name": "off",
      "unicorn/consistent-class-member-order": "off",
      "unicorn/prefer-await": "off",
      "unicorn/no-non-function-verb-prefix": "off",
      "unicorn/no-null": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/filename-case": [
        "error",
        {
          cases: { kebabCase: true, pascalCase: true },
          // Next.js dynamic route segments keep their param name ([shareId]).
          ignore: [/^\[.+\]$/],
        },
      ],
    },
  },
  {
    // React hooks are conventionally camelCase (useXxx.ts) — mandated by the
    // frontend architecture spec. kebab-case stays allowed because unicorn 71
    // checks parent DIRECTORY names too (modules/ui-preferences/hooks/...).
    files: ["**/hooks/use*.ts", "**/hooks/use*.tsx"],
    rules: {
      "unicorn/filename-case": [
        "error",
        { cases: { camelCase: true, kebabCase: true } },
      ],
    },
  },
  {
    // Playwright evaluate callbacks run in the browser context.
    files: ["apps/web/e2e/**"],
    rules: {
      "unicorn/isolated-functions": "off",
    },
  },
  {
    // Assertion style in tests: expect() wrapping builders is idiomatic, and
    // negative-case fixtures legitimately carry insecure inputs (http URLs).
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.test.mjs", "**/tests/**"],
    rules: {
      "unicorn/max-nested-calls": "off",
      "unicorn/prefer-https": "off",
    },
  },
  {
    // CLI scripts and the vitest setup file are side-effect programs by design.
    files: ["scripts/**", "apps/web/src/tests/setup.ts"],
    rules: {
      "unicorn/no-top-level-side-effects": "off",
      "unicorn/no-top-level-assignment-in-function": "off",
    },
  },
];
