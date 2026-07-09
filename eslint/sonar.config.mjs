import sonarjs from "eslint-plugin-sonarjs";

/**
 * SonarJS bug-detection and code-smell rules.
 */
export default [
  {
    ...sonarjs.configs.recommended,
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      ...sonarjs.configs.recommended.rules,
      "sonarjs/cognitive-complexity": ["error", 15],
      "sonarjs/no-duplicate-string": ["error", { threshold: 5 }],
    },
  },
];
