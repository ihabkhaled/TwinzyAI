# Skill: Create a Service (Frontend)

Create a React-free use-case function in a module's `services/` layer. A service composes the
module's gateway (HTTP contract) with its mapper (wire → domain) and returns domain types. React,
hooks, JSX, and browser APIs do not exist at this layer — services must run identically in a route
handler, a query function, or a plain Vitest test.

> This is the web-side service playbook. The NestJS backend `application/` service skill is
> [create-service.md](./create-service.md) — do not confuse the two.

## Read first

- [rules/frontend/04-services-api-gateway.md](../rules/frontend/04-services-api-gateway.md)
- [rules/frontend/08-utils-helpers-mappers.md](../rules/frontend/08-utils-helpers-mappers.md)
- Reference: `apps/web/src/modules/game/services/game.service.ts`

## Steps

1. Make sure the layers below exist first:
   - `api/<feature>.api.types.ts` — wire types in snake_case.
   - `schemas/<feature>.schema.ts` — Zod schemas (via `@/packages/zod`) validating the wire shape.
   - `gateway/<feature>.gateway.ts` — functions that call `httpClient` from `@/packages/axios`
     against `buildGatewayPath(...)` (`apps/web/src/shared/api/api-routes.constants.ts`) and return
     `parseSchema`-validated API types, like `fetchMatchResultsFromGateway` in
     `apps/web/src/modules/game/gateway/game.gateway.ts`. Endpoint suffixes live in
     `constants/<feature>.constants.ts` (see `GAME_ENDPOINTS`).
   - `mappers/<feature>.mapper.ts` — pure wire → domain conversion; nothing above the service
     ever sees snake_case (see `mapMatchResultApiItem` in
     `apps/web/src/modules/game/mappers/match-result.mapper.ts`).
2. Create `apps/web/src/modules/<feature>/services/<feature>.service.ts` with one exported async
   function per use-case, named as a verb phrase. The flagship shape:

   ```ts
   /** Use-case: list style/vibe matches for a submission. React does not exist at this layer. */
   export async function listMatchResults(params: MatchResultsParams): Promise<MatchResultsResult> {
     const response = await fetchMatchResultsFromGateway(params);

     return mapMatchResultsResponse(response);
   }
   ```

3. Accept and return domain types from `types/<feature>.types.ts` only. If the caller needs a
   different input shape (like `SubmitPhotoInput` carrying a `File` + consent flag), the service
   translates it into the wire request explicitly before calling `submitPhotoToGateway`.
4. Let errors propagate. The gateway's `httpClient` normalizes failures to `HttpError`
   (`@/packages/axios`), and `parseSchema` throws `SchemaParseError` on contract drift; upper
   layers map them to message keys via `mapErrorToMessageKey`
   (`apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`). Never `try/catch`-and-swallow
   here. Never surface a raw server `message` upward — the client localizes from the key.
5. Write unit tests in `apps/web/src/modules/<feature>/test/` with the gateway mocked:

   ```ts
   vi.mock('../gateway/game.gateway');
   ```

   Assert that the service calls the gateway with the right arguments, maps the response through
   the mapper (snake_case in, camelCase out), and rethrows gateway failures untouched. Mapper and
   schema files get their own direct tests — they sit in the 100%-coverage bucket
   ([testing/coverage-policy.md](../testing/coverage-policy.md)).

## Twinzy guardrails

- The photo is only ever sent to the gateway as the in-flight submission; the service never logs,
  caches, or re-reads the image bytes. The consent flag is required on the wire request.

## Forbidden

- Importing React, anything from `hooks/`, `components/`, `containers/`, or `@/packages/query`.
- Calling `axios` (or `fetch`) directly, hard-coding URLs, or skipping `buildGatewayPath` — the
  browser only ever talks to the same-origin BFF gateway.
- Returning unmapped wire types upward, or mapping inside the gateway (mapping is the service's
  composition of the mapper).
- Reading `process.env` — server config comes from `getServerEnv` in `@/packages/env/server`,
  and only in server-side code.

## Validation (gate)

```bash
npm run lint                # ESLint flat config — 0 errors, 0 warnings
npm run typecheck           # tsgo, strict
npm run test:coverage       # Vitest — 95% global, 100% pure layers (services/gateway/mappers)
npm run build               # next build
npm run quality:dead-code   # knip — no orphaned exports
npm run quality:circular    # madge — services must not create layer cycles
npm run test:e2e            # relevant Playwright suite
```

## Definition of done

- Service exports pure async use-cases: gateway in, mapper out, domain types only.
- No React/browser imports anywhere in `services/`, `gateway/`, or `mappers/`.
- Unit tests cover success and failure paths with the gateway mocked; mappers/schemas at 100%.
- Gateway mock fixtures exist in `api/<feature>.mock.ts` so `SERVER_API_MOCKING=enabled` serves
  the new endpoints (wired per [skills/create-module-frontend.md](./create-module-frontend.md),
  step 7).
