# Skill: Modularize an Existing Library Usage

> Applies rules/10. Retrofit a wrapper around a directly-used package.

1. Find all direct imports (grep the package name).
2. Build the wrapper module with the minimal API the call sites actually need.
3. Migrate call sites to the wrapper; delete direct imports.
4. Add the package to policy-utils.mjs banned lists; lint must fail on any regression.
5. Update memory/library-boundaries.md.
Gate: npm run lint && npm run typecheck && npm run test:unit && npm run build
