---
id: product-user-facing-copy-principles
title: User-Facing Copy Principles
type: product
authority: canonical
status: current
owner: repository owner
summary: "Copy must be truthful about the pipeline, never make identity or sensitive claims, stay playful, ship in both languages, and be revised for the paywall before any live charging."
keywords: [copy, wording, consent, truthful, identity, disclaimer, tone, i18n, dark-patterns]
contextTier: 2
relatedCode: [apps/web/src/packages/i18n/messages/en.json, apps/web/src/packages/i18n/messages/ar.json, packages/shared/src/constants/safety.constants.ts]
relatedTests: [apps/web/src/tests/pwa.test.ts, apps/web/e2e/game-privacy.spec.ts]
relatedDocs: [product/monetization-policy.md, docs/ai-safety.md, rules/14-ai-safety.md]
readWhen: You are writing or reviewing any string a player will see.
---

# User-Facing Copy Principles

All copy lives in the i18n catalogs
([apps/web/src/packages/i18n/messages/en.json](../apps/web/src/packages/i18n/messages/en.json),
[ar.json](../apps/web/src/packages/i18n/messages/ar.json)) — see
[localization-expectations.md](localization-expectations.md) for the routing rules. These are
the principles the words themselves must obey.

## 1. Copy must never contradict the pipeline

"User-facing copy must never contradict the pipeline" is a product constraint
([CLAUDE.md](../CLAUDE.md), Twinzy constraint #2). The consent checkbox is the strictest case:
its text is a contract describing in-memory extraction and text-only matching, verified
accurate against the code ([privacy-promises.md](privacy-promises.md)). If behavior changes,
the copy changes in the same delivery stream.

## 2. No identity, biometric, or sensitive claims — anywhere

The forbidden phrasing lists
([packages/shared/src/constants/safety.constants.ts](../packages/shared/src/constants/safety.constants.ts),
policy in [rules/14-ai-safety.md](../rules/14-ai-safety.md)) apply to static copy as much as to
AI output: no "this is you", no lookalike/recognition/biometric language, no sensitive-topic
judgments. Static surfaces are checked too — the PWA test asserts no identity/biometric wording
([apps/web/src/tests/pwa.test.ts](../apps/web/src/tests/pwa.test.ts)), and release notes follow
the style/vibe promise ([release-notes/README.md](../release-notes/README.md)). A player
reporting that wording "read like recognition" is a SEV-1 escalation, never a ticket debate
([support/README.md](../support/README.md)).

## 3. Playful, honest, never clinical

Results are framed as playful style/vibe fit with the disclaimer always present
([game-rules.md](game-rules.md)). Honesty extends to uncertainty: traits may read "unclear"
rather than inventing observations
([packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts)).
Error copy is friendly and actionable — one distinct message key per scenario
([rules/12-i18n.md](../rules/12-i18n.md) Part B).

## 4. Money copy: voluntary means voluntary, and no dark patterns

The donate link must be labeled voluntary (its i18n copy says "(voluntary)" —
[docs/features/paypal-donations-and-paid-results/06-technical-refinement.md](../docs/features/paypal-donations-and-paid-results/06-technical-refinement.md)).
Dark-pattern copy was explicitly threat-modeled and rejected for both the donate link and the
paywall ([19-threat-model.md](../docs/features/paypal-donations-and-paid-results/19-threat-model.md),
[19-threat-model-paywall.md](../docs/features/paypal-donations-and-paid-results/19-threat-model-paywall.md)).
The payment step must state plainly that the result stays hidden until capture
([apps/web/src/modules/game/containers/payment-step.container.tsx](../apps/web/src/modules/game/containers/payment-step.container.tsx)).

## 5. Both languages, same truth

Every copy change lands in `en.json` and `ar.json` in the same stream
([localization-expectations.md](localization-expectations.md)).

## The open copy revision (recorded, owner-tracked)

The catalogs still contain "completely free / we never ask for payment details" strings while a
sandbox-approved paywall exists in code. This is **LIVE condition 3** of the recorded paywall
decision: the consent + privacy + disclaimer copy must be revised in both languages, with owner
sign-off, before any real charging
([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).
Until then the free-game copy is truthful only because the paywall is off by default — do not
enable credentials in any user-facing environment before the copy revision lands
([monetization-policy.md](monetization-policy.md)).
