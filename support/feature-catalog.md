---
id: support-feature-catalog
title: Feature Catalog — User-Visible Features and How to Tell If Enabled
type: support
authority: canonical
status: current
owner: repository owner
summary: Every user-visible feature, whether it is always-on or env-gated, and exactly which configuration value controls it.
keywords: [support, features, enablement, env, paywall, donate, clamav, share, i18n, pwa]
contextTier: 2
relatedCode:
  [
    apps/api/src/config/app-config.service.ts,
    apps/api/src/config/env.schema.ts,
    apps/web/src/packages/env/public-env.ts,
    .env.example,
  ]
relatedTests:
  [
    apps/api/src/tests/game-analyze-paywall.integration.test.ts,
    apps/web/src/modules/game/test/donate-and-payment-env.test.ts,
  ]
relatedDocs: [docs/env-vars.md, support/product-behavior-guide.md]
readWhen: You need to answer "is feature X on for this deployment?" or "why does one environment show payments/donate and another does not?"
---

# Feature Catalog — User-Visible Features and How to Tell If Enabled

The canonical env-var reference is [`docs/env-vars.md`](../docs/env-vars.md); this catalog maps features to their switch. Backend enablement is derived in `apps/api/src/config/app-config.service.ts`; frontend public values in `apps/web/src/packages/env/public-env.ts`.

## Always-on features (no switch)

| Feature | Notes |
| --- | --- |
| Core analyze game (upload → traits → matches) | Free by default; see paywall row below. Flow: [product-behavior-guide.md](./product-behavior-guide.md) |
| Live streaming progress (SSE) | `POST /api/v1/game/analyze/stream`; cancel supported (`apps/api/src/modules/game/`) |
| Result count 1–10, default 10 | Shared contract via `apps/web/src/modules/game/model/game.constants.ts` |
| Camera capture | Browser permission dependent (`apps/web/src/packages/camera/`) |
| English + Arabic (RTL), cookie-based | `apps/web/src/packages/i18n/`; result re-translation on locale switch |
| Temporary share links | Always available; TTL/caps are env-tuned (below) |
| Theme toggle (light/dark), PWA install | `apps/web/src/modules/ui-preferences/`, `apps/web/public/manifest.webmanifest` |

## Env-gated features

| Feature | Switch | Off state (default) | How to verify |
| --- | --- | --- | --- |
| **Paid analysis (paywall)** — backend gate | `PAYPAL_CLIENT_ID` **and** `PAYPAL_CLIENT_SECRET` both non-empty (`isPaywallEnabled`, `apps/api/src/config/app-config.service.ts`) | Both blank ⇒ game fully free, no payment code runs (`apps/api/src/modules/payments/application/payment-gate.service.ts` no-ops) | With the gate on, analyze without a valid order returns 402 `PAYMENT_REQUIRED` |
| **Paid analysis — payment UI** | `NEXT_PUBLIC_PAYPAL_CLIENT_ID` non-empty | Blank ⇒ no payment step rendered; free UI | Payment step appears between setup and processing (`payment-step.container.tsx`) |
| **Donate link (voluntary PayPal.me)** | `NEXT_PUBLIC_PAYPAL_ME_USERNAME` (strict pattern, letters/digits ≤50) | Empty ⇒ link hidden everywhere | "Donate" in header + "Support Twinzy on PayPal (voluntary)" on results (`apps/web/src/shared/helpers/donate-link.helper.ts`) |
| **ClamAV virus scanning** | `ENABLE_CLAMAV=true` (+ reachable clamd, `CLAMAV_HOSTS`/`CLAMAV_PORT`) | `false` ⇒ scan skipped | When true and scanner is down, uploads are rejected 503 — fail-closed by design (`apps/api/src/modules/file-security/application/virus-scan.service.ts`) |
| **Multi-provider AI routing** | `AI_ROUTE_{EXTRACTION,GENERATION,JUDGE,TRANSLATION}` + `<PROVIDER>_API_KEY` presence | Empty ⇒ Gemini-only chains (`GEMINI_MODEL*`) | [`docs/provider-routing.md`](../docs/provider-routing.md) |
| **AI shadow comparisons** | `AI_SHADOW_ENABLED` + sample rate/routes | Off; never affects user results | Metrics-only (`apps/api/src/modules/ai/adapters/ai-shadow.service.ts`) |
| **Swagger UI at `/docs`** | `ENABLE_SWAGGER` (default: on except production) | — | `GET /docs` serves |
| **Share-link tuning** | `SHARE_RESULT_TTL_SECONDS` (default 600), `SHARE_RESULT_MAX_PAYLOAD_BYTES`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_PUBLIC_BASE_URL` | Defaults per `.env.example` | Countdown on the share page reflects the TTL |

## Payment feature — approval status (owner decision of record)

Per `docs/features/paypal-donations-and-paid-results/22-go-no-go.md` (2026-07-12):

- The PayPal **Orders v2 paywall is SANDBOX-GO only**. **LIVE is NOT approved** — four recorded conditions remain open, including owner sign-off on revised en+ar consent/privacy/disclaimer copy (the shipped copy still says the game is completely free — see [known-issues.md](./known-issues.md)).
- Price is server-authoritative (`PAYMENT_PRICE_VALUE`/`PAYMENT_PRICE_CURRENCY`); capture happens at consumption with automatic refund on post-capture failure; nothing is persisted locally — PayPal is the ledger.
- The donate link (Workstream A) is GO since 2026-07-10 and can never gate results.
