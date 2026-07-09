# 01 - Business Analysis

- **Request ID:** TWZ-SHARE-001
- **Feature:** temporary-shareable-results
- **Date:** 2026-07-08
- **Owner / Approver:** Ihab (product + engineering)
- **Track:** standard — major feature; a new public-facing surface, no AI-pipeline changes
- **Source:** owner product request (2026-07-08)

## Purpose

Establish the business case for adding a **temporary, database-free, self-expiring share link** and a multi-platform share modal to Twinzy — so a player can show a friend the actual result view, not just paste text — before implementation detail dominates the conversation.

## Step-by-Step Workflow

Executed for this request:

1. Business problem stated: the result is the shareable "wow" of a free viral game, yet there is no way to share the view itself — only a clipboard text copy. Done.
2. Stakeholders and personas identified (solo-owner product; anonymous players who want to share; the friend who opens the link). Done.
3. Current state (copy-text only) vs desired state (temporary UUID share page + share modal) described. Done.
4. Business value and success metrics quantified below. Done.
5. Assumptions, dependencies, and risks of not acting documented below. Done.

## Problem Statement

Twinzy is a free, anonymous, no-DB visual-similarity game whose entire payoff is a rich, playful result (up to five public-figure resemblances with scores, reasons, trait breakdowns, uncertainty, and a disclaimer). For a viral game, **sharing that result is the growth loop** — but today the only share affordance is `useShareResult.hook.ts`, which copies a short line of safe text to the clipboard. The consequences:

- **The best asset can't travel.** A friend who receives the copied text sees a sentence, not the actual result cards. There is no way to say "look at this" and have the other person see what you saw.
- **No link to open.** Modern sharing is a tap of the OS share sheet or a messaging app, landing on a page. Twinzy has no page to land on and no link to send.
- **Privacy tension if done naively.** The naive fix — a permanent shared page backed by a database — would violate the product's core invariants (no DB, no persistence, minimal retention). The business needs sharing **without** betraying the privacy posture that is the brand.

Who experiences it: every player who finishes a result and wants to show someone, plus the friend on the receiving end. Why it matters: shareability is the primary organic-growth lever for a free game, and doing it in a way that visibly preserves "nothing is stored, it disappears" is itself a trust signal.

## Stakeholders

| Stakeholder | Interest | Influence | Notes |
| --- | --- | --- | --- |
| Ihab (product + engineering owner) | Ship a shareable, safe, privacy-preserving link feature without breaking any invariant | High | Sole approver for all gates on this request |
| Players (anonymous, en/ar, mobile-first) | Show friends the real result quickly; trust that nothing is stored permanently | High (adoption) | No accounts — satisfaction visible only via usage and re-shares |
| Link recipients (may not be players yet) | Open a link, see a fun result, feel invited to try it | High (acquisition) | The "Create your own result" call-to-action converts them |
| Safety/privacy posture (product-defining) | No persistence, no image, no identity claims, minimal retention — unchanged | High | Non-negotiable per `CLAUDE.md`; a public share surface must not dilute it |

## User Personas

| Persona | Goal | Pain point today | Desired outcome |
| --- | --- | --- | --- |
| Sharer (finished a result, mobile) | Send the result to a friend in one tap | Only a text copy exists; the view can't be sent | "Share result" mints a link and opens the OS share sheet / platform buttons; the friend opens a page showing the full result |
| Recipient (opens the link) | See the fun result, understand it's playful and temporary | No link/page exists to receive | A clean public page with the results, a live countdown, the disclaimer, and a "Create your own result" invite |
| Privacy-conscious player | Share without anything being stored about them | A DB-backed share page would feel surveillance-y | The link is unguessable, expires in minutes, stores no image and nothing identifying, and visibly counts down to deletion |

## Current State vs Desired State

### Current state

- The result screen offers only `useShareResult` → copy safe text to clipboard; there is no link, no page, and no platform share sheet.
- There is no persistence of any kind (no DB) and no server-side representation of a "result to show later".
- Recipients cannot view a result they did not personally generate.
- All invariants hold: free, anonymous, no DB/auth/payments, no image persistence, safety-filtered output.

### Desired state

- **Create:** the result screen's "Share result" calls `POST /api/v1/share-results` with the existing validated `FinalGameResult`. The server re-validates it, re-runs the safety filter, **rejects any image/base64/`data:` content**, enforces a payload byte cap, generates a crypto-random UUID `shareId`, computes `expiresAt = now + TTL`, stores the record in a **bounded in-memory TTL cache**, and returns `{ shareId, shareUrl, createdAt, expiresAt, ttlSeconds }`.
- **Read:** `GET /api/v1/share-results/:shareId` validates the UUID and returns the active record (`{ shareId, languageCode, result, createdAt, expiresAt, remainingSeconds }`) or a safe not-found/expired error via `messageKey`. Expired records are never returned (lazy expiry on read + a periodic sweeper).
- **Public page:** `/share/{uuid}` fetches the record and renders the full result (result cards, scores, reasons, compact + optional detailed traits, uncertainty, disclaimer) with a **live 1-second countdown** derived from server `expiresAt`; loading / active / expired / not-found states; **never** the uploaded image; `noindex/nofollow` + a generic safe Open Graph card.
- **Share modal:** Web Share API first, with a fallback of copy-link plus URL-encoded deep links to WhatsApp, Telegram, Facebook, X, LinkedIn, Email, and Reddit; only the UUID appears in the URL; share text is localized; candidate names are never translated.
- **No new persistence:** the cache is memory-only, self-bounding (max active items + max payload bytes → reject new creates at capacity, so memory cannot grow unbounded), and cleared on shutdown. Redis/Valkey is documented as the drop-in production adapter behind the same port.
- **Invariants unchanged:** free game; no payments/accounts/auth/DB; no image bytes/url/hash/metadata/embeddings anywhere; no identity/biometric/exact-lookalike wording; every shared payload is Zod-validated and safety-filtered before it is stored or served.

