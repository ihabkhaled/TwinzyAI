---
id: runbook-deployment
title: Runbook — Deployment
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The gated deployment procedure — prerequisites, gates, Compose deploy, smoke test, and rollback readiness; records that no production deployment has been executed yet.
keywords: [runbook, deployment, release, gates, compose, smoke-test, go-no-go, https]
contextTier: 2
relatedCode: [docker-compose.yml, package.json, .github/workflows/gate-build.yml]
relatedTests: []
relatedDocs:
  [
    docs/release-checklist.md,
    docs/sdlc/release-checklist.md,
    runbooks/release-smoke-test.md,
    runbooks/rollback.md,
  ]
readWhen: Preparing or executing a deploy of the Twinzy stack.
---

# Runbook — Deployment

**Status fact (2026-07-12):** no production deployment has been executed yet — the most recent release stream records "production deployment NOT EXECUTED" (`docs/features/simple-readable-code-operating-system-implementation/25-release-report.md`) and a deployed public HTTPS origin is one of the open paywall LIVE conditions (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`). The approved deployment mechanism is the hardened Docker Compose stack built from source (`docker-compose.yml`).

## Prerequisites (hard gates — none skippable)

1. All quality gates green on the release revision — same commands as CI (`.github/workflows/gate-*.yml`): `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run test:coverage`, `npm run test:e2e:ci`, `npm run build`, `npm run security:audit` + `npm run security:scan` (0 HIGH/CRITICAL).
2. Release-gate checklists satisfied: [`docs/release-checklist.md`](../docs/release-checklist.md) and [`docs/sdlc/release-checklist.md`](../docs/sdlc/release-checklist.md); a recorded GO in the request's `22-go-no-go.md`.
3. Release notes exist (`release-notes/`), support briefed ([`../support/release-support-checklist.md`](../support/release-support-checklist.md)).
4. Target `.env` prepared and validated ([environment-bootstrap.md](./environment-bootstrap.md)); in production: `NODE_ENV=production`, `CORS_ALLOWED_ORIGINS` set to the real web origin, `SHARE_RESULT_PUBLIC_BASE_URL` set to the deployed frontend origin, `TRUST_PROXY=true` only behind a trusted proxy (`.env.example` comments).
5. Payments stay **off** (blank PayPal credentials) unless every recorded LIVE condition has been signed off — sandbox credentials never ship to a public production origin without that record.
6. Rollback path confirmed revertible ([rollback.md](./rollback.md)).

## Steps

1. Pin the release revision; note the commit sha in the release report.
2. On the target host: check out the revision, place the environment file, then:
   ```bash
   docker compose up -d --build
   docker compose ps        # api + web Up (healthy — baked-in HEALTHCHECKs)
   ```
3. Run the full post-deploy verification: [release-smoke-test.md](./release-smoke-test.md) (health + headers, analyze happy path, failure envelopes, log verification, web spot-check).
4. Record everything in the request's `25-release-report.md` (steps executed, smoke results, issues, final status).
5. Open the hypercare window ([hypercare.md](./hypercare.md)).

## Verify

Smoke test green (step 3) **and** logs healthy: structured pino JSON, request ids present, no unexplained `error`-level entries, nothing sensitive ([release-smoke-test.md](./release-smoke-test.md) §5).

## Rollback

Keep rollback armed until hypercare closes. No database exists, so rollback is always `git revert` + rebuild + redeploy; env-lever features roll back by env change alone. Procedure: [rollback.md](./rollback.md); severe cases: [emergency-rollback.md](./emergency-rollback.md).
