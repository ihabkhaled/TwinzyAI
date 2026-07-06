# Skill: Add an i18n Message Key (backend + frontend)

> Applies rules/12, 22. An error scenario is a contract with BOTH sides: the API returns a
> stable `messageKey`; the web dictionary renders it. Ship both in the same change.

1. Backend: add the key constant in `model/NAME.constants.ts` — format
   `errors.NAME.<key>`, one distinct key per scenario (validation, not-found, conflict...
   each get their own; never a catch-all) — and throw it via a typed `AppError`
   (create-error.md). The envelope carries `messageKey` alongside the `ApiErrorResponse`
   fields.
2. Frontend: add the user-facing string to `apps/web/src/i18n/en.ts` and map the backend
   key (`messageKey`, with `errorCode` as the legacy fallback) to it in the owning
   feature's error mapper (`features/NAME/lib`) — unknown keys fall back to
   `error.generic`, never to a blank or raw key on screen.
3. The API never returns localized prose as its contract — `message` is for server logs;
   the client localizes from the key.
4. Non-error UI strings follow the same discipline: dictionary key in `i18n/en.ts`,
   rendered through `t()`; no hardcoded text in TSX.
5. Keys are append-mostly: renaming or removing a live key is a breaking client change —
   add the new key, migrate both sides, then retire the old one deliberately.
6. Tests: a unit test asserts the throw carries the exact key constant; a web test asserts
   the mapper renders the new string and falls back safely for unknown keys.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
