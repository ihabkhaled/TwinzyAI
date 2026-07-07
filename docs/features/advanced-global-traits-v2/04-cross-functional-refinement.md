# 04 - Cross-Functional Refinement

- **Request ID:** TWZ-V2-001
- **Feature:** advanced-global-traits-v2
- **Date:** 2026-07-07
- **Owner / approver:** Ihab (product + engineering)
- **Track:** standard — major feature, safety-critical surfaces touched (prompts, schemas)
- **Source spec:** `D:\Freelance\TwinzyV2.md`

## Purpose

Align product intent with engineering, QA, security, operations, support, and analytics before planning is finalized for the Twinzy V2 upgrade: 15 flat traits → 221 nested visible-trait fields across 16 categories, global candidate pool, strict judge with up to 5 results, full `languageCode` localization (en|ar), and a new text-only `POST /api/v1/game/translate-result` endpoint for language switching without re-analysis.

## Step-by-Step Workflow

1. Reviewed the V2 spec stories and acceptance criteria against the existing game pipeline (Prompt 1/2/3, shared schemas, frontend game module).
2. Surfaced hidden work: bounded-schema explosion, `MAX_FINAL_RESULTS` 4→5 ripple, translation trust boundary, stale "15 traits / max 4 results" doc wording.
3. Identified integration points (Gemini adapter, multipart DTO, rate limiter, ui-primitives) and operational concerns (model-output failure modes, payload growth).
4. Recorded decisions, open questions, and owners below. Twinzy is a single-owner project; this refinement was executed as a structured async self-review with Ihab covering each function's checklist explicitly.

## Participants

| Function | Name | Participation type |
| --- | --- | --- |
| Product | Ihab | required |
| Engineering | Ihab | required |
| QA | Ihab | required |
| Security | Ihab (AppSec hat — mandatory here: prompts/schemas are safety-critical) | required for this request |
| DevOps / SRE | Ihab | as needed — reviewed (rate limit, timeouts, observability) |
| Support | Ihab | as needed — reviewed (docs, known-behavior notes) |
| Analytics | Ihab | as needed — reviewed, concluded not applicable (no analytics system by design) |
| Other | Ihab (AI-safety reviewer hat, per rules/14) | required for this request |

## Findings by Function

### Engineering

- Pipeline grows from 3 to 4 prompts: Prompt 1 (advanced trait extraction — only prompt that sees the image), Prompt 2 (global candidates, text-only), Prompt 3 (strict judge, text-only), NEW Prompt 4 (translation-only, text-only). New prompt resource `translate-result-prompt.md`; prompt version constant `advanced-global-traits-v2` as an `as const` object (no TS `enum`).
- Hidden schema work is large: 221 trait fields across 16 nested categories + `uncertaintyNotes` (4 bounded arrays) + `compactTraitSummary` (20–35 items) + `traitCount` + `safetyCheck` must all become strict Zod objects in `packages/shared` with bounded arrays, max string lengths, and `*_VALUES` arrays — no inline schemas in services/controllers.
- `languageCode` threading is cross-cutting hidden work: frontend active locale → multipart analyze request field (beside file + consent in the existing Fastify multipart flow) → DTO (invalid codes normalized to default, not rejected) → all four prompts → all responses. Supported today: en|ar.
- `MAX_FINAL_RESULTS` 4 → 5 has hidden consumers: aggregation caps, judge schema bounds, frontend result-card list, test fixtures, and stale "max 4 results" wording in docs/TEST_CASES.
- New endpoint `POST /api/v1/game/translate-result` needs controller + use case + translation service + rate limit. Critical design point surfaced: do NOT trust the model to preserve names/scores/ranks — the server overwrites them from the canonical input after translation, and disclaimer/fallback are replaced with server-enforced localized constants.
- Model failure modes (invalid/oversized/mixed-language JSON) are handled by bounded strict schemas + the model fallback chain + `AiResponseInvalid` AppError with messageKey; no provider errors leak to the client.
- Frontend hidden work: a new shared `ui-primitives` Accordion (aria-expanded/aria-controls/keyboard support) rather than per-screen accordions; compact-summary chips; grouped detailed traits with lazy rendering so 221 fields never render as one uncontrolled block; canonical structured result state preserved across locale switch; translation failure keeps the old-language result visible.
- No DB, no migrations, stateless: rollback is a commit revert; the API contract is versioned by `promptVersion: 'advanced-global-traits-v2'`.

### QA

- Test surface expands substantially and must be written first: schema tests (bounds, required categories, forbidden wording, localized "unclear" handling), use-case tests (image reaches only Prompt 1; buffer wiped in `finally` on success and on each of Prompt 1/2/3 failure paths; translation endpoint never calls extraction/candidates/judge; names/scores/ranks preserved; oversized payload rejected), frontend tests (locale sent with analyze, translate-on-switch fires, no re-upload/re-analysis, loading state, failure-keeps-old-result), and e2e happy paths in EN and AR with mocked Gemini.
- Environment needs: deterministic mocked-Gemini fixtures for the full 221-field payload (baseline, edge-case, and unsafe-output variants); e2e/browser environment constraints on this Windows dev machine are a known risk — Playwright run must be verified before merge (open question below).
- Regression scope: full game flow, unchanged file-security chain retested, RTL + dark mode + mobile viewports (320/375/390/414), accessibility checks on the new Accordion, and adjacent flows that consume `MAX_FINAL_RESULTS`.
- Coverage gate stays 95/90/95/95 (lines/branches/functions/statements) on touched modules; the large new schema files are in scope, not exempt.

### Security

