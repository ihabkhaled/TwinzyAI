# Skill: Add a Guard / Permission

> Applies rules/06, 18. Twinzy has NO auth today — the game is free and anonymous by
> standing decision (memory/security-decisions.md, memory/privacy-decisions.md); identity
> requires an ADR before any code. What exists today: throttling and consent enforcement.
> The chain below is the binding blueprint if identity is ever approved.

## Today — throttle overrides and consent

1. Throttle overrides: global limits are wired in `app.module.ts` through the rate-limit
   layer (`core/rate-limit`); expensive routes (analyze) override per-route with
   `@Throttle` using constants from the module's `model/` — never inline numbers.
2. Consent enforcement: the backend is the source of truth. The consent flag is validated
   in the Zod DTO AND re-asserted at the start of the file-security chain; missing consent
   is rejected with the typed 400 `AppError` and its `messageKey` BEFORE any byte of the
   image is inspected.
3. Tests: over-limit requests return 429 with the standard envelope; missing/false consent
   is rejected before any processing; the happy path is unaffected.

## Blueprint — only after an ADR approves identity

4. Chain order on every protected route: authentication guard (verify the token) ->
   permissions guard (grants referenced from an `as const` catalog, never raw string
   literals) -> ownership check inside the service query.
5. Identity comes from the verified token, never from body/query fields; permission grants
   are wired explicitly per role (least privilege — a new catalog entry grants nothing
   until a role references it).
6. Ownership misses return 404, never 403 — the API must not confirm that an out-of-scope
   resource exists.
7. Deny paths are typed `AppError`s (401/403/404) with `messageKey`s, and the deny tests
   (no token, missing grant, out-of-scope id) are written FIRST.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
