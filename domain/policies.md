---
id: domain-policies
title: Domain Policies — Where Each Decision Lives
type: domain
authority: canonical
status: current
owner: repository owner
summary: Locator for the decision logic — safety filter policy, route-hop policy, refund-on-failure, region hints, display gate, consent, language normalization — one owning file each.
keywords: [policies, decision-logic, safety-filter, route-hop, refund, region-hint, display-gate, consent, normalization]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/application/ai-safety.service.ts, apps/api/src/modules/ai/model/ai-router.constants.ts, apps/api/src/modules/payments/application/payment-gate.service.ts, apps/api/src/modules/ai/model/region-hint.constants.ts]
relatedTests: [apps/api/src/modules/ai/tests/ai-safety.service.test.ts, apps/api/src/modules/ai/tests/ai-router.service.test.ts, apps/api/src/modules/payments/tests/payment-gate.service.test.ts]
relatedDocs: [docs/ai-safety.md, docs/provider-routing.md, domain/failure-semantics.md]
readWhen: You need to change or reason about a domain decision rule and must find its single owning file.
---

# Domain Policies — Where Each Decision Lives

Each policy has exactly one owning file. Change the policy there; never fork a second copy.

## Safety filter policy

**Decision:** when AI output contains forbidden wording, reject or degrade?
**Owner:** `apps/api/src/modules/ai/application/ai-safety.service.ts`.

- Trait-extraction and translation text: ANY hit rejects the **whole response**
  (`AI_RESPONSE_UNSAFE`); only the matched phrase is logged.
- Candidates and judged results: only the offending **item is dropped**; the pipeline degrades
  gracefully, ending in the fallback result if nothing safe remains.
- The word lists and scanner are owned elsewhere — see
  [safety-boundaries.md](safety-boundaries.md); full detail in
  [docs/ai-safety.md](../docs/ai-safety.md).

## Route-hop policy (AI provider fallback)

**Decision:** when does a failed model call try the next `provider:model` entry?
**Owner:** `apps/api/src/modules/ai/model/ai-router.constants.ts`
(`ROUTE_HOPPABLE_ERROR_CODES`) applied by
`apps/api/src/modules/ai/adapters/ai-router.service.ts`.

- Hop only on `AI_RATE_LIMITED`, `AI_PROVIDER_UNAVAILABLE`, `AI_TIMEOUT`,
  `AI_RESPONSE_INVALID`; aborted signals and non-AppErrors propagate immediately.
- Chain exhaustion → 429 if any hop was rate-limited, else 502
  (`ai-router.service.ts`, lines 130–133).
- Photo-carrying calls are fail-closed to Gemini-only entries
  (`apps/api/src/modules/ai/adapters/provider-registry.service.ts`, `usableEntriesFor`,
  line 82). Routing/env semantics are owned by
  [docs/provider-routing.md](../docs/provider-routing.md).

## Refund-on-failure policy

**Decision:** what happens to money when a paid run does not deliver?
**Owner:** `apps/api/src/modules/payments/application/payment-gate.service.ts`
(`refundOnFailure`).

- Both analyze use-cases wrap the whole pipeline: any error after capture — AI failure,
  timeout, cancel, disconnect — triggers a best-effort refund of the undelivered run
  (`apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`, lines 61–66;
  `analyze-game.use-case.ts`).
- A refund failure logs a reconcile-in-PayPal-dashboard warning and never masks the original
  error (`payment-gate.service.ts`).

## Region-hint policy

**Decision:** which regional industries does candidate recall treat as first-class?
**Owner:** `apps/api/src/modules/ai/model/region-hint.constants.ts`
(`REGION_HINT_BY_LANGUAGE`).

- Derived from the user's **chosen UI language** (a stronger signal than `Accept-Language`):
  `en` = global sweep; `ar` = Arabic-speaking industries first-class alongside global pools.
- Coverage hint only — the prompt states it must NEVER constrain who may appear.

## Display-gate policy

**Decision:** which judged results the user may see.
**Owner:** `apps/api/src/modules/result-aggregation/lib/result-aggregation.helpers.ts`
(`isDisplayableResult`): `shouldDisplay` ∧ verdict ≠ `weak` ∧ score ≥ `MIN_DISPLAY_SCORE` (70)
∧ `safetyCheck.meetsMinimumEvidence`. See [result-ranking.md](result-ranking.md).

## Consent policy

**Decision:** what counts as consent and when it is checked.
**Owner:** `apps/api/src/modules/game/lib/consent.ts` +
`apps/api/src/modules/file-security/application/file-security.service.ts` (checked first).
See [consent-model.md](consent-model.md).

## Paywall gate policy

**Decision:** whether an analyze run requires payment.
**Owner:** `apps/api/src/modules/payments/application/payment-gate.service.ts` gated by
`isPaywallEnabled` (`apps/api/src/config/app-config.service.ts`, lines 263–265: both
`PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` non-empty). Off (default) = every payment method
no-ops and the game is free. Recorded decision:
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md).

## Language normalization policy

**Decision:** lenient vs strict handling of the requested language.
**Owner:** `packages/shared/src/constants/language.constants.ts`
(`normalizeLanguageCode`): the analyze path NORMALIZES anything to a supported code
(`apps/api/src/modules/game/lib/request-language.ts`); the translate endpoint REJECTS
unsupported codes strictly (`packages/shared/src/schemas/translate-result.schema.ts`).
See [language-lifecycle.md](language-lifecycle.md).

## Cancellation match policy

**Decision:** who may cancel a running analysis.
**Owner:** `apps/api/src/core/streaming/stream-registry.service.ts` — abort only on an exact
`streamId` + `tabId` + `requestId` match; a mismatch is a silent no-op, so one tab can never
cancel another's run.
