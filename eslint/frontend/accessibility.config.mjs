/**
 * Strict accessibility rules: the jsx-a11y `strict` preset, layered on top of
 * the repo-wide jsx-a11y `recommended` set (eslint/react.config.mjs).
 *
 * Only the strict preset's RULES are applied here — the `jsx-a11y` plugin
 * namespace is already registered repo-wide in eslint/react.config.mjs, and
 * flat config forbids redefining the same plugin for an overlapping file set.
 *
 * STRANGLER-FIG SCOPE: the strict rules are applied only to the .tsx files of
 * the new canonical folders. Pre-migration JSX keeps the repo-wide recommended
 * level so it stays green.
 */

import jsxA11y from "eslint-plugin-jsx-a11y";

const FRONTEND_TSX_FILES = [
  "apps/web/src/modules/**/*.tsx",
  "apps/web/src/packages/**/*.tsx",
  "apps/web/src/shared/**/*.tsx",
];

export default [
  {
    files: FRONTEND_TSX_FILES,
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
    },
  },
];
