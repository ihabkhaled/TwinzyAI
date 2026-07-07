# 01 - Business Analysis

- **Request ID:** TWZ-V2-001
- **Feature:** advanced-global-traits-v2
- **Date:** 2026-07-07
- **Owner / Approver:** Ihab (product + engineering)
- **Track:** standard — major feature; safety-critical surfaces touched (prompts, schemas)
- **Source:** `D:\Freelance\TwinzyV2.md` (full V2 specification)

## Purpose

Establish the business case for upgrading Twinzy from the current 15-flat-trait, max-4-result game into an advanced multilingual pipeline (221 nested trait fields, up to 5 global candidates, strict judge, translate-without-re-analysis) before any implementation detail dominates the conversation.

## Step-by-Step Workflow

Executed for this request:

1. Business problem stated from the V2 spec — shallow matches, single-language dynamic output, no safe language switch. Done.
2. Stakeholders and personas identified (solo-owner product; anonymous players in en/ar). Done.
3. Current state (15 traits, 4 results, no translate endpoint) vs desired state (V2 pipeline) described. Done.
4. Business value and success metrics quantified below. Done.
5. Assumptions, dependencies, and risks of not acting documented below. Done.

## Problem Statement

Twinzy's free, anonymous, no-DB style/vibe game currently extracts only 15 flat traits and returns at most 4 results. The consequences:

- **Matches feel shallow and generic.** With 15 traits there is little evidence behind a match; reasons read as vague, replay/share value is low, and confident-sounding scores are not actually earned by the data.
- **Dynamic AI content is not properly localized.** Static UI is localized via next-intl, but AI-generated reasons, notes, fallbacks, and disclaimers do not flow a `languageCode` through the pipeline — Arabic players get a second-class, potentially mixed-language result.
- **Switching language after a result is broken by design.** The only way to get the result in another language would be re-uploading and re-analyzing the image — worse privacy posture (image re-transmitted), doubled Gemini cost and latency, and against the product's image-memory-only ethos.
- **The candidate pool and scoring lack rigor.** No structured global coverage (all regions/categories), no strict judge pass to penalize overconfidence or unclear images, no honest uncertainty surfaced to the player.

Who experiences it: every player, most acutely Arabic-locale players and anyone who wants to understand *why* a match was suggested. Why it matters: match credibility, localization quality, and privacy-respecting language switching are the product's core playability and trust levers.

## Stakeholders

| Stakeholder | Interest | Influence | Notes |
| --- | --- | --- | --- |
| Ihab (product + engineering owner) | Ship a credible, safe, localized V2 without breaking any invariant | High | Sole approver for all gates on this request |
| Players (anonymous, en/ar, mobile-first) | Richer, honest, fully localized results; instant language switch; privacy preserved | High (adoption) | No accounts — satisfaction visible only via usage and feedback |
| Google Gemini (external dependency) | N/A (vendor) | Medium | Model behavior, quota, and JSON reliability constrain the design; `GEMINI_MODEL` from `.env` with fallback chain |
| Safety/privacy posture (product-defining) | No face recognition, no identity claims, no image persistence — unchanged | High | Non-negotiable per `CLAUDE.md` Twinzy constraints; V2 must not dilute it |

## User Personas

| Persona | Goal | Pain point today | Desired outcome |
| --- | --- | --- | --- |
| Casual player (mobile, shares results with friends) | A fun, believable style/vibe match worth sharing | 15 flat traits → generic matches with weak "why"; max 4 results | Up to 5 global matches with confidence, country/category, evidence traits, and mismatch warnings |
| Arabic-speaking player | Play fully in Arabic, switch language freely | Dynamic AI text not localized; locale switch cannot translate an existing result | All dynamic output in the active locale; locale switch translates the existing result in place, RTL preserved |
| Privacy-conscious player | Fun without surveillance mechanics | Trusts the game but richer analysis could imply creepier tech | 221 *visible, non-identifying* trait fields with honest "unclear" values and uncertainty notes; image still memory-only, never re-sent on language switch |

## Current State vs Desired State

### Current state

