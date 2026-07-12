---
id: contracts-shared-schemas
title: Shared Schema Catalog (packages/shared)
type: contract
authority: canonical
status: current
owner: repository owner
summary: Catalog of every cross-side zod schema in packages/shared — name, owning file, what it validates, and its consumers on both the API and web sides.
keywords: [shared, schemas, zod, catalog, cross-side, contracts, frontend, backend, twinzy-shared]
contextTier: 2
relatedCode: [packages/shared/src/schemas/index.ts, packages/shared/src/types/api-error.schema.ts]
relatedTests: [packages/shared/tests/schemas.test.ts, packages/shared/tests/stream-contract.test.ts, packages/shared/tests/share-result.schema.test.ts]
relatedDocs: [contracts/README.md, contracts/api/README.md, contracts/ai/prompt-io.md]
readWhen: You need to know which shared schema validates a given payload or who consumes it before changing it.
---

# Shared Schema Catalog (`@twinzy/shared`)

All cross-side contracts live in `packages/shared/src/schemas/` (11 files) plus the error
envelope in `packages/shared/src/types/api-error.schema.ts`, exported through
`packages/shared/src/index.ts`. Zod v4; sole runtime dependency of the package. Changing any
of these is a **cross-side change** — both apps validate against the same file.

| Schema (file in `packages/shared/src/`) | Validates | API-side consumer | Web-side consumer |
| --- | --- | --- | --- |
| `TraitExtractionResponseSchema` (`schemas/traits.schema.ts`) | Prompt 1 output: 221-field trait taxonomy, derived `traitCount`, literal-false safetyCheck | `apps/api/src/modules/ai/application/trait-extraction.service.ts` | — (internal AI contract; taxonomy keys reused for i18n labels per `packages/shared/src/constants/trait-category.constants.ts`) |
| `CandidateGenerationResponseSchema` (`schemas/candidates.schema.ts`) | Prompt 2 output: candidate pool 1–25 | `apps/api/src/modules/ai/application/candidate-generation.service.ts` | — |
| `CandidateJudgeResponseSchema` (`schemas/judge.schema.ts`) | Prompt 3 output: ≤10 judged results + removedCandidates | `apps/api/src/modules/ai/application/candidate-judge.service.ts` | — |
| `FinalGameResultSchema` (`schemas/game-result.schema.ts`) | The `/game/analyze` response and translation unit (strict) | result aggregation + translation (`apps/api/src/modules/result-aggregation/`, `apps/api/src/modules/ai/application/result-translation.service.ts`) | `apps/web/src/modules/game/gateway/game.gateway.ts`, `game-translate.gateway.ts` |
| `GameStreamMessageSchema` + envelope + cancel schemas (`schemas/game-stream.schema.ts`) | Every SSE frame; `POST /game/cancel` request/response | `apps/api/src/modules/game/api/game-stream.presenter.ts`, `apps/api/src/modules/game/lib/game-stream.ts` | `apps/web/src/modules/game/gateway/game-stream.gateway.ts` |
| `TranslateResultRequestSchema`/`ResponseSchema` (`schemas/translate-result.schema.ts`) | `POST /game/translate-result` body/response | zod pipe in `apps/api/src/modules/game/api/game.controller.ts` | `apps/web/src/modules/game/gateway/game-translate.gateway.ts` |
| `ResultCountSchema` (`schemas/result-count.schema.ts`) | resultCount 1–10 default 10 | analyze DTO (`apps/api/src/modules/game/api/dto/analyze-request.dto.ts` uses the same shared bounds) | result-count form control (`apps/web/src/modules/game/schemas/game.schema.ts`) |
| `LanguageCodeSchema` (`schemas/language.schema.ts`) | strict `en`\|`ar` | translate request | i18n locale constants (`apps/web/src/packages/i18n/locale.constants.ts`) |
| `CreatePaymentOrderRequestSchema`/`ResponseSchema`, `PaypalOrderIdSchema`, `PAYMENT_ORDER_FIELD_NAME` (`schemas/payment.schema.ts`) | `POST /payments/orders`; the `paypalOrderId` multipart field | zod pipe in `apps/api/src/modules/payments/api/payments.controller.ts`; `apps/api/src/modules/payments/lib/payment-order.util.ts` | `apps/web/src/modules/game/gateway/payment.gateway.ts`, `game-form-data.builder.ts` |
| `ShareIdSchema`, `CreateShareResultRequestSchema`/`ResponseSchema`, `ShareResultResponseSchema` (`schemas/share-result.schema.ts`) | `/share-results` endpoints | zod pipes in `apps/api/src/modules/share-results/api/share-results.controller.ts` | `apps/web/src/modules/game/gateway/share.gateway.ts` |
| `HealthResponseSchema` (`schemas/health.schema.ts`) | `GET /health` response | `apps/api/src/modules/health/application/health.service.ts` | — (integration-test consumer only) |
| `ApiErrorResponseSchema` (`types/api-error.schema.ts`) | Every error response | produced via `apps/api/src/core/errors/error-body.mapper.ts` | `apps/web/src/modules/game/helpers/game-error.helper.ts` |

## Non-schema shared contract surfaces

Also exported by the package and relied on by both sides (see the owning files for detail):

- `ErrorCode` catalog — `packages/shared/src/constants/error-code.constants.ts`
  ([error envelope](../api/error-envelope.md)).
- API path constants — `packages/shared/src/constants/app.constants.ts`,
  `share-result.constants.ts` ([endpoint index](../api/README.md)).
- Upload wire contract (field names, MIME/extension allowlists, size caps) —
  `packages/shared/src/constants/upload.constants.ts`.
- SSE correlation headers — `packages/shared/src/constants/stream.constants.ts`.
- Forbidden-wording lists — `packages/shared/src/constants/safety.constants.ts` (backend
  rejection + frontend never-renders tests; policy owned by
  [docs/ai-safety.md](../../docs/ai-safety.md)).
- Result bounds and `GAME_PROMPT_VERSION` — `packages/shared/src/constants/trait.constants.ts`,
  `app.constants.ts`.
- Enums (as-const; the TS `enum` keyword is banned repo-wide) —
  `packages/shared/src/enums/`.

## Change discipline

Shape tests pin these contracts in `packages/shared/tests/`. The package builds to `dist/`
(`packages/shared/package.json`); rebuild before trusting `dist` — stale compiled artifacts
have been observed there.
