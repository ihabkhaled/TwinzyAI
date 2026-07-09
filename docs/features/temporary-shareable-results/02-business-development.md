# 02 - Business Development / Commercial Impact

- **Request ID:** TWZ-SHARE-001
- **Feature:** temporary-shareable-results
- **Date:** 2026-07-08
- **Owner / approver:** Ihab (product + engineering)
- **Track:** standard

## Purpose

Confirm the request makes sense strategically for Twinzy. The game is free by invariant — there is no pricing, billing, or upsell dimension — so "commercial impact" here means viral growth, engagement and shareability, recipient-to-player conversion, brand trust in the privacy posture, and the (small) server-memory cost of the temporary cache. This phase records why a temporary, no-DB share link and multi-platform share modal are strategically worth building.

## Step-by-Step Workflow

1. Identify the target customer, account, market, or internal business segment. — Done: anonymous free players who want to share, plus the non-player recipients they invite.
2. Explain the commercial or strategic value. — Done: see Commercial Value.
3. Review contract, SLA, pricing, or partnership impact. — Done: none exist for this product; see Contract and SLA Impact.
4. Define rollout audience. — Done: all players, single stage, after local + e2e validation.
5. Evaluate adoption and enablement risk. — Done: see Adoption Risks.

## Commercial Value

Twinzy has no revenue lever (free, anonymous, no accounts, no DB — non-negotiable). The value of this feature is growth and trust:

- **Viral growth loop (acquisition).** Sharing is how a free game grows. A tap-to-share link that lands a friend on a real result page — with a "Create your own result" call-to-action — turns every satisfied player into a distribution channel. This is the single highest-leverage growth mechanic the product can add without touching monetization.
- **Engagement and shareability (retention).** A one-tap share sheet plus platform buttons (WhatsApp/Telegram/Facebook/X/LinkedIn/Email/Reddit) meets players where they already share, instead of forcing a clumsy manual copy. Sharing something you're proud of also increases replay.
- **Privacy as a differentiator (brand trust).** The share page is *temporary by design*: an unguessable UUID, a visible countdown, minutes-long TTL, no image, nothing identifying, `noindex/nofollow`. "It disappears — nothing is stored" is a concrete, demonstrable trust signal that most share features cannot claim. The feature markets the privacy posture rather than eroding it.
- **Reach without infrastructure cost.** Share targets are static, URL-encoded web intents — no third-party SDKs, no analytics pixels, no partner integrations, no per-share cost. The only running cost is a small, bounded amount of server memory for the TTL cache.
- **Future scalability at low commitment.** The cache sits behind `ShareResultCachePort`, so a future multi-instance production swaps in Redis/Valkey with no call-site churn. The business gets the growth feature now and keeps the scale path open without paying for infra it does not yet run.
- **Cost awareness (the honest downside).** The temporary cache consumes server memory per active link. This is bounded by `SHARE_RESULT_MAX_ACTIVE_ITEMS` (default 1000) and `SHARE_RESULT_MAX_PAYLOAD_BYTES` (default 50000) with creates rejected at capacity, so the cost is capped and predictable. Accepted as a small, bounded price for the growth gain.

## Target Segment or Accounts

| Segment / account | Why it matters | Expected impact |
| --- | --- | --- |
| All current anonymous players (mobile-first) | Sharing is the core growth and engagement driver | More shares, more return plays |
| Non-player link recipients | Each opened link is an acquisition opportunity | Recipient-to-player conversion via "Create your own result" |
| Privacy-conscious players | Temporary, no-image, no-identity, self-deleting share is a trust signal | Deeper trust and willingness to share |
| Future multi-instance / scaled deployment | Redis-ready port keeps the scale path open | Low-cost expansion when traffic warrants it |

## Contract and SLA Impact

