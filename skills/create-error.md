# Skill: Create a Typed Error

> Applies rules/00, 22. Every user-facing failure is an `AppError` subclass with a stable
> `messageKey`; the global filter in `apps/api/src/core/errors` is the only producer of
> error responses.

1. Reuse before inventing. The hierarchy in `core/errors` covers the statuses
   400 (validation) · 401 · 403 · 404 · 409 · 413 (payload too large) · 502 (upstream/AI).
   A new scenario usually needs only a new `messageKey` on an existing class — open the
   barrel and check first.
2. Add the key constant in `model/NAME.constants.ts` — format `errors.NAME.<key>`, one
   distinct key per scenario (never a catch-all), never an inline literal:

   ```ts
   export const GAME_MESSAGE_KEYS = {
     CONSENT_REQUIRED: 'errors.game.consentRequired',
     AI_UNAVAILABLE: 'errors.game.aiUnavailable',
   } as const;
   ```

3. Only for a genuinely new failure shape: subclass `AppError` once in `core/errors` with a
   fixed status and safe structured details, and export it from the barrel. Never inline a
   subclass in a service.
4. Throw from the layer that detects the failure (service, use case, domain, adapter).
   Controllers never try/catch; adapters wrap vendor failures as the 502 error and keep the
   cause server-side — provider text never reaches the client.
5. Filter mapping: the `core/errors` filter maps every `AppError` generically, so a new key
   on an existing class needs NO filter change. The envelope keeps the `ApiErrorResponse`
   fields (`statusCode`, `errorCode`, `message`) and adds `messageKey` — additive, so
   existing clients keep working. 4xx logs at `warn`, 5xx at `error`.
6. Frontend: map the new key to a dictionary entry (add-i18n-message-key.md).
7. Tests: a unit test asserting the throwing method rejects with the exact subclass AND
   `messageKey` constant, plus an integration test asserting the route returns the right
   status and envelope with no stack/provider leakage.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