- Threat areas: 221 localized free-text fields are new unsafe-wording surface — the forbidden-wording guard must cover every new text field (including `uncertaintyNotes`, `judgeNotes`, `mismatchWarnings`, `finalReason`, translated fields), not only the legacy ones.
- The translation endpoint is a new trust boundary: strict Zod input rejecting unknown keys, no file/image accepted, payload size cap, rate-limited; server-side overwrite guarantees the model cannot mutate scores/ranks/names or weaken the disclaimer.
- Image invariants unchanged and re-asserted by tests: memory-only, zero-wiped in `finally` on every path, only Prompt 1 receives it, never logged/stored/returned; Prompts 2/3/4 receive text/JSON only.
- Prompt-injection via trait/candidate text flowing into later prompts: model output is treated strictly as data in JSON payload slots, never interpolated into instruction text; no raw prompt or raw Gemini response logging in production.
- Sign-off needs: phase 19 threat model + security review are mandatory before release (safety-critical classification); Trivy scan must stay green.

### DevOps / SRE

- No infrastructure change: no DB, no new services/queues/jobs. One new route requires throttler configuration for `translate-result`, documented with the env vars.
- Observability: structured metadata-only logs; `AiResponseInvalid` and model-fallback-chain events must be visible so degraded model behavior is diagnosable; explicit Gemini timeout still bounds the larger 221-field payloads; response size limits enforced.
- Rollout/rollback: standard single deploy; rollback = revert the feature commits (no data or config migration); `GEMINI_MODEL` and fallback-chain models remain env/config driven — never hardcoded.

### Support / Operations

- User-visible changes to document: trait count, compact-summary chips, grouped detailed-traits accordion, image-quality & uncertainty section, up to 5 result cards, localized disclaimer, translate-on-locale-switch with loading state.
- README "How it works" and TEST_CASES must drop stale "15 traits" / "max 4 results" wording in the same delivery stream.
- Known-behavior note for support docs: on translation failure the previous-language result stays visible by design (localized error, retry available) — this is not a defect. Nothing is stored, so there is never user data to purge.

### Analytics / BI

Not applicable — Twinzy is anonymous, free, and has no database or analytics/tracking system by design; this feature adds no events, reports, or data outputs (accepted by Ihab).

## Open Questions

| Question | Owner | Due date | Status |
| --- | --- | --- | --- |
| Backend translation endpoint vs frontend-only translation utility? | Ihab | 2026-07-07 | resolved — backend Prompt 4 + `POST /api/v1/game/translate-result` (safest architecture fit; enables server-side preservation guarantees) |
| Which language codes ship at launch, and how are invalid codes handled? | Ihab | 2026-07-07 | resolved — en\|ar (current frontend locales); DTO normalizes invalid codes to the default instead of rejecting; schema leaves room to extend |
| Does the 221-field accordion need virtualization? | Ihab | phase 15 (dev validation) | resolved for planning — lazy rendering of collapsed groups is the approach; virtualize only if dev-validation perf evidence demands it |
| Can Playwright e2e run reliably in this Windows environment (browser install/sandbox constraints)? | Ihab | before merge | open — verify during phase 15; if blocked, document the exact environment blocker per policy instead of skipping silently |

## Captured Decisions

- Backend translation (Prompt 4 + dedicated rate-limited text-only endpoint) chosen over any client-side translation hack.
- Server-side overwrite of candidate names, scores, and ranks after translation, plus server-enforced localized disclaimer/fallback constants — model preservation is never trusted.
- `MAX_FINAL_RESULTS` raised from 4 to 5; all consumers (aggregation, schemas, UI, fixtures, docs) updated in the same stream.
- One shared accessible `ui-primitives` Accordion component owns expand/collapse behavior (aria-expanded, aria-controls, keyboard) instead of per-screen implementations.
- Invalid `languageCode` values are normalized to the default language in the DTO rather than rejected, keeping the game friction-free.
- Bad model output (invalid/oversized/mixed-language JSON) is handled by bounded strict schemas + model fallback chain + `AiResponseInvalid` AppError; never surfaced raw to the client.
- Contract versioning via `promptVersion: 'advanced-global-traits-v2'`; rollback is a pure commit revert because the system is stateless with no migrations.
- All existing invariants reconfirmed as unchangeable: free game, no payments/accounts/auth/DB, image memory-only and wiped in `finally`, only trait extraction sees the image, text-only Prompts 2/3/4, `GEMINI_MODEL` from `.env`, every AI output Zod-validated + safety-filtered, no TS `enum`, no inline definitions, strict gates (lint 0/0, typecheck, coverage 95/90/95/95, knip, madge, trivy).

## Exit Checklist

- [x] Impacted functions reviewed
- [x] Hidden work exposed
- [x] Missing requirements captured
- [x] Open questions assigned
- [x] Cross-functional risks documented

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Technical owner | Ihab | approve | 2026-07-07 |
| Product owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Participant list: solo async self-review by Ihab (all function hats, checklists above) — no meeting artifact exists for a one-person team.
- Source spec: `D:\Freelance\TwinzyV2.md`; repo canon consulted: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`, `rules/12-i18n.md`, `rules/13-accessibility.md`.
- Safety constants source of truth: `packages/shared/src/constants/safety.constants.ts` (forbidden-wording guard coverage must extend to all new text fields).
- Every open question above carries an explicit owner (Ihab) and a due phase.

## Phase Blockers

Do not close this phase if:

- major impacted functions have not reviewed the request — none remaining; all functions reviewed above
- hidden work is still being discovered informally — captured in Findings by Function
- open questions have no owners — all owned by Ihab with due dates/phases
- cross-system implications were mentioned verbally but not captured — all captured in this artifact

No blockers remain; the single open question (Playwright e2e environment) is owned, dated, and gates phase 15 rather than this refinement phase.
