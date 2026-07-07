# 03 - Product Requirements

- **Request ID:** TWZ-V2-001
- **Feature:** advanced-global-traits-v2
- **Date:** 2026-07-07
- **Owner / approver:** Ihab (product + engineering)
- **Source spec:** `D:\Freelance\TwinzyV2.md`

## Purpose

Translate the V2 business intent — upgrade the free, anonymous, no-DB style/vibe game from 15 flat traits to an advanced localized pipeline (221 trait fields, global candidates, 5 final results, translate-without-re-analysis) — into testable product requirements.

## Step-by-Step Workflow

Executed for this request: epics and stories defined below, acceptance criteria written in observable terms, scope boundaries and non-goals fixed, UX/permission/localization/error-state expectations documented, product definition of done recorded.

## Epics

| Epic ID | Epic title | Outcome |
| --- | --- | --- |
| E1 | Advanced trait extraction (Prompt 1) | 221 visible non-identifying trait fields across 16 nested categories + uncertaintyNotes (4 bounded arrays) + compactTraitSummary (20–35) + traitCount + safetyCheck, localized to `languageCode`; targets 100+ filled traits when image quality allows, localized "unclear" otherwise |
| E2 | Global candidate generation (Prompt 2) | Up to 5 public-figure candidates from all regions/categories with confidenceLevel, globalPopularityLevel, aligned/mismatch trait arrays, localized reasons; conservative scoring (90+ rare) |
| E3 | Strict judge / finalizer (Prompt 3) | Rescored, safety-pruned final list of up to 5 results (MAX_FINAL_RESULTS 4 → 5) with verdict, countryOrRegion, publicCategory, localized finalReason, trait breakdowns, mismatchWarnings, judgeNotes, shouldDisplay, removedCandidates, localized fallback + mandatory disclaimer |
| E4 | End-to-end localization | `languageCode` (en\|ar today) flows frontend active locale → multipart analyze request → DTO (normalized to default when invalid) → all prompts → all responses |
| E5 | Translate-result capability (Prompt 4 + endpoint) | `POST /api/v1/game/translate-result` translates an existing structured result text-only — no image, no re-analysis; names/scores/ranks preserved by server-side overwrite; disclaimer/fallback are server-enforced localized constants; rate-limited |
| E6 | Result UI v2 | Compact summary chips + trait count, grouped accessible accordion of detailed traits (new ui-primitives Accordion), image-quality & uncertainty section, top-5 result cards, localized disclaimer, translate-on-locale-switch with loading and failure-keeps-old-result |

## User Stories

| Story ID | As a | I want | So that |
| --- | --- | --- | --- |
| S1 | player | a rich, grouped breakdown of my visible style traits with a compact summary | the result feels detailed, honest, and worth playing with |
| S2 | player | up to 5 global public-figure style/vibe matches with scores, confidence, and mismatch warnings | results are interesting and not limited to one region or category |
| S3 | player | the entire dynamic result in my selected language (en or ar) | I can play fully in my own language |
| S4 | player | switching language after a result to translate it in place | I never have to re-upload or re-analyze my photo |
| S5 | player with a low-quality photo | honest localized "unclear" values and an uncertainty section | I understand why matches may be weak instead of getting fake precision |
| S6 | keyboard / screen-reader user | the detailed-traits accordion to be fully operable and announced | the richer UI does not exclude me |
| S7 | privacy-conscious player | a visible disclaimer that matching is playful and from written visible traits only, with my image never stored | I can trust the game |
| S8 | operator (Ihab) | every AI response Zod-validated, bounded, and safety-filtered before use | unsafe or malformed model output never reaches users |

## Acceptance Criteria

