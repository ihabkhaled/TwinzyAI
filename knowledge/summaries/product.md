---
id: summary-product
title: Product Summary — What Twinzy Is
type: summary
authority: canonical
status: current
owner: repository owner
generated: false
summary: Routing digest of the Twinzy product — free-by-default AI style/vibe game, feature list with status, the env-gated paywall truth, and the non-negotiable constraints.
keywords: [product, twinzy, free game, paywall, donation, consent, share links, features, constraints, status]
contextTier: 1
relatedCode: [apps/api/src/modules/game/api/game.controller.ts, apps/api/src/modules/payments/application/payment-gate.service.ts, apps/web/src/modules/game/index.ts]
relatedTests: [apps/web/e2e/paywall.spec.ts, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [CLAUDE.md, docs/features/paypal-donations-and-paid-results/22-go-no-go.md, docs/privacy-and-data-retention.md, README.md]
readWhen: You need the current product truth — what Twinzy does, what is shipped, and what may never change.
---

# Product Summary — What Twinzy Is

Twinzy is a **free-by-default, privacy-first, mobile-first AI style/vibe game** (PWA, en + ar with RTL). The player consents, uploads/captures one photo, the backend extracts **written visible traits only**, and text-only AI steps suggest playful public-figure style/vibe matches (1–10 results, default 10) with a server-enforced disclaimer. Never identity, never biometrics, never sensitive inference. Product framing: `README.md`, `docs/agent-product-map.md` (partially stale — see `knowledge/summaries/current-risks.md`).

## Features and status

| Feature | Status | Owner record |
| --- | --- | --- |
| Analyze game (upload/camera → consent → SSE-streamed pipeline → results) | Shipped | `apps/api/src/modules/game/`, `apps/web/src/modules/game/` |
| 221-field/16-category trait taxonomy, 1–10 results | Shipped | `docs/features/advanced-global-traits-v2/`, `docs/features/twinzy-hardening-v3/` |
| Text-only result translation (en↔ar locale switch) | Shipped | `POST /api/v1/game/translate-result` (`apps/api/src/modules/game/api/game.controller.ts`) |
| Multi-tab SSE isolation + cancel + overload protection | Code-complete on main | `docs/features/multi-tab-stream-isolation/` |
| Temporary share links (UUID, in-memory TTL, no DB, no images) | Shipped | `docs/features/temporary-shareable-results/`, `apps/api/src/modules/share-results/` |
| Multi-provider AI routing (Gemini + 5 OpenAI-compat, env-only) | Implemented | `docs/provider-routing.md` |
| Voluntary PayPal.me donate link (env-driven, hidden when unset) | GO 2026-07-10 | `docs/features/paypal-donations-and-paid-results/00-intake.md` |
| Env-gated PayPal Orders v2 paywall | **SANDBOX-GO only** (2026-07-12) | `docs/features/paypal-donations-and-paid-results/22-go-no-go.md` |

## The paywall truth (most misunderstood area)

- Blank `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` (the default) ⇒ paywall **off** ⇒ every payment method no-ops and the game is fully free (`apps/api/src/config/app-config.service.ts` `isPaywallEnabled`; proven by `apps/web/e2e/paywall.spec.ts`).
- When both credentials are set: server-priced order (`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY`), **capture-at-consumption** inside the analyze run, field-by-field verification (status COMPLETED, exact amount/currency, `custom_id === requestId`), auto-refund on any post-capture failure, **no persistence** — PayPal is the ledger; webhooks optional (`apps/api/src/modules/payments/adapters/paypal.adapter.ts`).
- **LIVE mode is NOT approved.** Four open conditions recorded in `docs/features/paypal-donations-and-paid-results/22-go-no-go.md`: deployed public HTTPS origin; PayPal Business account + `PAYPAL_ENV=live` only after sandbox sign-off; owner-approved en+ar consent/privacy/disclaimer copy revision (the catalog still says "completely free"); one recorded live $0.50 smoke order + refund. A paypal.me link can never gate results (payment unverifiable — `06-technical-refinement.md`).

## Constraints that never relax (owners linked, not restated)

1. Consent-first; copy must match the pipeline — `rules/15-file-upload-security.md`, `knowledge/summaries/privacy.md`.
2. Image lives in request memory only, zero-filled in `finally`; only trait extraction sees it; everything downstream is text-only — `rules/14-ai-safety.md`, `docs/ai-safety.md`.
3. No identity assertions, no sensitive inference; every AI response Zod-validated + safety-filtered — `packages/shared/src/constants/safety.constants.ts`, `apps/api/src/modules/ai/application/ai-safety.service.ts`.
4. Models/caps env-only (`GEMINI_MODEL` never hardcoded) — `rules/25-configuration-and-environment.md`.
5. No TypeScript `enum`; no inline eslint suppression — `rules/00-non-negotiable-rules.md`, `rules/11-eslint-typescript.md`.
6. No database — the API is stateless (`apps/api/src/modules/privacy/privacy.module.ts` doc; `memory/database-decisions.md`).

Routes: `/` `/game` `/share/[shareId]` `/help` `/privacy` `/terms` (`apps/web/src/app/`). API surface: 9 endpoints under `/api/v1` — see `knowledge/summaries/backend.md`.
