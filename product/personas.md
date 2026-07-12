---
id: product-personas
title: User Personas (Recorded Evidence Only)
type: product
authority: canonical
status: current
owner: repository owner
summary: "The user personas recorded in feature business analyses — casual player, Arabic-speaking player, privacy-conscious player, sharer, link recipient — with gaps marked as deferred."
keywords: [personas, players, audience, arabic, privacy, sharer, recipient, anonymous]
contextTier: 2
relatedCode: [apps/web/src/modules/game]
relatedTests: [apps/web/e2e/game-flow.spec.ts, apps/web/e2e/share-flow.spec.ts]
relatedDocs: [docs/features/advanced-global-traits-v2/01-business-analysis.md, docs/features/temporary-shareable-results/01-business-analysis.md]
readWhen: You are shaping UX, copy, or scope and need to know which recorded users the product serves.
---

# User Personas (Recorded Evidence Only)

Twinzy has no accounts and no analytics identities, so personas come only from the recorded
business analyses in feature folders. This file aggregates them; the source artifacts stay the
owners of their own detail.

## Core game personas

From [docs/features/advanced-global-traits-v2/01-business-analysis.md](../docs/features/advanced-global-traits-v2/01-business-analysis.md):

| Persona | Goal | Desired outcome |
| --- | --- | --- |
| Casual player (mobile, shares results with friends) | A fun, believable style/vibe match worth sharing | Global matches with confidence, country/category, evidence traits, and mismatch warnings |
| Arabic-speaking player | Play fully in Arabic, switch language freely | All dynamic output in the active locale; locale switch translates the existing result in place, RTL preserved |
| Privacy-conscious player | Fun without surveillance mechanics | Visible, non-identifying trait fields with honest "unclear" values; image memory-only, never re-sent on language switch |

## Share-flow personas

From [docs/features/temporary-shareable-results/01-business-analysis.md](../docs/features/temporary-shareable-results/01-business-analysis.md):

| Persona | Goal | Desired outcome |
| --- | --- | --- |
| Sharer (finished a result, mobile) | Send the result to a friend in one tap | "Share result" mints a link and opens the OS share sheet / platform buttons |
| Recipient (opens the link, may not be a player yet) | See the fun result, understand it is playful and temporary | A public page with the result, live countdown, disclaimer, and a "create your own" invite |
| Privacy-conscious sharer | Share without anything being stored about them | Unguessable link, expires in minutes, stores no image and nothing identifying |

## Standing audience facts

- Players are **anonymous, en/ar, mobile-first**; with no accounts, satisfaction is visible
  only via usage and re-shares (stakeholder tables in both analyses above).
- The product is solo-owner: the repository owner is the sole approver for all gates.

## Gaps

- **Deferred — needs evidence:** a persona for a *paying* player. The paywall program
  ([monetization-policy.md](monetization-policy.md)) shipped with a compressed artifact trail
  and no recorded business-analysis personas
  ([docs/features/paypal-donations-and-paid-results/](../docs/features/paypal-donations-and-paid-results/00-intake.md)).
- **Deferred — needs evidence:** demographic or market sizing beyond "anonymous en/ar
  mobile-first players"; no research artifact exists in the repository.
