---
id: quality-release-readiness
title: Release Readiness
type: quality
authority: canonical
status: current
owner: repository owner
summary: What must be true before a release — the rules/24 release gate, the compact checklist, the go/no-go artifact, and the currently open release-blocking conditions.
keywords: [release, readiness, go-no-go, gate, checklist, rollback, smoke-test, approval]
contextTier: 2
relatedCode: [package.json]
relatedTests: []
relatedDocs: [rules/24-release-gate.md, docs/release-checklist.md, docs/sdlc/release-checklist.md, runbooks/release-smoke-test.md]
readWhen: You are preparing, approving, or auditing a release decision.
---

# Release Readiness

The gate body is owned by [rules/24-release-gate.md](../rules/24-release-gate.md); the compact
operational checklist by [docs/release-checklist.md](../docs/release-checklist.md); the
artifact-keyed baseline by [docs/sdlc/release-checklist.md](../docs/sdlc/release-checklist.md).
This doc routes and records the current release-truth.

## The decision

Every release records an explicit GO / NO-GO in the feature folder's `22-go-no-go.md`
(CLAUDE.md phase 22): scope, open defects, risk, rollback readiness, observability readiness,
approvals. No release without QA sign-off, security validation where applicable, a rollback
plan, smoke tests, docs, and the recorded decision (CLAUDE.md Non-Negotiable Gates).

## Repo-concrete readiness set

- All gates in [quality-model.md](quality-model.md) green, including image scans.
- Manual QA pass on real devices ([docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md)).
- `.env.example` matches [docs/env-vars.md](../docs/env-vars.md); no expired entries in
  [docs/exceptions/README.md](../docs/exceptions/README.md) (expired exceptions block release).
- Release notes written ([release-notes/README.md](../release-notes/README.md)).
- Operational readiness satisfied
  ([operations/readiness-checklist.md](../operations/readiness-checklist.md)); post-deploy
  smoke test planned ([runbooks/release-smoke-test.md](../runbooks/release-smoke-test.md)).
- No red items in [waiver-register.md](waiver-register.md) without approval, and no
  release-blocking risks in [risk-register.md](risk-register.md) left undecided.

## Current release truths (verified 2026-07-12)

- **Paywall LIVE is NOT approved.** Decision of record: SANDBOX-GO, LIVE-conditional with 4
  open conditions (deployed HTTPS origin; Business account + `PAYPAL_ENV=live` only after
  sandbox sign-off; owner-signed en+ar consent/privacy/disclaimer copy revision; recorded live
  $0.50 smoke order + refund) —
  [docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md).
  Blank PayPal credentials (default) keep the game fully free.
- **Known stale item in the compact checklist:** item 9 of
  [docs/release-checklist.md](../docs/release-checklist.md) still says "no payment code",
  predating the recorded payments module — tracked in
  [technical-debt-register.md](technical-debt-register.md); the go/no-go record wins until the
  checklist is revised.
- Precedent for discipline: the Simple Code OS stream recorded "NO-GO for production release
  today" with all automated gates green, because owner UAT and release-owner approvals were
  pending ([docs/features/simple-readable-code-operating-system-implementation/22-go-no-go.md](../docs/features/simple-readable-code-operating-system-implementation/22-go-no-go.md)).
  Green gates alone never equal GO.
