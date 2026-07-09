import vitest from "@vitest/eslint-plugin";
import playwright from "eslint-plugin-playwright";
import testingLibrary from "eslint-plugin-testing-library";

const TEST_FILES = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.test.mjs",
  "**/tests/**/*.ts",
  "**/tests/**/*.tsx",
];

/**
 * Test-file rules: Vitest hygiene everywhere, Testing Library for web
 * component tests, Playwright for e2e. Size limits are relaxed because
 * describe blocks are naturally long.
 */
export default [
  {
    files: TEST_FILES,
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      "vitest/no-disabled-tests": "error",
      "vitest/no-focused-tests": "error",
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "expectRejection",
            "expectDomainRejection",
            "expectErrorCode",
          ],
        },
      ],
      "max-lines-per-function": "off",
      "max-lines": [
        "error",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      "sonarjs/no-duplicate-string": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      // Test doubles (vi.fn mocks, spies, stub fixtures) are intentionally
      // loosely typed and are referenced as values when asserting on calls.
      // These type-safety rules are for production code; in tests they only
      // produce false positives on mock method references and mock.calls
      // payloads. Relaxed for test files only — production stays fully strict.
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
  {
    files: ["apps/web/src/**/*.test.tsx", "apps/web/src/tests/**/*.tsx"],
    plugins: { "testing-library": testingLibrary },
    rules: {
      ...testingLibrary.configs["flat/react"].rules,
    },
  },
  {
    files: ["apps/web/e2e/**/*.ts"],
    plugins: { playwright },
    rules: {
      ...playwright.configs["flat/recommended"].rules,
      "max-lines-per-function": "off",
      "@typescript-eslint/no-magic-numbers": "off",
    },
  },
];
