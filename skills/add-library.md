# Skill: Add a Library

> Applies rules/10. Every library is wrapped behind a port; each vendor has exactly ONE
> owning folder; swapping = one folder.

1. Vet before install: maintenance health, CVEs (`npm run audit` / `npm run security:scan`),
   license, transitive count.
2. Document the decision in docs/package-decisions.md (chosen + rejected alternatives).
3. Install with a caret range in the right workspace; commit the lockfile change.
4. Create the wrapper (adapter/port pattern):
   - api -> port interface in the owning module's `model/` + implementation in `adapters/`;
   - web -> `apps/web/src/lib/NAME/`.
   Expose a small typed API shaped by what call sites need; never leak vendor types across
   the port.
5. MANDATORY: register the package in `eslint/package-boundaries.config.mjs`, mapping the
   vendor to its single owning folder. Without this entry
   `architecture/no-restricted-vendor-imports` / `no-raw-library-imports` cannot ban direct
   imports, and the wrapper is decorative.
6. Record ownership in memory/library-boundaries.md.
7. Test the wrapper: mapping, error translation to `AppError`s (api), timeout behavior.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