- Contractual requirement: no — Not applicable in substance: Twinzy is a free anonymous game with no clients, contracts, partners, or paid commitments (accepted by Ihab).
- SLA implication: none formal. Soft expectation only: create/read latency stays low (a bounded in-memory lookup), and the share page loads fast on mobile; the share cache must never grow unbounded or leak memory.
- Delivery commitment date: none.
- Penalty or risk if missed: none contractual; the only cost of not shipping is a free game that keeps leaking its growth loop through copy-text-only sharing.

## Rollout Audience

- [x] Internal only (local/staging) — first: full local validation (unit/integration/e2e create→open→countdown→expired) before exposure
- [ ] Pilot testers
- [ ] Beta cohort
- [x] All players — single-stage release once gates are green; the app is stateless with no DB, and rollback is a plain revert of the feature commits (a redeploy also clears the in-memory cache)
- [ ] Region-specific rollout — Not applicable: no region gating exists or is needed; the share page is localized per-request via the stored `languageCode`, not per-deployment (accepted by Ihab)

## Adoption Risks

- **Recipients confused by expiry:** a link that "stops working" could read as a bug. Mitigated by an explicit live countdown, a clear localized expired state, and a "Create your own result" call-to-action on every state.
- **Multi-instance link misses (future):** if production ever runs multiple replicas on the memory adapter, a link created on one instance won't resolve on another. Mitigated by documenting the single-instance constraint now and the Redis adapter as the scale path; not a launch risk for the current deployment.
- **Perceived over-sharing risk:** users may worry the link is public. Mitigated by messaging that the link is unguessable, expires in minutes, shows no photo, and identifies no one — and by `noindex/nofollow` so it is never indexed.
- **Share-target breakage:** platform web-intent URLs occasionally change. Mitigated by keeping targets as simple URL-encoded deep links (no SDKs), a Web Share API primary path, and a copy-link fallback that always works.
- **Memory pressure under a burst:** many simultaneous shares could pressure memory. Mitigated by hard caps (max active items + max payload bytes) that reject new creates at capacity with a safe error, plus TTL/sweeper reclamation.

## Go-To-Market / Enablement Notes

No sales, pricing, or partner enablement exists or is permitted (free game). Enablement is product-side only:

- Update README "How it works" / sharing section to describe temporary, self-expiring, no-DB sharing (unguessable link, countdown, no image, nothing stored permanently).
- Release notes required: behavior is user-visible (a new share modal, a new public share page, a countdown, an expired state).
- Support is Ihab-operated; no external support training needed. The public page's disclaimer and the countdown are the in-product communication that this is a playful, temporary, non-identifying artifact.
- No migration support needed: stateless, no DB, no stored user data; the only "state" is a short-lived in-memory record that self-deletes.

## Exit Checklist

- [x] Commercial value documented
- [x] Target segment identified
- [x] Contract or SLA impact reviewed (none exist; recorded as not applicable)
- [x] Rollout audience chosen (all players, after internal validation)
- [x] Adoption risks documented

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Business owner | Ihab | approve | 2026-07-08 |

## Evidence And References To Attach

- Sibling artifacts: `docs/features/temporary-shareable-results/00-intake.md`, `01-business-analysis.md` (request TWZ-SHARE-001)
- Product invariants: root `CLAUDE.md` "Twinzy Product Constraints" (free game, no DB, no persistence)
- Config knobs that bound the cost: `SHARE_RESULT_TTL_SECONDS`, `SHARE_RESULT_MAX_ACTIVE_ITEMS`, `SHARE_RESULT_MAX_PAYLOAD_BYTES` (see `05-delivery-plan.md`, `13-implementation-readiness.md`)
- Contract extracts / SLA notes / account commitments: Not applicable — no contracts or accounts exist for this free product (accepted by Ihab)
- Rollout segmentation reference: single-stage all-players release recorded above

## Phase Blockers

Reviewed against the blocker list — none apply:

- Strategic framing is explicit (viral growth, engagement, recipient conversion, privacy-as-differentiator, bounded cost).
- Rollout audience is defined (all players after internal validation).
- Contractual impact was checked and is genuinely absent, not assumed.
- Adoption risks are documented with mitigations.

Phase closed: proceed to `03-product-requirements.md`.
