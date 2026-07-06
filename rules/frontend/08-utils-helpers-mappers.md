# 08 — Utils, Helpers, Mappers, and Schemas

Four small layers do all the pure computation in this codebase. Getting a function into the right one
is not pedantry: each layer has a different dependency budget and all four share the same coverage bar
— **100% lines and branches** (see [testing/frontend/coverage-policy.md](../../testing/frontend/coverage-policy.md),
enforced per-directory in [vitest.config.ts](../../vitest.config.ts)).

## utils/ — pure and generic

`*.util.ts` functions are deterministic, dependency-free, and know nothing about the feature's copy or
presentation. They take domain values, return domain values. Reference: `sortArticlesByNewest` in
`apps/web/src/modules/articles/utils/article.utils.ts`; shared examples are `isDefined`
(`apps/web/src/shared/utils/is-defined.util.ts`) and `assertNever`
(`apps/web/src/shared/utils/assert-never.util.ts`). Utils MUST NOT import i18n, React, stores, or
anything with side effects.

## helpers/ — feature decisions and formatting

`*.helper.ts` functions make presentation decisions: which label, which class bundle, which formatted
date. They may use the date facade (`formatDisplayDate` from `@/packages/date`) and style constants,
but they MUST NOT call translation hooks — **translators are injected** as plain callbacks so helpers
stay synchronous, pure, and testable without a provider tree. Reference: `buildArticleCardViewModel` in
`apps/web/src/modules/articles/helpers/article-display.helper.ts` receives `translateStatus`,
`translateReadingTime`, and `translatePublishedOn` callbacks from the hook ([03-hooks.md](03-hooks.md))
and returns a finished card view model. Shared example: `buildPageTitle`
(`apps/web/src/shared/helpers/page-title.helper.ts`).

## mappers/ — shape conversion, nothing else

`*.mapper.ts` files convert between the three data shapes, one direction per function:

- **wire → domain**: snake_case API types to camelCase domain types. Reference: `mapArticleApiItem` /
  `mapArticleListResponse` in `apps/web/src/modules/articles/mappers/article.mapper.ts`, called only by
  the service layer ([04-services-api-gateway.md](04-services-api-gateway.md)).
- **domain → view-model**: done by helpers as described above (naming keeps "mapper" for wire
  conversions; helpers own presentation).
- **error → keys / issues → field errors**: shared mappers like `mapErrorToMessageKey`
  (`apps/web/src/shared/errors/http-error-to-message-key.mapper.ts`) and `mapSchemaIssuesToFieldErrors`
  (`apps/web/src/shared/mappers/schema-issues-to-field-errors.mapper.ts`).

Mappers MUST NOT fetch, translate, or branch on business rules — they rename, restructure, and convert
primitive representations. A mapper that decides something is a helper wearing a costume.

## schemas/ — validation only

`*.schema.ts` files define Zod schemas via the wrapper `@/packages/zod` and nothing else. Gateway
response schemas validate the wire contract (`apps/web/src/modules/articles/schemas/article.schema.ts`);
form schemas carry i18n-key error messages
(`apps/web/src/modules/game/schemas/game-consent.schema.ts`); storage schemas guard hydration
(`apps/web/src/modules/ui-preferences/schemas/ui-preferences.schema.ts`). Where a contract is shared
with the backend it is imported from `@twinzy/shared` (`packages/shared/schemas`) rather than redefined.
Parsing happens at the boundary that receives the data (`parseSchema` / `safeParseSchema`), never inside
schemas themselves.

## Placement test

Ask in order: Is it generic and copy-free? → util. Does it decide presentation or need a translator?
→ helper. Does it convert one shape to another 1:1? → mapper. Does it validate external input? →
schema. If a function fails all four, it is probably hook or service logic — see
[03-hooks.md](03-hooks.md) / [04-services-api-gateway.md](04-services-api-gateway.md). These layers sit
below the view: the policy table in [eslint/architecture.config.mjs](../../eslint/architecture.config.mjs)
forbids them from importing components, containers, hooks, or `apps/web/src/app`.
