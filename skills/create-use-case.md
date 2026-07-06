# Skill: Create a Use Case

> Applies rules/17 (the orchestration layer — the "manager" name is retired). A use case
> owns ONE multi-step workflow in `application/<action>.use-case.ts`; services own single
> capabilities (create-service.md).

Use a use case when the operation coordinates several services in a required order, with
short-circuits, fallbacks, or cleanup guarantees. A single-capability action stays a
service — escalating it is ceremony.

1. File: `apps/api/src/modules/NAME/application/<action>.use-case.ts`, named by the
   operation (`AnalyzeGameUseCase`), with one public `execute(...)` returning a typed
   result.
2. Inject services only — never SDKs, adapters, or repositories directly; those hide behind
   the services that own them (`architecture/application-layer-boundaries`).
3. `execute()` reads like a recipe: guard -> step -> short-circuit -> step -> result. Push
   each phase into a small private helper; extract decisions into `domain/` and mapping
   into `lib/` so the orchestration stays legible.
4. Cleanup guarantees live HERE: any resource acquired for the workflow (in Twinzy, the
   image buffer) is released in `finally` — on success, failure, and timeout alike.
5. Side effects that must not break the result (logging, fallback selection) are
   fail-safe: catch, log via `AppLogger`, degrade gracefully (rules/08).
6. Failures are typed `AppError`s with `messageKey`s (create-error.md); a use case has no
   HTTP knowledge — no status codes, no response shaping.
7. Dependency direction: controllers delegate exactly one call to `execute()`; services
   never call use cases; use cases never import `api/` or another module's internals
   (`index.ts` surface only).
8. No database today (memory/architecture-decisions.md). If persistence is ever approved
   via ADR, the use case becomes the home of the transaction boundary: reads before,
   writes inside, side effects after commit.
9. Unit tests: order-of-operations, every short-circuit, cleanup-always-runs (make each
   step throw and assert the release still happened), and failure mapping — with mocked
   services (write-unit-tests.md).

Worked example: create-manager-use-case.md (the analyze-game use case).

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
