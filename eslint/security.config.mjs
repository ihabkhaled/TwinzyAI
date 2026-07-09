import security from "eslint-plugin-security";

/**
 * Node security rules. `detect-object-injection` is disabled: it flags
 * every computed property access and produces near-100% false positives in
 * typed code (decision documented in docs/eslint-architecture.md).
 */
export default [
  {
    ...security.configs.recommended,
    files: ["**/*.ts", "**/*.tsx", "**/*.mjs"],
    rules: {
      ...security.configs.recommended.rules,
      "security/detect-object-injection": "off",
    },
  },
  {
    // The prompt-template repository resolves files from a hardcoded candidate
    // list and a constant key→filename map — no user input can reach the path.
    // Documented in docs/eslint-architecture.md.
    files: [
      "apps/api/src/modules/ai/infrastructure/prompt-template.repository.ts",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    // The vendor-boundary policy engine compiles regexes from the static
    // pattern lists in eslint/package-boundaries.config.mjs — no user input
    // can reach the RegExp constructor. Documented in docs/eslint-architecture.md.
    files: ["eslint/architecture-plugin/shared/policy-utils.mjs"],
    rules: {
      "security/detect-non-literal-regexp": "off",
    },
  },
  {
    // Secret scanner intentionally walks the repository and reads files from a
    // dynamically-built set; the paths are derived from a trusted root and
    // never from user input.
    files: ["scripts/scan-secrets.mjs"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    // E2E tests create transient fixture files under project-controlled paths
    // (e.g., `test-results/`). Paths are built from `__dirname` and never from
    // user input, so the non-literal-filename warning is a false positive.
    files: ["apps/web/e2e/**/*.spec.ts"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
];
