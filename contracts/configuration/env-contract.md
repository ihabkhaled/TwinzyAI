---
id: contracts-configuration-env
title: Environment Configuration Contract
type: contract
authority: canonical
status: current
owner: repository owner
summary: Pointer to the env-var contract — where it is defined, required vs optional groups, NEXT_PUBLIC_* exposure rules, and fail-fast validation; per-variable detail is owned by docs/env-vars.md.
keywords: [env, environment, configuration, next-public, validation, fail-fast, secrets, dotenv, contract]
contextTier: 2
relatedCode: [apps/api/src/config/env.schema.ts, apps/api/src/config/app-config.service.ts, .env.example]
relatedTests: [apps/api/src/config/env.schema.test.ts, apps/api/src/config/app-config.service.test.ts]
relatedDocs: [docs/env-vars.md, contracts/ai/README.md, contracts/api/payments.md]
readWhen: You are adding, renaming, or consuming an environment variable on either side.
---

# Environment Configuration Contract

**Per-variable detail (name, side, default, notes) is owned by
[docs/env-vars.md](../../docs/env-vars.md)** — this file only fixes the contract rules.

## Where the contract is defined

- **API**: every variable is defined once in `apps/api/src/config/env.schema.ts` (zod).
  `validateEnv` runs at startup and **crashes the process on invalid config** (fail-fast); a
  `superRefine` enforces the cross-variable invariant `STREAM_TTL_MS >= ANALYSIS_TIMEOUT_MS`.
  Numeric bounds live in `apps/api/src/config/env-bounds.constants.ts` (cross-side values are
  re-exported aliases from `@twinzy/shared` so the sides cannot drift).
- **Access**: `apps/api/src/config/app-config.service.ts` is the only injectable config
  surface. `process.env` is read only in `apps/api/src/config/` and (pre-DI) in
  `apps/api/src/bootstrap/fastify-adapter.ts` (`TRUST_PROXY`); on the web side only
  `apps/web/src/packages/env` and tooling config may read it (lint-enforced, per
  [docs/env-vars.md](../../docs/env-vars.md)).
- **Template**: `.env.example` at the repo root documents every variable with commentary and
  must be updated with any env change (see the change checklist in
  [CLAUDE.md](../../CLAUDE.md)).

## Required vs optional groups

Every API variable has a default, so the app boots with an empty env — but functional groups
differ (defaults per `apps/api/src/config/env.schema.ts`):

| Group | Variables (representative) | Behavior when unset |
| --- | --- | --- |
| Required for real analysis | `GEMINI_API_KEY`, `GEMINI_MODEL` | Boot succeeds; live AI calls cannot work. Model ids are never hardcoded — env only (product constraint in [CLAUDE.md](../../CLAUDE.md)). |
| Paywall (optional feature) | `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV`, `PAYMENT_PRICE_VALUE/CURRENCY` | Blank credentials (default) = paywall OFF = fully free ([payments contract](../api/payments.md)). |
| Optional providers | `{OPENAI\|DEEPSEEK\|QWEN\|KIMI\|GLM}_API_KEY`/`_BASE_URL` | Key absence = provider disabled ([AI routing](../ai/README.md)). |
| Optional hardening | `ENABLE_CLAMAV`, `CLAMAV_HOSTS/PORT`, `TRUST_PROXY` | Scanning off / proxy trust off by default ([ClamAV contract](../integrations/clamav.md)). |
| Tunable caps | timeouts, byte caps, concurrency, rate limits, share TTL/caps | Safe defaults with schema-enforced bounds. |
| Parallel AI pipeline (flag-gated) | `AI_PARALLEL_PIPELINE_ENABLED` (default `false`), `AI_GENERATION_LANES` (2), `AI_GENERATION_CONCURRENCY` (2), `AI_JUDGE_CONCURRENCY` (1), `AI_MAX_CALLS_PER_ANALYSIS` (5), `AI_PARALLEL_QUEUE_TIMEOUT_MS` (30 000) | Flag `false` (default) = one unchanged generation call = current behavior; all schema-bounded, per-variable detail in [docs/env-vars.md](../../docs/env-vars.md) / [concurrency-policy.md](../../docs/ai/concurrency-policy.md). |

## NEXT_PUBLIC_* rules

Web variables prefixed `NEXT_PUBLIC_` are **baked into the client bundle at build time and
are public by definition** — only non-secret values are allowed there. Current public
variables (`.env.example`): `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE_URL`,
`NEXT_PUBLIC_PAYPAL_ME_USERNAME` (donate link, hidden when unset),
`NEXT_PUBLIC_PAYPAL_CLIENT_ID` (public PayPal Buttons client id),
`NEXT_PUBLIC_PAYMENT_PRICE_VALUE/CURRENCY` (display-only; the charge amount is
server-authoritative — see [payments](../api/payments.md)). Server secrets
(`PAYPAL_CLIENT_SECRET`, `GEMINI_API_KEY`, provider keys) are **never** `NEXT_PUBLIC` and
never committed (`.env.example` keeps them blank).

## Change protocol

Adding a variable means updating, in the same delivery stream: `env.schema.ts` (+ bounds),
`AppConfigService` getter, `.env.example`, [docs/env-vars.md](../../docs/env-vars.md), and the
local `.env` files of running environments. Env-file lookup order is app folder then repo
root, with `process.env` winning (`apps/api/src/config/config.module.ts`).
