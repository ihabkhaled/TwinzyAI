# Skill: Modularize an Existing Library Usage

> Applies rules/10. Retrofit a wrapper (adapter/port) around a directly-used package so the
> vendor has one owning folder.

1. Find all direct imports (grep the package name across apps/ and packages/).
2. Build the wrapper with the minimal typed API the call sites actually need — api ->
   `adapters/` behind a port interface in `model/`; web -> `apps/web/src/lib/NAME/`. No
   vendor types across the boundary.
3. Migrate call sites to the wrapper; delete every direct import.
4. MANDATORY: add the package to `eslint/package-boundaries.config.mjs` (vendor -> owning
   folder) so `architecture/no-restricted-vendor-imports` / `no-raw-library-imports` fail
   lint on any regression.
5. Update memory/library-boundaries.md; test the wrapper's mapping and error translation.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
