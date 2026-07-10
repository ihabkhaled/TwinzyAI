import js from "@eslint/js";

/**
 * Core JavaScript rules and clean-code size guardrails.
 */
export default [
  js.configs.recommended,
  {
    rules: {
      "no-console": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-nested-ternary": "error",
      "no-else-return": "error",
      "no-param-reassign": "error",
      "prefer-const": "error",
      "no-var": "error",
      "object-shorthand": "error",
      "max-lines": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
      "max-depth": ["error", 4],
      "max-params": ["error", 5],
      complexity: ["error", 12],
    },
  },
  {
    // NestJS composition roots inject collaborators via constructor
    // parameters; managers legitimately coordinate more than 5 services.
    // Documented in docs/eslint-architecture.md.
    files: ["apps/api/src/**/managers/*.ts", "apps/api/src/**/*.module.ts"],
    rules: {
      "max-params": ["error", 8],
    },
  },
  {
    // Focused application services read like short recipes. Use cases retain
    // the broader orchestration limit; services split mapping/validation into
    // named private methods or lib/domain helpers before they grow.
    files: ["apps/api/src/modules/**/application/*.service.ts"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 20, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // CLI scripts are Node programs and may write to stdout/stderr. A secret
    // scanner intentionally walks dynamic paths, so the non-literal filename
    // warning is a false positive for this specific script family.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
];
