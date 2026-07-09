# Architecture Decisions

Standing shape lives in [project-architecture.md](./project-architecture.md); this file records
the individual decisions and their reasons.

## Multi-provider AI routing (2026-07-09)

- The `AI_PROVIDER_ADAPTER` port is served by `AiRouterService` (in `modules/ai/adapters/` —
  the infrastructure/ folder is persistence-only by lint rule): it resolves each step's
  env-configured `provider:model` route chain, walks entries ACROSS providers on recoverable
  failures, and fires the sampled shadow run. Step services and their tests are untouched —
  they still consume the same port. A Gemini-only config routes exactly as before (bare model
  tokens mean `gemini:<model>`).
- ONE `OpenAiCompatAdapter` (native `fetch`, zero new dependencies) serves OpenAI, DeepSeek,
  Qwen, Kimi, and GLM, parameterized by config base URL + key. Key presence IS the provider
  enable flag. Anthropic deferred: its OpenAI-compat layer lacks structured outputs and its
  AUP refuses photo→name tasks (see the research doc).
- **Fail-closed image rule:** photo-carrying steps dispatch only to gemini models or entries
  explicitly declared in `AI_VISION_MODELS`. Rationale is privacy: research found e.g. Kimi
  trains on API-submitted images — a photo must never reach a provider the operator did not
  consciously approve. Boot validation crashes on an explicit route with zero usable entries;
  implicit/keyless routes only warn (CI boots stay green).
- Docs: [/docs/provider-routing.md](../docs/provider-routing.md),
  [/docs/ai-benchmarking.md](../docs/ai-benchmarking.md), research + SDLC artifacts under
  [/docs/features/multi-provider-ai/](../docs/features/multi-provider-ai/00-intake.md).
  Rollback for any routing change is env-only.

## Engineering-OS adoption (ADR-001)

- The repo adopted the strict engineering OS: canonical layered module anatomy
  (`api/application/domain/infrastructure/adapters/model/lib`) across
  `apps/api/src/modules/{health, privacy, result-aggregation, file-security, ai, game}`,
  cross-cutting `core/` + `config/` + `bootstrap/`, machine-enforced boundaries via the custom
  ESLint architecture plugin. Recorded in
  [adr-001-strict-engineering-os.md](../architecture/adrs/adr-001-strict-engineering-os.md);
  validation-vendor decision in
  [adr-002-zod-validation-vendor.md](../architecture/adrs/adr-002-zod-validation-vendor.md).
- Existing modules map 1:1 onto the new anatomy — no domain redesign; no external contract
  changes. Feature record:
  [/docs/features/engineering-os-migration/](../docs/features/engineering-os-migration/00-intake.md).

## Manager → use case

- `controllers/` becomes `api/`; the `managers/` tier dissolves into `application/`
  (use cases + services). The game module's `GameManager` becomes
  `application/analyze-game.use-case.ts` — same orchestration role, canonical name/home.
- The health module's manager tier is dissolved outright: a trivial module no longer carries a
  pass-through layer. (This supersedes the earlier "health keeps the full chain for pattern
  consistency" decision — the canonical anatomy now demonstrates the pattern instead.)
- `common/` dissolves into `core/{errors, logger, rate-limit, openapi, http, ...}`.

## Error model: envelope stays compatible, messageKey is ADDITIVE

- Errors are a typed **AppError hierarchy** in `core/errors/`: Validation 400, Unauthorized
  401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502 — each
  with a `messageKey` of form `errors.<feature>.<key>`.
- **Decision:** the public envelope stays `ApiErrorResponse`-compatible. The legacy stable
  `ErrorCode` field is kept; `messageKey` is added **additively** so the existing frontend
  keeps working unchanged while new clients can key i18n off `messageKey`.

## Workspace & config

- npm workspaces (not pnpm/yarn): required stack default, zero extra tooling.
- `packages/shared` (`@twinzy/shared`) compiles to a CJS dist consumed by both apps; single
  source for zod schemas/contracts/constants. It resolves the BUILT dist — run `build:shared`
  first ([known-pitfalls.md](./known-pitfalls.md)).
- ESLint config lives in `/eslint` at the root; `packages/eslint-config` only re-exports it.
  Vendor ownership is config-driven via `eslint/package-boundaries.config.mjs`.
- No repository layer exists because nothing is persisted — privacy by design; any change to
  that requires an ADR + privacy review ([database-decisions.md](./database-decisions.md)).
- A parallel frontend workstream owns `apps/web`; root config changes must stay additive
  (standing coexistence rule).

## Horizontal scaling plan (ADR-003)

- The API stays single-process until profiling proves a bottleneck. Horizontal scaling is
  deferred; when needed, it requires a shared SSE/cancellation store and a shared per-IP
  rate-limit store before containers can be scaled. See
  [adr-003-horizontal-scaling-plan.md](../architecture/adrs/adr-003-horizontal-scaling-plan.md).

## Ephemeral shareable results (TWZ-SHARE-001, 2026-07-08)

- Sharing a finished result is ephemeral and database-free: the record lives behind
  `ShareResultCachePort` (+ the `SHARE_RESULT_CACHE` DI token) in a single bounded in-memory TTL
  adapter (`InMemoryShareResultCacheRepository`) — lazy expiry on read, a periodic sweeper,
  `OnModuleDestroy` cleanup, and max-active-items + max-payload-bytes caps, so the cache can never
  grow unbounded. Single-instance only (records are in-heap; a restart/redeploy drops live links;
  multi-replica needs sticky sessions).
- Redis/Valkey is the DOCUMENTED production adapter behind the same port, selected via
  `SHARE_RESULT_CACHE_DRIVER` (only `memory` today). It is intentionally not built now — the repo
  has no Redis infra and an untested/dead client would violate the no-dead-code + test-everything
  gates. Rollback for any share change is env/commit-only (no DB, no migration; a redeploy also
  clears the cache).
- The create endpoint reuses the FULL existing `FinalGameResult` contract (not a slim payload): the
  strict validated schema has no image/file slot by construction, ingest re-safety-filters and
  rejects any `data:`/base64/embedded-image string, and the shared view is guaranteed identical to
  the result view. Missing and expired ids return an identical safe 404 (no existence oracle).
- The frontend share code (create + modal + countdown + public `/share/[shareId]` page) lives INSIDE
  `apps/web/src/modules/game`, not a new `modules/share`, to reuse the result view and avoid a
  circular module dependency; the route file only imports the container.
- Deciding records: `docs/features/temporary-shareable-results/06-technical-refinement.md` and
  `08-architecture-review.md`. A dedicated `adr-004-ephemeral-share-result-cache-port.md` was planned
  in phase 13 but is not yet written (open doc gap tracked in this feature's
  `23-documentation-changelog.md`).
