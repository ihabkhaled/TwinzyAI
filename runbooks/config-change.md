---
id: runbook-config-change
title: Runbook — Configuration Change
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The full chain a configuration variable change must walk — zod schema, .env.example, docs/env-vars.md, compose, local .env, and the knowledge rebuild.
keywords: [runbook, config, env-var, schema, env-example, docs, knowledge-build, drift]
contextTier: 2
relatedCode:
  [
    apps/api/src/config/env.schema.ts,
    apps/api/src/config/env-bounds.constants.ts,
    apps/web/src/packages/env/public-env.ts,
    .env.example,
  ]
relatedTests: [apps/api/src/config/env.schema.test.ts, apps/web/src/modules/game/test/donate-and-payment-env.test.ts]
relatedDocs: [docs/env-vars.md, runbooks/environment-bootstrap.md, knowledge/README.md]
readWhen: Adding, changing, or removing any environment variable or config default.
---

# Runbook — Configuration Change

Config is code (CLAUDE.md Configuration And Environment Rules): explicit, validated, documented, and changed through the full chain below — skipping a link creates drift that the gates or the knowledge validator will catch later, at a worse time.

## Prerequisites

- The change has an owning request/feature stream; secrets involved? read [secret-rotation.md](./secret-rotation.md) first.
- Know the variable's side: backend (zod schema) vs frontend public (`NEXT_PUBLIC_*`).

## Steps — the chain (in order, same delivery stream)

1. **Schema first**:
   - Backend: define/change it in `apps/api/src/config/env.schema.ts` with bounds in `apps/api/src/config/env-bounds.constants.ts` (cross-side values must alias `@twinzy/shared` so the sides can't drift). Expose it only via a typed getter on `apps/api/src/config/app-config.service.ts` — nothing outside `src/config` reads `process.env`.
   - Frontend public: `apps/web/src/packages/env/public-env.ts` (zod-validated; the only sanctioned client `process.env` reader) + the ambient declaration in `apps/web/src/packages/env/env.d.ts`.
2. **`.env.example`** — add/update the variable with an inline comment (grouped; safe placeholder values only, never real secrets).
3. **Docs** — update the canonical table in [`docs/env-vars.md`](../docs/env-vars.md) (name, purpose, default, constraints, sensitivity, environment scope).
4. **Runtime definitions** — if containers need it: `docker-compose.yml` (environment interpolation or build args for `NEXT_PUBLIC_*`) and `docker-compose.dev.yml`.
5. **Tests** — extend `apps/api/src/config/env.schema.test.ts` / relevant frontend env tests for new validation behavior.
6. **Knowledge plane** — rebuild the generated `.ai/` plane in the same commit per [`knowledge/README.md`](../knowledge/README.md) (`npm run knowledge:build`; pre-push and CI verify drift).
7. **Local `.env` files** — every developer mirrors the `.env.example` change into their local `.env`; deployed environments get the value before the code that reads it ships.

## Verify

```bash
npm run typecheck && npm run test:unit
npm run dev:api    # boots clean; a bad value fails fast naming the variable
```

For enablement-style variables, verify both states (set and blank) behave as documented — e.g. the paywall integration test runs both postures (`apps/api/src/tests/game-analyze-paywall.integration.test.ts`).

## Rollback

Restore the previous value in the environment and restart — config rollback never requires data work. If the schema itself changed incompatibly, revert the commit chain per [rollback.md](./rollback.md).

## Never

- Never scatter `process.env` reads (lint-enforced: backend `no-direct-env-access`, frontend `no-process-env-outside-config` — `docs/eslint-architecture.md`, `docs/eslint/README.md`).
- Never commit a real secret to `.env.example` or anywhere else (`SECURITY.md`; scanners: `npm run security:scan:secrets`).
- Never hardcode a model name — `GEMINI_MODEL` and every operational cap are env-driven (product constraint, CLAUDE.md).
