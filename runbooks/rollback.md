---
id: runbook-rollback
title: Runbook — Rollback
type: runbook
authority: canonical
status: current
owner: repository owner
summary: The canonical rollback procedure — git revert plus rebuild/redeploy (no database to unwind) and the env-only levers for instant feature disablement.
keywords: [runbook, rollback, revert, redeploy, env-levers, paywall, no-database, smoke-test]
contextTier: 2
relatedCode: [docker-compose.yml]
relatedTests: []
relatedDocs: [runbooks/rollback-template.md, runbooks/release-smoke-test.md, runbooks/emergency-rollback.md]
readWhen: A release must be undone, or a feature must be switched off fast.
---

# Runbook — Rollback

Ground truth: **Twinzy has no database — there are never data migrations to unwind.** Rollback is always code-level: `git revert` + rebuild + redeploy (`runbooks/README.md`). Per-release specifics are documented by instantiating [`rollback-template.md`](./rollback-template.md) in the release stream.

## Prerequisites

- The release slice is identified as one or more revertible commits (release report / `git log --oneline`).
- Decide first whether an **env lever** is enough (fastest, zero code change):

| To disable | Set | Effect |
| --- | --- | --- |
| Paid analysis gate | `PAYPAL_CLIENT_ID=` and `PAYPAL_CLIENT_SECRET=` (blank) + `NEXT_PUBLIC_PAYPAL_CLIENT_ID=` (blank) | Game fully free; no payment code runs (`apps/api/src/config/app-config.service.ts`) |
| Donate link | `NEXT_PUBLIC_PAYPAL_ME_USERNAME=` (blank) | Link hidden everywhere |
| A non-Gemini AI provider | remove `<PROVIDER>_API_KEY` | Provider disabled; routes skip it (`docs/provider-routing.md`) |
| Custom AI routing | clear `AI_ROUTE_<STEP>` | Gemini-only default behavior |
| Virus scanning | `ENABLE_CLAMAV=false` | Scan skipped (conscious risk decision — record it) |

Frontend `NEXT_PUBLIC_*` values are baked at build time (`docker-compose.yml` build arg), so frontend env levers require a rebuild of the web image.

## Steps

1. Preserve evidence: `docker compose logs api > api-pre-rollback-$(date +%Y%m%d-%H%M).log`.
2. Identify the slice: `git log --oneline`.
3. `git revert <sha>...` — revert the slice; never force-push, never bypass hooks (CLAUDE.md non-negotiable gates).
4. Rebuild and redeploy: `docker compose up -d --build`.
5. Restore any release-specific `.env` change (the instantiated rollback doc for the release lists them).

## Verify (after rollback)

- [ ] Run [release-smoke-test.md](./release-smoke-test.md) against the rolled-back build
- [ ] `GET /api/v1/health` → 200 with security headers
- [ ] Analyze happy path succeeds with a fixture image
- [ ] Logs stabilized (no unexplained `error` entries)
- [ ] Player impact reduced; support updated ([`../support/known-issues.md`](../support/known-issues.md) entry closed or amended)

## Rollback of the rollback

A revert is itself a normal commit — if the rollback made things worse, revert the revert with the same procedure. Note: an API redeploy clears all active share links (in-memory cache) — expected, brief support impact ([`../support/sharing-troubleshooting.md`](../support/sharing-troubleshooting.md)).

## Aftermath

Rollbacks triggered by a defect require the defect workflow (root cause, regression test, retest — CLAUDE.md Defect Workflow) and a retrospective; material player impact requires a postmortem (`27-postmortem.md`).
