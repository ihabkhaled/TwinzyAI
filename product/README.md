---
id: product-readme
title: product/ — Canonical Product Knowledge
type: product
authority: canonical
status: current
owner: repository owner
summary: "Index and read order for the canonical product-truth area: what Twinzy is, its rules, constraints, journeys, monetization status, and copy/localization/accessibility commitments."
keywords: [product, index, vision, constraints, journeys, monetization, terminology, personas, privacy]
contextTier: 2
relatedCode: [apps/web/src/modules/game, apps/api/src/modules/game]
relatedTests: [apps/web/e2e/game-flow.spec.ts]
relatedDocs: [docs/product-overview.md, context/product-context.md, CLAUDE.md]
readWhen: You need to know which product/ file owns a product-truth question before opening anything else.
---

# product/ — Canonical Product Knowledge

This area is the current-truth product canon for Twinzy, part of the canonical plane declared
in [knowledge/manifest.yaml](../knowledge/manifest.yaml). Each file owns one product concern;
link to the owner instead of restating it.

## Read order

1. [vision.md](vision.md) — what Twinzy is and for whom.
2. [principles.md](principles.md) — the six product principles.
3. [constraints.md](constraints.md) — the nine non-negotiable product constraints, as currently true.
4. [game-rules.md](game-rules.md) — the rules of the game itself (counts, scores, verdicts, disclaimer).
5. [user-journeys.md](user-journeys.md) — the real end-to-end flows.
6. [monetization-policy.md](monetization-policy.md) — THE canonical statement of paywall/donation status.
7. Everything else on demand (see the table).

## What each file owns

| File | Owns |
| --- | --- |
| [vision.md](vision.md) | Product identity, audience, current headline numbers |
| [principles.md](principles.md) | Consent-first, privacy-over-features, playful-not-identifying, free-by-default, mobile-first, bilingual |
| [personas.md](personas.md) | Recorded user personas and their evidence |
| [user-journeys.md](user-journeys.md) | Play, paid-analysis, translate, share, donate, PWA install flows |
| [game-rules.md](game-rules.md) | Result counts, scoring, verdict semantics, server-enforced disclaimer |
| [feature-catalog.yaml](feature-catalog.yaml) | Machine-readable feature list with live/env-gated status |
| [constraints.md](constraints.md) | The nine product constraints and where each is enforced |
| [non-goals.md](non-goals.md) | What Twinzy deliberately does not do |
| [terminology.md](terminology.md) | Canonical meanings of trait, candidate, judge, verdict, share link, request id, … |
| [privacy-promises.md](privacy-promises.md) | Each user-facing privacy promise and the code that enforces it |
| [localization-expectations.md](localization-expectations.md) | en+ar, RTL, every string through i18n |
| [accessibility-expectations.md](accessibility-expectations.md) | What the product commits to for a11y |
| [monetization-policy.md](monetization-policy.md) | Paywall program status, donation link, LIVE conditions |
| [user-facing-copy-principles.md](user-facing-copy-principles.md) | Truthful copy rules and the open paywall copy revision |

## Relationship to the older compact summaries

[docs/product-overview.md](../docs/product-overview.md) and
[context/product-context.md](../context/product-context.md) remain the historical one-paragraph
summaries and own what they state. Some of their specifics lag the shipped product (trait and
result counts, "no payments" — see [README.md](../README.md),
[game-rules.md](game-rules.md), and [monetization-policy.md](monetization-policy.md) for the
current owners). Governance policy itself is owned by [CLAUDE.md](../CLAUDE.md); this area owns
product truth, not delivery process.
