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
    // Local operator-owned CLI tools intentionally read/write paths supplied
    // on their own command line. They are never reachable from HTTP or user
    // payloads; dynamic filenames are the tool contract, not an injection path.
    files: [
      "apps/api/src/benchmark/benchmark-real-runner.ts",
      "apps/api/src/benchmark/benchmark.main.ts",
      "scripts/calibrate.mjs",
    ],
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
  {
    // The knowledge compiler's whole contract is walking the repository and
    // compiling authored knowledge/*.yaml definitions: dynamic repo-relative
    // paths and authored regex patterns are its inputs by design, and it is a
    // local/CI dev tool never reachable from HTTP or untrusted request data.
    // detect-unsafe-regex stays covered by the more precise regexp plugin
    // (error level). Documented in docs/eslint-architecture.md.
    files: ["scripts/knowledge/**/*.mjs"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "off",
      "security/detect-possible-timing-attacks": "off",
    },
  },
  {
    // The knowledge resolver shells out to exactly one fixed command
    // (`git diff --name-only <range>`) via execFileSync with a hardcoded
    // argument vector; the range comes from the operator's own CLI flag and
    // never from HTTP or user payloads. Documented in docs/eslint-architecture.md.
    files: ["scripts/knowledge/lib/git.mjs"],
    rules: {
      "security/detect-child-process": "off",
    },
  },
];
