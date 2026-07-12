---
id: structure-module-shared
title: Module — packages/shared (Cross-Side Contracts)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The @twinzy/shared contracts package — API routes, the frozen error-code catalog, safety wordlists, the trait taxonomy, as-const enums, all cross-side Zod schemas, and utils.
keywords: [shared, contracts, zod, schemas, enums, constants, error-codes, safety, taxonomy, prompt-version]
contextTier: 2
relatedCode: [packages/shared/src]
relatedTests: [packages/shared/tests]
relatedDocs: [docs/ai-safety.md, structure/configuration-map.md, structure/layer-map.md]
readWhen: You are changing any API contract, enum, bound, safety list, or anything both sides consume.
---

# Module — `packages/shared` (`@twinzy/shared`)

**Responsibility.** The cross-side contracts package consumed by both `apps/api` and
`apps/web`. Private, sole runtime dependency `zod` (`packages/shared/package.json`); builds
to `dist/` and is published to the workspaces as `dist/index.js`.

## Public surface

`packages/shared/src/index.ts` star-exports `./constants`, `./enums`, `./schemas`, `./types`,
`./utils`; every source module is reachable via the barrels — no private modules.

## What it owns

| Area | Highlights |
| --- | --- |
| `constants/app.constants.ts` | `API_BASE_PATH` + every API route constant; `GAME_PROMPT_VERSION = 'written-traits-v5'`; server-owned localized `RESULT_DISCLAIMER_BY_LANGUAGE` and `NO_MATCH_FALLBACK_BY_LANGUAGE` (en/ar) |
| `constants/error-code.constants.ts` | The frozen `ErrorCode` catalog — 24 machine-readable codes; **add-only, never rename/remove** |
| `constants/safety.constants.ts` | `FORBIDDEN_RESULT_PHRASES` + `FORBIDDEN_SENSITIVE_TOPICS` (33 bilingual entries each) — single source for backend rejection/sanitization and frontend never-renders tests ([docs/ai-safety.md](../../docs/ai-safety.md)) |
| `constants/trait-category.constants.ts` | The advanced-global-traits-v2 taxonomy: `TRAIT_CATEGORY_FIELDS` — 16 categories, 221 named fields; consumed by the schema builder, prompt template, fixtures, and i18n keys |
| `constants/trait.constants.ts` | Result count 1–10 (default 10), candidate pool ≤25, scores 0–100, `MIN_DISPLAY_SCORE` 70; score calibration is deliberately NOT here — owned by `apps/api/src/modules/ai/prompts/use-3rd-prompt.md` |
| `constants/upload.constants.ts` | 5 MiB default / 10 MiB transport hard cap, MIME/extension allowlists, field names (`image`, `consent`) |
| `constants/language|stream|share-result|response-bounds` | `LANGUAGE_CODES ['en','ar']`, `STREAM_ID_HEADERS` (x-twinzy-*), share TTL/payload/capacity defaults, all field bounds |
| `enums/` | As-const triples (object + `*_VALUES` + derived type): `ConfidenceLevel`, `GameStreamEvent`/`GameStreamStage`, `PopularityLevel`, `PublicCategory`, `StreamStatus` (+ terminal helpers), `Verdict`. **The TS `enum` keyword is banned repo-wide** |
| `schemas/` | 11 files: `traits` (Prompt 1, tolerant, derived traitCount), `candidates` (Prompt 2), `judge` (Prompt 3, `z.literal(false)` safety flags), `game-result` (strict final response), `game-stream` (SSE discriminatedUnion + cancel), `translate-result`, `share-result`, `payment` (price deliberately absent; `PAYMENT_ORDER_FIELD_NAME` lives here), `result-count`, `language`, `health` |
| `types/api-error.schema.ts` | `ApiErrorResponseSchema` — the safe error envelope (a zod schema under `types/`) |
| `utils/` | `isRecord`, `countPopulatedTraitFields` (the authoritative traitCount source) |

## Invariants

- `GAME_PROMPT_VERSION` is a `z.literal` in the four AI/response schemas — a stale
  model/template pairing fails validation; bump prompt + schemas together.
- Error codes and route constants are public API contract — add-only.
- Contracts flow one way: the package depends on nothing but zod; both apps import it, never
  the reverse.
- **Build before consume**: nearly every root script runs `npm run build:shared` first;
  `packages/shared/dist/` is known to hold some stale artifacts with no src counterpart, so
  never trust dist without a rebuild.

## Tests

`packages/shared/tests/` (vitest `shared-unit` project): `schemas.test.ts`,
`stream-contract.test.ts`, `share-result.schema.test.ts`, `utils.test.ts`, plus
`tests/fixtures/advanced-fixtures.ts` — deterministic fixture builders generated from
`TRAIT_CATEGORY_FIELDS` so a taxonomy change updates every test at once.

## Common changes and risks

- **Any contract change** ripples to both sides: schema + api consumer + web gateway +
  fixtures (shared, api `tests/fixtures/fake-ai-adapter.ts`, web e2e helpers) in one stream.
- **Safety-list edits** are product-constraint changes ([CLAUDE.md](../../CLAUDE.md)
  constraint 7) — security-aware review required.
- **Risk**: renaming/removing an ErrorCode or route constant silently breaks deployed
  clients; the catalogs are frozen by doc comment.