- Prompt 1 extracts 15 flat traits; Prompt 2/3 produce up to `MAX_FINAL_RESULTS = 4` results.
- No `languageCode` flows through request → DTO → prompts → responses; dynamic AI text is effectively single-language.
- No translation capability: a locale switch after a result leaves stale-language dynamic content or would force full re-analysis (image re-upload).
- Frontend shows a flat result; no compact summary chips, no grouped detailed traits, no image-quality/uncertainty section.
- All safety invariants already hold (free, anonymous, no DB, image memory-only wiped in `finally`, text-only candidate/judge prompts, Zod + safety filtering).

### Desired state

- **Prompt 1:** 221 visible non-identifying trait fields across 16 nested categories (imageQuality → styleVibeDescriptors) + uncertaintyNotes (4 bounded arrays) + compactTraitSummary (20–35) + traitCount + safetyCheck; targets 100+ filled traits when image quality allows; unclear fields carry a localized "unclear"; fully localized to the requested `languageCode`.
- **Prompt 2:** up to 5 global public-figure candidates (all regions and public categories) with confidenceLevel, globalPopularityLevel, aligned/mismatch trait arrays, localized reasons, conservative scoring (90+ rare).
- **Prompt 3:** strict judge — rescores, penalizes overconfidence and unclear images, removes unsafe/weak candidates, returns up to 5 final results (confidence, verdict, countryOrRegion, publicCategory, localized finalReason, top/secondary/weak traits, mismatchWarnings, judgeNotes, shouldDisplay) + removedCandidates + localized fallback + mandatory disclaimer.
- **NEW Prompt 4 + `POST /api/v1/game/translate-result`:** translate an existing structured result to a target language with **no image and no re-analysis**; names/scores/ranks preserved by server-side overwrite; disclaimer/fallback are server-enforced localized constants; rate-limited.
- **Language flow:** frontend active locale → multipart analyze request → DTO (normalized to default when invalid) → all prompts → all responses (`en|ar` today, extensible).
- **Frontend:** compact summary chips, trait count, grouped accessible accordion (new ui-primitives Accordion with aria-expanded/aria-controls/keyboard support), image-quality & uncertainty section, top-5 result cards, localized disclaimer, translate-on-locale-switch with loading state and failure-keeps-old-result; RTL/dark-mode/mobile-first preserved; no image persistence.
- **Invariants unchanged:** free game; no payments/accounts/auth/DB; image memory-only and wiped in `finally`; only trait extraction sees the image; candidate/judge/translation prompts are text-only; `GEMINI_MODEL` from `.env`; every AI output Zod-validated + safety-filtered; no TS `enum`; strict gates stay green.

## Business Goals

- Make matches credible and replay-worthy: evidence-rich results (100+ traits when quality allows) with honest confidence, uncertainty, and mismatch warnings instead of shallow generic claims.
- Deliver first-class localization: every piece of dynamic AI content in the player's active locale (en/ar today), with an instant-feeling, privacy-preserving language switch that never re-sends the image.
- Broaden appeal with a genuinely global candidate pool (all regions/categories) governed by conservative, judge-verified scoring — better results for non-Western players without forcing fake diversity.
- Do all of the above while provably preserving every privacy/safety invariant, keeping the game free, stateless, and DB-less.

## KPI / Success Metrics

| Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- |
| Trait fields extracted per good-quality image | 15 flat traits | ≥100 filled (of 221 schema fields); `traitCount` reported | `traitCount` in validated Prompt 1 output (metadata-only structured logs; never image data) |
| Final results displayed when safe | max 4 | up to 5 | `MAX_FINAL_RESULTS` constant + judge output tests + UI render tests |
| Image re-analysis on language switch | N/A (not possible) | 0 — translate endpoint only, text-only | Tests proving translate flow never calls trait extraction/candidates/judge; no multipart on switch |
| Names/scores/ranks mutated by translation | N/A | 0 | Server-side overwrite guarantee + schema/unit tests |
| Forbidden wording reaching UI | 0 | 0 (maintained across all new fields) | Safety-filter coverage of every new text field + tests |
| Invalid AI output handled safely | ad hoc | 100% → `AiResponseInvalid` messageKey error (with model fallback chain) | Unit/integration tests for non-JSON, oversized, mixed-language outputs |
| Quality gates on touched modules | green | lint 0/0, typecheck clean, coverage ≥95/90/95/95, knip, madge, trivy | `npm run validate` + CI evidence in `15-dev-validation-report.md` |

