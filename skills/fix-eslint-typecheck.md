# Skill: Fix ESLint / Typecheck Failures

> Applies rules/11. Fix code, never rules.

1. Read the rule name; open its doc/definition (custom rules: eslint/architecture-plugin/rules).
2. Fix the design issue the rule points at (move logic to the right layer, extract types, etc.).
3. FORBIDDEN: eslint-disable, @ts-ignore, @ts-expect-error, loosening configs, any, !.
4. If a rule fires falsely, discuss and document in docs/eslint-architecture.md — config changes
   go through that file, never inline suppressions.
Gate: npm run lint && npm run typecheck