| Story ID | Acceptance criterion | Priority |
| --- | --- | --- |
| S1 | Prompt 1 output validates against strict bounded schemas covering all 16 categories (imageQuality, overallFace, faceShapeAndProportions, foreheadAndHairline, hair, eyebrows, eyes, nose, cheeksAndCheekbones, mouthAndLips, jawlineAndChin, facialHair, skinToneAndVisibleTexture, expressionAndPose, groomingAndStyle, styleVibeDescriptors) = 221 trait fields, plus uncertaintyNotes (4 bounded arrays), compactTraitSummary (20–35 items), traitCount, safetyCheck | Must |
| S1 | UI renders compact summary chips + traitCount first; detailed traits render inside a grouped accordion with lazy rendering (no jank at 320px) | Must |
| S2 | Up to 5 final results render as cards showing finalStyleVibeFitScore, confidenceLevel, verdict, countryOrRegion, publicCategory, localized finalReason, topMatchingTraits, secondaryMatchingTraits, weakOrUncertainTraits, mismatchWarnings; fewer than 5 shows the localized fallback message | Must |
| S2 | Judge rescoring is conservative (90+ rare), penalizes overconfidence and unclear-image inputs, removes unsafe/weak candidates into removedCandidates | Must |
| S3 | `languageCode` (en\|ar) is sent with every analyze request from the active frontend locale; invalid values are normalized to the default in the DTO (not rejected); all prompt outputs return dynamic text in that language; public-figure names stay in common public spelling; JSON keys stay English camelCase | Must |
| S4 | Locale switch with an existing result calls `POST /api/v1/game/translate-result` with text-only JSON; the image is never re-sent and Prompts 1–3 are never re-run; names, scores, and ranks are preserved by server-side overwrite regardless of model output; a loading state shows; on failure the previous result stays visible with a localized error | Must |
| S5 | Image-quality and uncertainty section renders imageQuality fields and all four uncertaintyNotes arrays; unclear trait fields display the localized "unclear" value | Must |
| S6 | Accordion (new ui-primitives component) implements aria-expanded, aria-controls, full keyboard operation, visible focus states, and respects reduced motion | Must |
| S7 | The mandatory disclaimer (server-enforced localized constant) is always displayed with results; no forbidden wording (face recognition / biometric / identity match / exact lookalike / "you are") appears in any copy or AI output | Must |
| S8 | Every AI response is Zod-validated against strict bounded schemas and safety-filtered; invalid/oversized/mixed-language model output yields an `AiResponseInvalid` error via the `ApiErrorResponse` envelope with a messageKey — never a raw provider error | Must |
| S4 | translate-result endpoint is rate-limited and rejects file uploads and oversized payloads | Must |
| S1 | RTL layout, dark mode, and mobile-first behavior (320/375/390/414/tablet/desktop, no horizontal scroll) are preserved across all new result sections | Must |

## Scope Boundaries

### In scope

- Prompt 1/2/3 content upgrades and new Prompt 4 (translation-only), all versioned `advanced-global-traits-v2`
- New endpoint `POST /api/v1/game/translate-result` (text-only, rate-limited)
- `languageCode` end-to-end plumbing (en|ar today): frontend locale → request → DTO → prompts → responses
- Shared bounded strict Zod schemas + `as const` constants for all new shapes; `MAX_FINAL_RESULTS` 4 → 5
- Frontend result UI v2: summary chips, trait count, grouped accessible Accordion (new ui-primitives), quality/uncertainty section, top-5 cards, localized disclaimer, translate-on-locale-switch
- Tests (schema, use-case, frontend, e2e) and documentation updates in the same delivery stream

### Out of scope

- Additional locales beyond en|ar (the pipeline is language-generic; new locales are a follow-up request)
- Result persistence, history, sharing, or export of any kind
- Camera-capture flow changes (existing flow reused as-is)
- Changes to the file-upload security chain (unchanged; only re-validated against the new DTO field)
- Any auth, accounts, payments, or database work (forbidden by product invariants)

## Non-Goals

- No identity, exact-lookalike, face-recognition, or biometric claims — the product remains a playful style/vibe game from written traits only
- No monetization in any form — the game stays free
- No forced geographic diversity in candidates — best trait-supported matches win
- No client-side or cached translation of dynamic results — translation is a server capability
- No attempt to guarantee exactly 100+ traits on poor images — honesty ("unclear") beats fake precision

## UX Expectations

Flow: upload (consent + existing processing states) → result page ordered as (1) compact trait summary chips + trait count, (2) top-5 style/vibe match cards (score, confidence, verdict, country/region, category, localized reason, mismatch warnings), (3) "Detailed traits" grouped accordion across the 16 categories with lazy rendering, (4) image-quality & uncertainty section, (5) localized disclaimer. Fewer than 5 matches shows the localized fallback message plus retry / upload-another actions. Locale switch on a result shows a translation loading state and swaps only text fields on success. Accessibility: keyboard-operable accordion with aria-expanded/aria-controls, visible focus, screen-reader-friendly errors, no color-only status, contrast-safe, reduced-motion respected. Layout: mobile-first 320–414px through desktop, no horizontal scroll, RTL logical spacing, dark/light mode.

