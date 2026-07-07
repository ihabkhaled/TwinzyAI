/**
 * Small-components rule: presentational component and container files must stay
 * small and single-responsibility. When a file or a render function grows past
 * these limits, split it into smaller sub-components / sub-containers instead of
 * letting a god-component accrete. This is the mechanical half of the
 * "always split components into small chunks" rule (rules/frontend/02).
 *
 * Limits are deliberately tighter than the repo-wide base (300 / 80): a
 * component is a small unit of composition, so 130 file lines and 60 lines per
 * function force decomposition long before a screen becomes unreadable.
 */
export const COMPONENT_SIZE_FILES = [
  "apps/web/src/**/*.component.tsx",
  "apps/web/src/**/*.container.tsx",
];

export default [
  {
    files: COMPONENT_SIZE_FILES,
    rules: {
      "max-lines": [
        "error",
        { max: 130, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "error",
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      "react/jsx-max-depth": ["error", { max: 6 }],
    },
  },
];