## Business Goals

- Turn the result into something that actually travels: one-tap sharing to a page that shows the real result, driving organic reach and recipient-to-player conversion via a clear "Create your own result" call-to-action.
- Make privacy a visible feature, not a hidden cost: the link is unguessable, expires in minutes with a countdown the user can watch, stores no image, and asserts nothing about who anyone is — sharing that *strengthens* the "nothing is stored" brand.
- Do it without adding a database, accounts, auth, payments, or any image handling — preserving every product invariant and keeping the system stateless and reversible.
- Ship it as a swappable-cache design so a future multi-instance production can adopt Redis/Valkey behind the same port with zero call-site churn.

## KPI / Success Metrics

| Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- |
| Ways to share the result view | 1 (copy text only) | Link + OS share sheet + 7 platform targets | Feature present; component/e2e tests exercise each target's URL encoding |
| Result content that leaves the app as a viewable page | 0 | The full safe `FinalGameResult` via an expiring page | Create→read→render e2e proves the shared page shows results/scores/reasons/disclaimer |
| Image bytes/urls/hashes reaching the share surface | 0 | 0 (maintained) | Ingest rejects image/base64/`data:` fields; tests assert no image anywhere in payload, cache, response, or page |
| Server memory growth from sharing | N/A | Bounded — capped active items + payload bytes; creates rejected at capacity | Cache unit tests prove eviction/TTL/caps; no unbounded structure |
| Shared records surviving past their TTL | N/A | 0 — expired records never returned | Lazy-expiry-on-read + sweeper tests; integration create→wait→read returns not-found |
| Forbidden wording / identity claims on the public page | 0 | 0 (maintained) | Safety re-filter on ingest + frontend escaping + no `dangerouslySetInnerHTML`; tests |
| Quality gates on touched modules | green | lint 0/0, typecheck, coverage ≥95/90/95/95, knip, madge, trivy | `npm run validate` + evidence in `15-dev-validation-report.md` |

## Risks of Not Doing It

- The free game keeps leaking its growth loop: players who want to show a friend can only paste a sentence, so the most engaging asset never spreads and organic acquisition stays flat.
- Someone eventually builds sharing the wrong way (a DB-backed permanent page) under pressure, quietly breaking the no-persistence invariant and the privacy brand.
- Competing lookalike toys that *do* offer share pages look more modern and shareable, even though Twinzy's result is richer and safer.

## Assumptions

- **Memory-only cache is acceptable for the current single-instance deployment.** Redis/Valkey is the documented production path behind the same `ShareResultCachePort`; building it now would ship untested infra with no host to run against. Risk if wrong: multi-replica or restart drops links early — documented and accepted.
- **Reusing the full `FinalGameResult` as the create payload is preferable to a slim DTO.** It guarantees the shared page matches the result page and reuses the existing strict, safety-checked contract. Risk: larger bodies — bounded by `SHARE_RESULT_MAX_PAYLOAD_BYTES`.
- **Public-by-link is an accepted product decision.** No auth exists by invariant; the UUID is unguessable and the TTL is short. Anyone with the link sees the result until expiry — documented in privacy docs and product copy.
- **Nothing identifying is ever shared.** The payload is the visual-similarity result only (traits, resemblances, scores, disclaimer) — no image, no user identity, no account.
- **Rollback is trivial:** revert the feature commits; the system is stateless with no DB, and a redeploy also clears the in-memory cache.

## Dependencies

- The existing `FinalGameResultSchema` (`packages/shared/src/schemas/game-result.schema.ts`) as the create contract, and the shared safety constants (`packages/shared/src/constants/safety.constants.ts`) reused to re-filter on ingest.
- The typed, zod-validated, fail-fast config layer (`apps/api/src/config`) for the five new env vars; `.env.example` kept in sync (and local `.env` per the memory note).
- The existing `@nestjs/throttler` per-route rate-limit pattern; the `AppError` + `messageKey` error envelope; frontend i18n (next-intl, en/ar), RTL, and theme infrastructure.
- Engineering OS gates (ESLint incl. architecture plugin, tsgo typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy) must stay green throughout.

## Exit Checklist

- [x] Business problem is explicit
- [x] Stakeholders and personas identified
- [x] Current and desired state defined
- [x] Success metrics defined
- [x] Risks of not delivering documented
- [x] Assumptions and dependencies visible

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Business owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Product invariants: root `CLAUDE.md` "Twinzy Product Constraints"; `rules/14-ai-safety.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`
- Reused contract + safety canon: `packages/shared/src/schemas/game-result.schema.ts`, `packages/shared/src/constants/safety.constants.ts`
- Existing share affordance being extended: `apps/web/src/modules/game/hooks/useShareResult.hook.ts`, `components/share-button.component.tsx`
- Related artifacts: `docs/features/temporary-shareable-results/00-intake.md` (TWZ-SHARE-001) and subsequent phase artifacts in this folder
- Stakeholder interviews / support tickets / KPI dashboards: Not applicable — solo-owner pre-scale product with no account system or support ticket stream; the owner request is the consolidated stakeholder input (accepted by Ihab)

## Phase Blockers

Do not close this phase if:

- the problem statement still describes only a requested solution and not the business pain — **clear: pain is that the result view cannot travel and the safe way to share it (no DB) does not exist yet**
- there is no measurable success definition — **clear: KPI table above**
- impacted users are still vague — **clear: sharer, recipient, privacy-conscious player**
- the cost of not doing the work is unstated — **clear: risks section above**

No blockers remain. Phase closed 2026-07-08 (Ihab).
