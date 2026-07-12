---
id: domain-readme
title: domain/ — Twinzy Domain Model (Canonical)
type: domain
authority: canonical
status: current
owner: repository owner
summary: Index of the canonical domain-knowledge area — the transient domain shapes, invariants, lifecycles, policies, and calculations of the Twinzy style/vibe game.
keywords: [domain, entities, invariants, lifecycle, state-machine, glossary, taxonomy, consent, safety, ranking]
contextTier: 2
relatedCode: [apps/api/src/modules, packages/shared/src]
relatedTests: [packages/shared/tests/schemas.test.ts]
relatedDocs: [context/glossary.md, context/architecture-map.md, docs/ai-safety.md]
readWhen: You need to find the right domain doc — a term, shape, invariant, lifecycle, or scoring rule.
---

# domain/ — Twinzy Domain Model (Canonical)

Twinzy is a consent-first, privacy-first AI style/vibe game with **no database — the API is
stateless by design** (see the privacy module doc comment: "Twinzy stores no user data by
design — there is deliberately no repository anywhere in this API",
`apps/api/src/modules/privacy/privacy.module.ts`). Every domain shape here is therefore
**transient**: it lives for one request, one SSE stream, or one TTL window.

This area owns the *domain* view. Architecture vocabulary is owned by
[context/glossary.md](../context/glossary.md); the AI pipeline mechanics by
[context/ai-context.md](../context/ai-context.md) and [docs/ai-safety.md](../docs/ai-safety.md);
normative rules by [rules/](../rules/README.md).

## Contents

| Doc | Owns |
| --- | --- |
| [ubiquitous-language.md](ubiquitous-language.md) | The domain terms used across code and docs |
| [glossary.yaml](glossary.yaml) | Machine-readable twin of the language doc |
| [entities.md](entities.md) | Transient domain shapes and their owning schema files |
| [invariants.md](invariants.md) | Enforced domain invariants with code citations |
| [policies.md](policies.md) | Where each decision policy lives in code |
| [state-machines.md](state-machines.md) | Analyze-request and share lifecycles |
| [calculations.md](calculations.md) | Scoring: styleVibeFitScore, verdicts, honesty caps |
| [result-ranking.md](result-ranking.md) | How final results are ordered and capped |
| [trait-taxonomy.md](trait-taxonomy.md) | The 16-category / 221-field visible-trait taxonomy |
| [consent-model.md](consent-model.md) | Literal-`true` consent: where checked, copy accuracy |
| [image-lifecycle.md](image-lifecycle.md) | THE canonical image-lifetime statement |
| [sharing-lifecycle.md](sharing-lifecycle.md) | Share-results TTL / creation / deletion |
| [language-lifecycle.md](language-lifecycle.md) | Language codes, response-language guard, translation |
| [safety-boundaries.md](safety-boundaries.md) | The four AI-safety enforcement layers |
| [failure-semantics.md](failure-semantics.md) | Typed error codes per stage, user-visible copy, refunds |

## Current product truth (2026-07-12)

Twinzy is **free by default**. An env-gated PayPal Orders v2 paywall exists
(`apps/api/src/modules/payments/`): capture-at-consumption, server-authoritative price, no
persistence; blank `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` (the default) means the gate
no-ops and the game is fully free (`apps/api/src/config/app-config.service.ts`
`isPaywallEnabled`). The recorded owner decision is
[docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)
(SANDBOX-GO; LIVE not approved — open conditions include the en+ar copy revision).
