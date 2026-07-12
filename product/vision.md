---
id: product-vision
title: Twinzy Vision — What It Is and For Whom
type: product
authority: canonical
status: current
owner: repository owner
summary: "Twinzy is a free-by-default, privacy-first, mobile-first AI game that turns one consented photo into playful public style/vibe matches from written visible traits only."
keywords: [vision, product, game, style, vibe, privacy, mobile, bilingual, free]
contextTier: 2
relatedCode: [apps/web/src/modules/game, apps/api/src/modules/game, packages/shared/src/constants/trait.constants.ts]
relatedTests: [apps/web/e2e/game-flow.spec.ts, apps/web/src/tests/pwa.test.ts]
relatedDocs: [docs/product-overview.md, context/product-context.md, README.md]
readWhen: You need the one-page answer to "what is Twinzy and who is it for" before touching product behavior.
---

# Twinzy Vision — What It Is and For Whom

## What Twinzy is

Twinzy is a playful, mobile-first web game ([docs/product-overview.md](../docs/product-overview.md),
[context/product-context.md](../context/product-context.md)). A player uploads one photo (or takes
one with the camera), gives explicit consent, and receives:

1. The **written visible traits** the AI read from the photo — a 221-field, 16-category
   taxonomy owned by
   [packages/shared/src/constants/trait-category.constants.ts](../packages/shared/src/constants/trait-category.constants.ts)
   (documented in [docs/ai-safety.md](../docs/ai-safety.md)).
2. **1–10 playful public style/vibe matches** (user-selected, default 10 —
   [packages/shared/src/constants/trait.constants.ts](../packages/shared/src/constants/trait.constants.ts)),
   each with a 0–100 style/vibe fit score, a strong/medium/weak verdict, localized reasons,
   and a permanent server-enforced disclaimer (see [game-rules.md](game-rules.md)).

It is **entertainment only**: results are framed as style/vibe fit, never as identity,
recognition, or biometrics ([context/product-context.md](../context/product-context.md);
enforcement in [constraints.md](constraints.md)).

## The load-bearing product promises

- **Privacy-first.** The photo lives in request memory only, is used solely for trait
  extraction, and is zero-filled in `finally`; every downstream step is text-only. Owner:
  [privacy-promises.md](privacy-promises.md) and
  [docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md).
- **Consent-first.** Nothing is processed before the explicit consent checkbox whose copy
  accurately describes the pipeline ([principles.md](principles.md)).
- **Free by default.** With blank PayPal credentials (the default) the game is fully free; an
  env-gated paywall exists but LIVE charging is not approved. Owner:
  [monetization-policy.md](monetization-policy.md).
- **No accounts, no database.** The API is stateless; nothing is stored server-side
  ([docs/privacy-and-data-retention.md](../docs/privacy-and-data-retention.md),
  [runbooks/README.md](../runbooks/README.md)).

## Who it is for

Anonymous, mobile-first players in English and Arabic — there are no accounts, so adoption is
visible only through usage and shares
([docs/features/advanced-global-traits-v2/01-business-analysis.md](../docs/features/advanced-global-traits-v2/01-business-analysis.md)).
Recorded personas live in [personas.md](personas.md). Share-link recipients are a deliberate
acquisition audience
([docs/features/temporary-shareable-results/01-business-analysis.md](../docs/features/temporary-shareable-results/01-business-analysis.md)).

It is a solo-owner product: the repository owner is product, engineering, and approval owner
for every gate (stakeholder tables in the business analyses above).

## Form factor

A Next.js PWA, installable from the browser
([apps/web/public/manifest.webmanifest](../apps/web/public/manifest.webmanifest), name
"Twinzy — Find your public vibe match"), designed from 320px up with en+ar (RTL) localization
([docs/mobile-pwa-standards.md](../docs/mobile-pwa-standards.md),
[localization-expectations.md](localization-expectations.md)).

## Where the older summaries lag

[docs/product-overview.md](../docs/product-overview.md) still says 15 traits, up to 4 matches,
and "no payments"; those specifics are superseded by the shipped 221-field taxonomy, the 1–10
result count ([README.md](../README.md),
[release-notes/twinzy-hardening-v3.md](../release-notes/twinzy-hardening-v3.md)), and the
recorded monetization decision ([monetization-policy.md](monetization-policy.md)).