## Risks of Not Doing It

- Product stagnates as a shallow one-shot toy: generic 15-trait matches give players no reason to replay or share, wasting the strong safety/privacy foundation already built.
- Arabic players remain second-class: partially localized or mixed-language dynamic content erodes trust in the primary non-English market, and RTL polish goes underused.
- Language switching stays privacy-hostile: the only path would be re-uploading the image — contradicting the image-memory-only ethos, doubling Gemini cost per switch, and adding latency.
- Scoring credibility debt: without a strict judge pass, occasional overconfident or weakly-supported matches undermine the "playful but honest" positioning and increase safety-wording risk.

## Assumptions

- The configured Gemini model (via `GEMINI_MODEL` from `.env`, never hardcoded) can return large strict JSON (221 fields) reliably enough; bounded strict Zod schemas + the model fallback chain + `AiResponseInvalid` error handling absorb failures. Risk if wrong: elevated error rate → mitigated by fallback chain and honest error UX.
- `en` and `ar` are the only supported locales today; the `languageCode` design (normalize invalid values to default) accommodates future locales without contract changes.
- Gemini quota/cost absorbs 3 calls per analysis plus 1 per translation at current traffic; no queue or caching infrastructure is needed (game stays stateless, no DB).
- The 221-field detailed-trait UI is renderable on low-end phones using accordion lazy rendering; no virtualization library needed at this size.
- Translation correctness for names/scores/ranks does not depend on model obedience: the server overwrites those fields from the canonical input, and disclaimer/fallback are server-enforced localized constants.
- Rollback is trivial: revert the feature commits; the contract is versioned by `promptVersion: 'advanced-global-traits-v2'`; no data migrations exist (stateless, no DB).

## Dependencies

- Google Gemini API availability and quota; typed config (`GEMINI_MODEL` + fallback chain) already in place.
- Existing file-security chain (consent, single file, size/MIME/extension/magic-bytes/decode, optional ClamAV fail-closed in production — `rules/15`) — reused unchanged by the analyze flow; translate endpoint must reject files.
- Shared safety constants and forbidden-wording guard (`packages/shared/src/constants/safety.constants.ts`) — extended to cover all new text fields.
- Frontend i18n (next-intl) active-locale state as the source of `languageCode`; existing rate-limit machinery for the new translate endpoint.
- New accessible Accordion in ui-primitives (aria-expanded/aria-controls/keyboard) for grouped detailed traits.
- Engineering OS gates (ESLint incl. architecture plugin, tsgo typecheck, coverage 95/90/95/95 touched modules, knip, madge, trivy) must stay green throughout.

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
| Business owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Source specification: `D:\Freelance\TwinzyV2.md` (authoritative V2 requirements, prompts, schemas, acceptance criteria).
- Product invariants: root `CLAUDE.md` "Twinzy Product Constraints"; `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`.
- Safety constants: `packages/shared/src/constants/safety.constants.ts`.
- Related artifacts: `docs/features/advanced-global-traits-v2/00-intake.md` (TWZ-V2-001) and subsequent phase artifacts in this folder.
- Stakeholder interviews / support tickets / KPI dashboards: Not applicable — solo-owner pre-scale product with no account system or support ticket stream; the V2 spec is the consolidated stakeholder input (accepted by Ihab).

## Phase Blockers

Do not close this phase if:

- the problem statement still describes only a requested solution and not the business pain — **clear: pain is shallow matches, missing localization, privacy-hostile language switch**
- there is no measurable success definition — **clear: KPI table above**
- impacted users are still vague — **clear: three personas, en/ar players**
- the cost of not doing the work is unstated — **clear: risks section above**

No blockers remain. Phase closed 2026-07-07 (Ihab).
