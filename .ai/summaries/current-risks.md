<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/summaries/current-risks.md -->

# Current Risks Summary — Open Conditions, Debt, Staleness, Exposure

Verified against the 2026-07-12 invariant sweep (HEAD `5cd43f6`).

## 1. Paywall LIVE conditions — OPEN (highest-visibility gate)

Status is **SANDBOX-GO only** (`docs/features/paypal-donations-and-paid-results/22-go-no-go.md`). Four recorded conditions before LIVE: (1) deployed public HTTPS origin; (2) PayPal Business account + `PAYPAL_ENV=live` only after sandbox sign-off; (3) owner sign-off on revised en+ar consent/privacy/disclaimer copy — the i18n catalog still says "completely free"/"never ask for payment details" while the payment step charges `{price}` (`apps/web/src/packages/i18n/messages/en.json`); (4) one recorded live $0.50 smoke order + refund. Additional facts: a premature live paid-run attempt failed with PayPal `COMPLIANCE_VIOLATION` (commit `5cd43f6` message) — the go/no-go conditions govern; **webhook reconciliation is not implemented** (recorded as recommended before high volume, `19-threat-model-paywall.md`).

## 2. Stale-mirror / stale-policy cleanup (recorded contradiction backlog)

The owner-approved payments supersession has not been propagated to policy text. Stale versus code + `22-go-no-go.md`:
- `CLAUDE.md` constraint #1 still lists "webhooks, durable order store" as paywall gates (dropped by the 2026-07-12 decision).
- All agent mirrors: `AGENTS.md`, `codex.md`, `cursor.md`, `.cursorrules`, `.cursor/rules/non-negotiables.mdc`, and `KIMI/GEMINI/GLM/QWEN/DEEPSEEK/OPENAI/ANTHROPIC/MISTRAL.md` still assert "no payment capture".
- `rules/00-non-negotiable-rules.md` rule 42 ("not even scaffolding") missed both the 2026-07-10 donate revision and the paywall.
- `.env.example` internal inconsistencies: `PAYMENT_PRICE_VALUE=0.01` vs `NEXT_PUBLIC_PAYMENT_PRICE_VALUE=0.50` (despite the "mirror" comment), `PAYPAL_ENV=live` example vs sandbox default, "paid gating remains forbidden" comment.
- Memory files asserting no-payments-ever: `memory/privacy-decisions.md`, `memory/security-decisions.md`, `memory/event-notification-decisions.md` Decision 4, `memory/library-boundaries.md` "no payment SDK", `docs/release-checklist.md` item 9.
Rule: the recorded owner decision wins; canonical files must be updated first, mirrors in the same stream (`rules/30-refactor-discipline.md`).

## 3. SDLC artifact debt

`docs/features/paypal-donations-and-paid-results/` holds only 6 artifacts (00, 06, 19×2, 22, 25-sandbox-verification); the paywall shipped without 03/08–13/15/17/23 required by `CLAUDE.md` phase policy — recorded process debt. Also: `simple-readable-code-operating-system-implementation` is code-complete but its 22-go-no-go records **NO-GO for production release** (owner UAT/client/go-live approvals pending) and 25-release-report records deployment NOT EXECUTED; `twinzy-hardening-v3` and `multi-provider-ai` have compressed trails (no QA/UAT/go-no-go artifacts in folder).

## 4. Provider-outage / scaling exposure

- Extraction is **hardcoded Gemini-only** (fail-closed vision routing) — a Gemini outage stops the whole pipeline regardless of configured fallback providers; text steps can hop providers, extraction cannot (`apps/api/src/modules/ai/adapters/provider-registry.service.ts`). Runbook: `runbooks/ai-provider-outage.md`.
- All admission/cancel/share state is single-process in-memory; restart drops active streams and share links; horizontal scaling deliberately deferred (ADR-003).
- No webhooks for payment reconciliation (see §1); refund failures are logged for manual PayPal-dashboard reconciliation (`payment-gate.service.ts`).

## 5. Stale docs and code comments (verified drift; code is correct unless noted)

- `docs/product-overview.md` (15 traits / 4 matches / "no payments"), `docs/architecture.md` (`MAX_FINAL_RESULTS=5`), `docs/agent-product-map.md` ("up to 4", "no upsells"), `docs/agent-code-map.md` (`game.manager.ts`, `features/game`), `docs/release-checklist.md` item 9 — all lag the 221-field / 1–10-results / payments-module reality.
- `TEST_CASES.md` cites promptVersion `advanced-global-traits-v3`; shipped literal is `written-traits-v5`.
- Code comments: `env.schema.ts` phantom "vision declarations" block; `result-aggregation.service.ts` "caps at 5"; `matching-evidence.types.ts` "alongside the photo".
- Knowledge folders: `context/codebase-navigation.md` + `memory/library-boundaries.md` describe the obsolete `features/`+`lib/` frontend anatomy; `memory/database-decisions.md`/`memory/project-architecture.md` claim "infrastructure/ folders stay empty" (two repositories exist); `memory/ai-context-map.md` claims AGENTS.md is canonical (CLAUDE.md is); `context/frontend/glossary.md` permits "documented" inline eslint-disable (contradicts the absolute ban — the ban wins); `memory/frontend/security-decisions.md` claims a Trivy LOW floor (actual gate is HIGH/CRITICAL); `memory/README.md` index is missing newer files.
- `packages/shared/dist/` is partially stale (compiled artifacts with no src counterpart) — rebuild before trusting; `npm run build:shared` before lint/tests.
- Unexercised contract member: the SSE `heartbeat` event exists in schema but the wire uses comment keep-alives.

## 6. Recorded exceptions (never authorize inline suppression)

`docs/exceptions/README.md`: EXC-0001 (sonarjs hardcoded-passwords off; Trivy owns secrets), EXC-0002 (detect-object-injection off), EXC-0003 (English fallback copy in `global-error.tsx`); EXC-0004 superseded. Expired exceptions block release.
