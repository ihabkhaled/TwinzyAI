---
id: support-known-issues
title: Known Issues — Live Register
type: support
authority: canonical
status: current
owner: repository owner
summary: The current, real known issues and behavior caveats support should recognize, each with affected players, workaround, and escalation rule.
keywords: [support, known-issues, caveats, paywall, copy, heic, share, restart, webhooks, staleness]
contextTier: 2
relatedCode: [apps/web/src/packages/i18n/messages/en.json, apps/api/src/config/env.schema.ts]
relatedTests: []
relatedDocs:
  [
    support/known-issues-template.md,
    docs/features/paypal-donations-and-paid-results/22-go-no-go.md,
    architecture/adrs/adr-003-horizontal-scaling-plan.md,
  ]
readWhen: Before answering a report that sounds familiar, and at the start of every release/hypercare window.
---

# Known Issues — Live Register

Format per issue follows [`known-issues-template.md`](./known-issues-template.md). Verified 2026-07-12. New per-release issues get their own file from the template; durable items live here.

## KI-1 — Paywall copy contradiction (release-gating, not player-visible by default)

- **Issue**: The shipped help/privacy copy states the game is completely free — `help.a4` "Nothing. The game is completely free." and `privacy.freeNote` "The game is completely free, so we never ask for payment details." (`apps/web/src/packages/i18n/messages/en.json`) — which contradicts a paywall-enabled deployment.
- **Affected players**: Only deployments with PayPal credentials configured; the default (free) deployment is consistent.
- **Workaround**: None needed while the paywall stays off (the default and the only approved production state).
- **Escalation rule**: This is recorded LIVE condition 3 in `docs/features/paypal-donations-and-paid-results/22-go-no-go.md` — owner sign-off on revised en+ar consent/privacy/disclaimer copy is required before charging real users. Any paywall-enabled deployment showing this copy must be reported to the repository owner immediately.

## KI-2 — HEIC/HEIF photos rejected (iPhone default format)

- **Issue**: HEIC is deliberately not accepted (no safe pure-JS decoder; `docs/file-upload-security.md`); iPhone default-format photos are rejected with the JPG/PNG/WebP message (415).
- **Affected players**: iPhone users with camera format "High Efficiency".
- **Workaround**: Camera setting "Most Compatible", or share/export as JPEG. See [upload-troubleshooting.md](./upload-troubleshooting.md).
- **Escalation rule**: None — working as designed (recorded LOW finding in `docs/security-review-report.md`).

## KI-3 — Share links vanish on API restart/redeploy

- **Issue**: Share records live in a single-instance in-memory TTL cache; restart clears them all (`apps/api/src/modules/share-results/infrastructure/in-memory-share-result-cache.repository.ts`).
- **Affected players**: Anyone holding a link created before a restart within its TTL window.
- **Workaround**: Create a fresh result/link. Expected around deploys.
- **Escalation rule**: None unless links die with no restart in the timeline — then treat as a defect.

## KI-4 — Payment webhook reconciliation not implemented (paywall scope)

- **Issue**: The Orders v2 paywall relies on synchronous capture verification; webhook reconciliation is recorded as recommended hardening before high volume, not implemented (`docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md` residual risk).
- **Affected players**: None at current (sandbox-only) scope.
- **Escalation rule**: Any "charged but no result" report on a paywall-enabled deployment escalates per [escalation-matrix.md](./escalation-matrix.md); a failed auto-refund logs "REFUND FAILED" with reconciliation done in the PayPal dashboard (`apps/api/src/modules/payments/application/payment-gate.service.ts`).

## KI-5 — Single-process in-memory platform state

- **Issue**: Concurrency limits, stream cancellation, and the share cache are in-memory and single-process by design; running multiple API instances would break them. Scaling is deliberately deferred until profiling proves need (`architecture/adrs/adr-003-horizontal-scaling-plan.md`).
- **Escalation rule**: Engineering-facing constraint; flag any multi-instance deployment plan to the repository owner.

## KI-6 — Stale legacy docs (engineering-facing)

- **Issue**: Several pre-knowledge-OS docs lag current behavior: `docs/product-overview.md` (15 traits / up to 4 matches / "no payments"), `docs/architecture.md` (`MAX_FINAL_RESULTS=5`), `docs/agent-code-map.md` (retired `game.manager.ts` / `features/game` paths), `docs/release-checklist.md` item 9 ("no payment code"), and a stale "vision capability" comment in `apps/api/src/config/env.schema.ts`. Current truth: 221 trait fields, 1–10 results (default 10), env-gated payments module.
- **Escalation rule**: Do not quote those files to players; prefer this support set and `README.md`. Doc sweep is owed to the repository owner.
