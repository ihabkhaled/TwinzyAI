<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Paywall / PayPal / donation surfaces (owner-gated program)

Task type: `payments-change` · Lane: **critical** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Paywall is env-gated; blank credentials = free game. Never invert the default.
- Price is server-authoritative (PAYMENT_PRICE_VALUE); the client never sends an amount.
- Capture verifies status, amount, currency, and custom_id === requestId; failures refund.
- No persistence, no webhooks without updating the recorded program (22-go-no-go.md).
- LIVE mode stays forbidden until the four recorded conditions pass.

## Must-read docs

- docs/features/paypal-donations-and-paid-results/22-go-no-go.md — **GO** (2026-07-10). Evidence in `15-dev-validation-report.md`-equivalent below: (~784 tokens)
- docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md — Scope: the paid-analysis gate (create order → approve → capture-at-consumption → (~880 tokens)

## Rules

- rules/00-non-negotiable-rules.md — > These rules are enforced by [`tsconfig.base.json`](../tsconfig.base.json), [`eslint.config.mjs`](../eslint.config.mjs) (including the custom `architecture/*` plugin in [`/eslint`](../eslint)), Husky hooks, and code review. They are **m... (~3708 tokens)
- rules/06-security.md — > The house standard for securing a privacy-first, anonymous, stateless product. Twinzy has **no accounts, no auth, no database** — the attack surface is the upload pipeline, the AI boundary, and the HTTP edge. Implements rules 30–35 of ... (~1519 tokens)
- rules/25-configuration-and-environment.md — > All configuration is typed, zod-validated at startup, and read through `@nestjs/config` behind **`AppConfigService` — the only injectable config surface**. `process.env` never appears outside `config/` and `bootstrap/` (ESLint-enforced... (~1399 tokens)

## Skills

- skills/security-review.md
- skills/add-config-value.md

## Reviewers

- agents/backend-security-reviewer.md
- agents/frontend-security-reviewer.md

## Code entrypoints

- `apps/api/src/modules/payments/`
- `apps/web/src/packages/paypal/`

## Validation before done

- `npm run test:coverage`
- `npm run test:e2e:ci`
- `npm run security:scan:secrets`

## Notes

This is an owner-gated program. Read 22-go-no-go.md and 19-threat-model-paywall.md before any change; keep the .env.example price mirror (PAYMENT_PRICE_VALUE ↔ NEXT_PUBLIC_PAYMENT_PRICE_VALUE) intact.