## Error States

- Consent missing / file invalid: existing backend upload chain rejections surface unchanged via `ApiErrorResponse` + friendly i18n copy.
- Invalid `languageCode`: normalized to the default language in the DTO — not a user-facing error.
- AI returns invalid / oversized / mixed-language / unsafe JSON: bounded strict schemas + model fallback chain; terminal failure surfaces as `AiResponseInvalid` messageKey error with retry action.
- Gemini timeout / provider failure: messageKey error via the envelope; provider internals never exposed.
- Fewer than 5 safe results: localized fallback message rendered — this is a success state, not an error.
- Translation failure or timeout: localized error shown; the previous-language result remains fully visible and usable (failure-keeps-old-result).
- Translate endpoint rate limit exceeded: 429 via the envelope with localized copy.
- Empty state: no result yet → standard upload flow; no partial rendering of unvalidated AI output ever.

## Permission Model Expectations

No accounts, roles, or auth — every surface stays public and anonymous. Explicit consent flag remains required before any file processing. Rate limiting applies to analyze (existing) and the new translate-result endpoint. Never exposed: image bytes (memory-only, wiped in `finally`), raw prompts, raw Gemini responses, provider errors, or any biometric representation. `POST /api/v1/game/translate-result` accepts text-only JSON — file uploads are rejected outright, and only the trait-extraction call ever sees the image.

## Localization / Content Expectations

All static UI strings go through i18n (`apps/web/src/i18n`) in en and ar. All dynamic AI text (traits, reasons, notes, warnings, fallback, disclaimer) returns localized to `languageCode`; public-figure names keep common public spelling; JSON keys stay English camelCase. Unclear trait values use the localized "unclear" equivalent. The disclaimer and fallback message are server-enforced localized constants, not model output. Wording is playful style/vibe language only — "style/vibe fit score", "playful result", "written visible traits only"; forbidden everywhere (copy and AI output, enforced by the safety filter per `packages/shared/src/constants/safety.constants.ts`): "face recognition", "biometric", "identity match", "same face", "looks exactly like", "you are X".

## Analytics / Notification Expectations

Not applicable — Twinzy has no analytics, tracking, or notification product surface by design (anonymous, no accounts, no persistence); accepted by Ihab. Operational visibility is provided instead by structured pino logs containing metadata only (promptVersion, languageCode, durations, result counts, error messageKeys — never image bytes, raw prompts, or raw model responses) and the existing health endpoint.

## Product Definition of Done

- [ ] All user stories S1–S8 satisfied with their Must criteria observable in the running app
- [ ] 221-field extraction validates end-to-end; unclear fields localized; compact summary and trait count render
- [ ] Up to 5 final results (never more) with fallback below 5; conservative judged scores
- [ ] en and ar fully supported end-to-end; locale switch translates without re-analysis and preserves names/scores/ranks
- [ ] Out-of-scope items remain out of scope (no auth/DB/payments/persistence/new locales)
- [ ] All error states above implemented via `ApiErrorResponse` + i18n copy
- [ ] Permission/consent/rate-limit behavior implemented as written; image memory-only invariant proven by tests
- [ ] Analytics section confirmed Not applicable; log redaction verified
- [ ] Accessibility (accordion keyboard/ARIA), RTL, dark mode, and mobile-first verified
- [ ] Quality gates green: lint 0/0, typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md` (full trait-field lists, prompt JSON shapes, scoring bands, test matrix)
- Safety wording canon: `packages/shared/src/constants/safety.constants.ts`
- Prompt resources: `apps/api/src/modules/ai/prompts/` (versioned `advanced-global-traits-v2`)
- Governing rules: `rules/12-i18n.md`, `rules/13-accessibility.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`
- Rollback reference: revert feature commits; contract versioned by `promptVersion: 'advanced-global-traits-v2'`; stateless — no data migrations exist

## Phase Blockers

None open. Verified against the blocker list: acceptance criteria are observable and testable (schema validation, endpoint behavior, rendered UI states); non-goals are written; error states are enumerated including partial-failure (translation-fails-keeps-old-result) and fewer-than-5 fallback; permission/consent/rate-limit behavior is written, not assumed; the definition of done is product-behavioral, not engineering-only.
