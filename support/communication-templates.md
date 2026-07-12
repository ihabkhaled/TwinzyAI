---
id: support-communication-templates
title: Communication Templates — Player-Facing Wording for Common Situations
type: support
authority: canonical
status: current
owner: repository owner
summary: Pre-approved reply templates for outages, rejections, sharing, privacy, and payment questions, aligned with the product's actual behavior and copy.
keywords: [support, templates, communication, replies, outage, upload, privacy, payments, wording]
contextTier: 2
relatedCode: [apps/web/src/packages/i18n/messages/en.json]
relatedTests: []
relatedDocs: [support/provider-outage-messaging.md, support/FAQ.md, release-notes/README.md]
readWhen: Drafting a player reply — adapt a template rather than improvising product claims.
---

# Communication Templates

Rules: never contradict the in-app copy or the disclaimer; never promise timelines you don't own; never suggest bypassing consent or validation; keep the playful style/vibe framing (`release-notes/README.md` wording rule). Facts behind each template are owned by the linked docs.

## T1 — AI temporarily unavailable (provider incident)

> Thanks for flagging this. Our vibe engine (the AI service behind the game) is temporarily having trouble, so analyses are failing with a "try again" message. Nothing of yours was lost — Twinzy doesn't store your photo or results — and the game usually recovers shortly. Please try again in a little while, using "Try again with the same photo" if it's offered.

(Behavior source: [provider-outage-messaging.md](./provider-outage-messaging.md).)

## T2 — Rate limited / busy

> The game limits how many analyses can run at once so it stays fast and fair for everyone. You've hit that limit for the moment — waiting a minute and trying again is all that's needed.

## T3 — Photo rejected (format)

> The game accepts JPG, PNG, or WebP photos up to 5 MB, one at a time. iPhone photos in the default "High Efficiency" (HEIC) format aren't supported — switching the camera to "Most Compatible" (Settings → Camera → Formats) or sharing the photo as a JPEG fixes it. These checks are safety features and can't be bypassed.

(Source: [upload-troubleshooting.md](./upload-troubleshooting.md).)

## T4 — Photo rejected (virus scan)

> Our file safety check couldn't clear that particular file, so the game refused it — that's it working as designed. Please try a different photo. Your file wasn't kept: photos only ever exist in memory during the check and are destroyed immediately.

## T5 — Share link expired

> Share links are deliberately temporary — they disappear after a short time (about 10 minutes by default) and are never stored permanently. That's part of the privacy design. The quickest fix is to play again and create a fresh link. Your photo is never part of a shared page.

(Source: [sharing-troubleshooting.md](./sharing-troubleshooting.md).)

## T6 — Privacy question

> Twinzy is built to know as little about you as possible. Your photo is processed in memory only to read visible traits (like hair and face shape) and is destroyed right after — it's never stored, never shared, and never used for face recognition or identity matching. Matching happens purely on the written traits. There are no accounts and no database, so there's nothing about you for us to keep or delete.

(Source: [privacy-and-data-handling.md](./privacy-and-data-handling.md); mirrors `privacy.*` copy in `apps/web/src/packages/i18n/messages/en.json`.)

## T7 — "My result says who I am" (safety escalation acknowledgment)

> Thank you for reporting this — we take it seriously. Twinzy never identifies anyone: results are playful style/vibe suggestions from written traits only. We've escalated the exact wording you saw to engineering for review. Could you share a screenshot of the result text?

(Then escalate SEV-1 per [escalation-matrix.md](./escalation-matrix.md) — do not wait for the screenshot.)

## T8 — Payment question (paywall-enabled deployments only)

> The price is set on our server and charged through PayPal only at the moment your analysis actually runs. If anything fails after payment, an automatic refund is issued. We don't store any payment details — PayPal holds the transaction record. If you believe you were charged without receiving a result, tell us the approximate time and we'll investigate immediately.

(Source: [FAQ.md](./FAQ.md) payment answer; "charged, no result" reports escalate SEV-1.)

## T9 — Donation link question

> That "Support Twinzy on PayPal (voluntary)" link is exactly what it says — an optional way to support the project via PayPal. It never unlocks anything, and the game never handles the money itself.

## T10 — Known-issue holding reply

> This is a known issue we're actively tracking ([known-issues.md](./known-issues.md) entry). Current guidance: [insert workaround from the entry]. We'll update this thread when it's resolved.
