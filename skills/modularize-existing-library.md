# Skill: Modularize an Existing Library Usage

Retrofit a single owning wrapper around a vendor that is currently imported ad hoc, so it has one
owning folder and the raw import is fenced off forever. This is the *existing-dependency* companion
to [create-package-wrapper.md](./create-package-wrapper.md) (which covers approving a *new* vendor).

## Read first

- Frontend: [rules/frontend/09-library-wrapping.md](../rules/frontend/09-library-wrapping.md)
- Backend: [rules/10-library-modularization.md](../rules/10-library-modularization.md)
- Boundaries twin: [memory/library-boundaries.md](../memory/library-boundaries.md)

## Steps

1. **Find every direct import.** Grep the package name across `apps/` and `packages/`. Group call
   sites by the minimal API they actually use — that set defines the wrapper's public surface.
2. **Build the wrapper** with the minimal typed API, no vendor types across the boundary:
   - Frontend (`apps/web`): `apps/web/src/packages/<capability>/` with an `index.ts` facade
     (app-shaped functions/components, our naming). Follow
     [create-package-wrapper.md](./create-package-wrapper.md) for the facade design and tests.
   - Backend (`apps/api`): an adapter behind a port interface in the owning module's `domain/`,
     implemented under `infrastructure/adapters/` (see [add-library.md](./add-library.md)).
3. **Migrate every call site** to the wrapper and delete every direct import. One vendor per commit;
   run the gate after each migration ([refactor-feature.md](./refactor-feature.md) for the mechanics
   if the move crosses layers).
4. **Register the boundary (MANDATORY).** Add the vendor → owning-folder entry to
   [eslint/package-boundaries.config.mjs](../eslint/package-boundaries.config.mjs) so
   `no-raw-package-imports` / `no-restricted-vendor-imports` fails lint on any regression. Verify by
   re-adding a raw import temporarily and confirming `npm run lint` fails, then revert.
5. **Update the human twin** [memory/library-boundaries.md](../memory/library-boundaries.md) and,
   for the web side, the decision log [docs/package-decisions.md](../docs/package-decisions.md).
6. **Test the wrapper's mapping and error translation** (facade contract in → out), not vendor
   internals. Wrapper pure logic hits 100% coverage.

## Definition of done

- Zero direct imports of the vendor remain outside the owning folder; the boundary rule enforces it.
- Wrapper `index.ts` is the only surface; call sites depend on our types, never the vendor's.
- Boundaries config + `memory/library-boundaries.md` updated in the same change; tests green.

## Validation (gate)

```bash
npm run lint                # boundary rule fails on any surviving raw import; 0 warnings
npm run typecheck           # tsgo, strict — no vendor types leaking across the facade
npm run test:coverage       # Vitest — 95% global, 100% wrapper pure logic
npm run build               # next build (web) / nest build (api)
npm run quality:dead-code   # knip — no unused facade exports
npm run quality:circular    # madge — no import cycles
```
