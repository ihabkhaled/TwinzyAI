# ESLint Architecture

Flat config split by concern under /eslint, composed in eslint/index.mjs (prettier last), root
eslint.config.mjs re-exports it. Custom plugin: eslint/architecture-plugin.mjs with rules:
controller-no-logic, manager-layer-boundaries, no-restricted-layer-imports,
no-inline-domain-definitions, no-direct-sdk-imports, no-direct-env-access,
no-raw-library-imports, tsx-pure-composition, repository-persistence-only.

Documented relaxations (evaluated, not blind):
- security/detect-object-injection OFF — near-100% false positives on typed code.
- unicorn/prevent-abbreviations OFF — wholesale renames (props/env/params) harm readability.
- unicorn/no-null OFF — React/DOM APIs use null. unicorn/prefer-top-level-await OFF — CJS api.
- import-x/no-unresolved not enabled — TypeScript owns module resolution.
- sonarjs cognitive-complexity raised to 15; duplicate-string threshold 5.

Plugin compatibility decisions: ESLint pinned to the 9.x maintenance line because
eslint-plugin-react and eslint-plugin-jsx-a11y do not yet declare ESLint 10 support;
eslint-plugin-unicorn pinned to v63 (last 9.x-compatible). Revisit when peers widen.
