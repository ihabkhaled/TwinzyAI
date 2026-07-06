import eslintComments from "@eslint-community/eslint-plugin-eslint-comments";

/**
 * Absolute, no-exception ban on inline ESLint suppression.
 *
 * Writing `eslint-disable`, `eslint-disable-line`, `eslint-disable-next-line`,
 * or `eslint-enable` anywhere is a hard error — there is no documented-exception
 * escape hatch and no "clean it up later". A rule firing means the code is wrong
 * or lives in the wrong layer: fix the root cause or move the code. Suppressing
 * the messenger is forbidden.
 *
 * `reportUnusedDisableDirectives: 'error'` is belt-and-suspenders: even if a
 * directive slipped past review it can never silently rot.
 *
 * (`@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` are separately and equally
 * banned by `@typescript-eslint/ban-ts-comment` in typescript.config.mjs.)
 */
export default [
  {
    plugins: { "eslint-comments": eslintComments },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "eslint-comments/no-use": "error",
    },
  },
];
