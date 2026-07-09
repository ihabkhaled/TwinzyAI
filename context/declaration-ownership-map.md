# Declaration Ownership Map

The one answer sheet for "where does X live?". Search-then-extend ([rules/29](../rules/29-reuse-before-creating.md)): if the owner exists, extend it; never create a parallel owner. Enforced mechanically by `architecture/no-inline-domain-definitions` (backend) and `frontend-architecture/no-inline-declarations` (web).

## Backend — `apps/api/src`

| What | Owner |
| --- | --- |
| Feature constants (limits, TTLs, labels, header names) | `modules/<feature>/model/<feature>.constants.ts` |
| Feature types/interfaces | `modules/<feature>/model/<feature>.types.ts` |
| Feature as-const enum maps | `modules/<feature>/model/<feature>.enums.ts` (or shared enums when cross-side) |
| Request/response DTO schemas | `modules/<feature>/api/dto/*.dto.ts` |
| Pure helpers / mappers / guards | `modules/<feature>/lib/*.util.ts` / `*.mapper.ts` / `*.helpers.ts` |
| Domain decisions / policies | `modules/<feature>/domain/` |
| Cross-cutting (errors, logger, validation, http, streaming) | `apps/api/src/core/**` |
| Env schema, typed getters, provider/route/step vocabulary | `apps/api/src/config/**` (only home of `process.env`, besides bootstrap) |
| Provider SDK/raw-HTTP code, cross-provider router/registry/shadow | `modules/ai/adapters/` (ONLY home of `@google/genai` + provider fetch) |
| AI prompt templates | `modules/ai/prompts/*.md` via `PromptTemplateRepository` |
| AI model/route/step names | env-driven via `config/` — never hardcoded anywhere |

## Frontend — `apps/web/src`

| What | Owner |
| --- | --- |
| Module constants (field names, test-id-adjacent values, statuses) | `modules/<feature>/model/<feature>.constants.ts` |
| Module types / view models / prop shapes (reusable) | `modules/<feature>/model/*.types.ts` |
| Query keys | the module's query/model owner (`model/*.constants.ts` today) |
| Zod schemas (frontend-only) | `modules/<feature>/model/*.schema.ts`; cross-side → `packages/shared` |
| Pure mappers/guards/validators/formatters | `modules/<feature>/helpers/` or `lib/` |
| Hooks (state/effects/orchestration) | `modules/<feature>/hooks/use*.hook.ts` |
| HTTP | `modules/<feature>/gateway/*.gateway.ts` over `src/packages/axios` ONLY |
| Browser APIs (storage, clipboard, environment) | `src/packages/browser` (only home of raw browser globals) |
| Env access | `src/packages/env` (only client `process.env` reader) |
| i18n messages | `src/packages/i18n/messages/{en,ar}.json` — every user-facing string |
| Shared UI primitives | `src/shared/components/**` |
| Test ids | `src/shared/constants/test-ids.constants.ts` |

Documented exception: a `.component.tsx` may declare its own `XxxProps` interface; everything reusable still goes to `model/`.

## Cross-side — `packages/shared/src`

| What | Owner |
| --- | --- |
| Contract constants (bounds, safety phrases, disclaimers, prompt version) | `constants/*.constants.ts` |
| As-const enums + `*_VALUES` arrays | `enums/*.enum.ts` |
| Contract schemas (API request/response, stream frames) | `schemas/*.schema.ts` |
| Contract types | derived from schemas or `types/` |
| Pure cross-side utils | `utils/` |

Rule of thumb: a value both sides must agree on lives in `packages/shared`; a value one side owns lives in that side's `model/`; a value only one FILE uses and that represents no reusable concept may stay file-private (log labels).
