# 00 - Request Intake and Classification

## Purpose

Classify the `advanced-global-traits-v2` request — the Twinzy V2 upgrade from a 15-flat-trait game to an advanced 221-field / 16-category localized trait pipeline with global candidates, a strict judge, and a translation-only endpoint — before any solutioning begins.

## Step-by-Step Workflow

1. Request ID assigned: `TWZ-V2-001`.
2. Source recorded: owner-directed product spec `D:\Freelance\TwinzyV2.md` (mission brief, 2026-07-07); sponsoring party is the repository owner (Ihab).
3. Request type classified: production feature enhancement spanning AI prompt behavior change, schema migration, backend API contract update (new endpoint + widened result contract), frontend UX/i18n update, safety-critical change, test expansion, and documentation update.
4. Affected domains identified: see Affected Domains below — all three workspaces (`apps/api`, `apps/web`, `packages/shared`) plus AI/prompt, security/privacy, and documentation layers.
5. Severity assessed as major; urgency normal; standard track selected (no incident, no hotfix pressure).
6. Critical-risk areas flagged: all three existing prompts rewritten plus a new fourth prompt; trait/result wording is safety-filtered surface area; upload chain gains a `languageCode` field; the Gemini integration contract changes shape substantially (221 bounded fields).
7. Owners assigned: Ihab is intake, business, and technical owner (solo product + engineering).
8. Invariant check at intake: PASSED — the request adds no payments, no auth, no database, no biometrics, no image persistence; it explicitly re-affirms every product invariant (free, anonymous, memory-only images, text-only candidate/judge/translation prompts, `GEMINI_MODEL` from `.env`, Zod + safety filtering, no TS `enum`). Nothing to reject.

## Request Record

| Field | Value |
| --- | --- |
| Request ID | `TWZ-V2-001` |
| Feature slug | `advanced-global-traits-v2` |
| Request title | Twinzy V2: advanced global traits, localized AI output, top-5 results, and translate-result endpoint |
| Request type | feature (with embedded schema migration, AI prompt change, API contract update, UX change) |
| Request source | roadmap (owner product spec `TwinzyV2.md`) |
| Requested by | Ihab (repository/product owner) |
| Intake owner | Ihab |
| Business owner | Ihab |
| Technical owner | Ihab |
| Requested date | 2026-07-07 |
| Target timeline | current delivery stream; phased slices with all gates green per slice |

## Affected Domains

- [x] Frontend (`apps/web`) — compact summary chips, trait count, grouped accessible accordion (new ui-primitives Accordion), image-quality/uncertainty section, top-5 result cards, localized disclaimer, translate-on-locale-switch with loading state
- [x] Backend (`apps/api`) — analyze use case, DTOs (`languageCode`), trait-extraction/candidate/judge services, result aggregation, new `POST /api/v1/game/translate-result` endpoint (rate-limited), prompt template repository
- [x] Shared contracts (`packages/shared`) — advanced nested trait schemas (16 categories, 221 fields), uncertainty-notes schema, candidate/judge/final-result schemas, translation request/response schemas, language-code schema, prompt-version/verdict/confidence/popularity/public-category constants, `MAX_FINAL_RESULTS` 4 → 5
- [ ] DevOps / platform (Docker, CI, hooks, ESLint architecture plugin) — no pipeline or tooling changes expected; existing gates (lint 0/0, tsgo typecheck, coverage 95/90/95/95, knip, madge, trivy) apply unchanged
- [x] Security / privacy — upload chain gains `languageCode` field (normalized to default when invalid); translation endpoint must reject images and oversized payloads; forbidden-wording guard must cover all new localized fields
- [x] AI / model behavior (prompts, safety filtering, Gemini adapter) — Prompts 1–3 rewritten for the v2 shape, new translation-only Prompt 4, prompt version `advanced-global-traits-v2`, server-side overwrite of names/scores/ranks after translation, server-enforced localized disclaimer/fallback constants
- [x] Integrations — Gemini remains the sole provider; response contract grows substantially (bounded strict schemas + model fallback chain + `AiResponseInvalid` handling)
- [ ] Support / player operations — no dedicated support workflow exists (free anonymous game, no accounts); player-visible behavior changes are covered by release notes and docs
- [ ] Legal / compliance — no new data categories, no persistence, no biometrics; existing privacy posture unchanged (accepted by Ihab)
- [x] Documentation (rules, memory, runbooks, release notes) — README "How it works", architecture docs, ai-safety and privacy docs, TEST_CASES, memory logs, and all "15 traits / max 4 results" wording must be updated

## Criticality and Delivery Track

| Item | Answer |
| --- | --- |
| Severity | major — full pipeline upgrade touching every safety-critical surface (prompts, schemas, safety filters, upload DTO) |
| Urgency | normal — roadmap work, no incident or deadline pressure |
| Standard or hotfix track | standard |
| Player-facing | yes — new result UI (compact summary, detailed trait accordion, top-5 cards, localized dynamic output, translate-on-locale-switch) |
| Consent or upload-chain impact | yes — multipart analyze request adds `languageCode`; all existing consent/size/MIME/magic-bytes/decode/ClamAV checks preserved unchanged |
| AI behavior or prompt impact | yes — all three prompts rewritten, one new prompt added, new prompt version `advanced-global-traits-v2` |
| Privacy or regulated data impact | yes (reviewed, unchanged posture) — image stays memory-only and wiped in `finally`; only trait extraction sees it; translation endpoint is text-only and never accepts a file |
| External integration impact | yes — Gemini request/response contracts change shape; `GEMINI_MODEL` still from `.env`; model fallback chain handles invalid/oversized output |
| Production incident related | no |

## Initial Scope Summary

### Problem statement

Twinzy today extracts 15 flat traits and returns at most 4 results, with dynamic AI text effectively English-only. V2 upgrades the free, anonymous, no-DB style/vibe game into an advanced multilingual pipeline: Prompt 1 extracts up to 221 visible non-identifying trait fields across 16 nested categories (plus 4 bounded uncertainty-note arrays, a 20–35 item compact trait summary, a trait count, and safety-check flags), localized to the requested `languageCode` and targeting 100+ filled traits when image quality allows (unclear fields say a localized "unclear"). Prompt 2 generates up to 5 global public-figure candidates (all regions/categories) with conservative scoring (90+ rare), confidence and popularity levels, aligned/mismatch trait arrays, and localized reasons. Prompt 3 strictly judges: rescores, penalizes overconfidence and unclear images, removes unsafe/weak candidates, and returns up to 5 final results with verdicts, localized reasons/notes, mismatch warnings, removed-candidate records, a localized fallback, and a mandatory disclaimer. A new Prompt 4 plus `POST /api/v1/game/translate-result` translates an existing structured result to a target language without re-analyzing the image — text-only, rate-limited, with names/scores/ranks preserved by server-side overwrite and disclaimer/fallback served from server-enforced localized constants. `languageCode` (en|ar today) flows frontend locale → multipart analyze request → DTO (normalized to default when invalid) → all prompts → all responses. `MAX_FINAL_RESULTS` moves from 4 to 5.

### Systems likely impacted

- `apps/api`: game analyze use case and DTOs, ai module (trait extraction, candidate generation, judge, safety service, Gemini adapter, prompt template repository, prompt resource files), result aggregation, new translate-result controller/use case with rate limiting
- `apps/web`: game feature (gateway, service, hooks, mappers, result components), new accessible Accordion ui-primitive (aria-expanded/aria-controls/keyboard), locale-switch translation flow with loading state and failure-keeps-old-result, i18n message catalogs (en/ar), RTL/dark-mode/mobile-first layouts preserved
- `packages/shared`: all v2 schemas, constants, derived types, bounds; prompt version constant
- Test suites at every layer: schema/prompt tests, use-case tests (image reaches only trait extraction; buffer wiped in `finally` on every path; translation never calls analysis), frontend component/flow tests, e2e (en + ar happy paths, language switch, mocked Gemini), architecture/lint tests
- Documentation: README, architecture docs, ai-safety, privacy, TEST_CASES, memory logs, this feature's SDLC artifacts, release notes

### Known dependencies

- Gemini via `@google/genai` behind the existing adapter — the only external dependency; model name from `GEMINI_MODEL` in `.env`, with the existing model fallback chain relied on for invalid/oversized/mixed-language output
- Existing file-security chain (consent, single file, size/MIME/extension/consistency/magic-bytes/decode, optional ClamAV failing closed in production) — reused as-is, must not be weakened
- Existing i18n infrastructure (next-intl, en|ar locales) supplies the active locale that becomes `languageCode`
- Existing strict quality gates (ESLint 0/0, tsgo, coverage 95/90/95/95 on touched modules, knip, madge, trivy) — must stay green throughout
- No upstream teams, vendors, contracts, or environment approvals — solo-owner project

### Intake assumptions

- `en` and `ar` are the only supported `languageCode` values today; the schema admits future locales but the frontend only sends currently supported ones. Invalid or unknown codes are normalized to the default rather than rejected, so old/misbehaving clients cannot break analyze. Risk: silent normalization could mask a frontend locale bug — mitigated by tests asserting the normalization path.
- The backend translation endpoint is the chosen approach for language switch (not a client-side hack), per the spec's stated preference; the frontend keeps a canonical structured result and only swaps localized text fields. Risk: extra Gemini call per locale switch — mitigated by rate limiting and by never touching the image path.
- Server-side overwrite of names/scores/ranks after translation (rather than trusting the model to preserve them) is treated as a hard requirement, not an optimization. Risk if wrong: none — strictly safer.
- "221 trait fields / target 100+" is a prompt-and-schema ceiling, not a guarantee; low-quality images legitimately return many localized "unclear" values, and the judge caps scores accordingly.
- Rendering ~221 fields is handled by grouped lazy accordion rendering; virtualization is assumed unnecessary at this size unless profiling proves otherwise.
- E2E runs use mocked Gemini; live-model behavior variance is covered by bounded strict schemas + `AiResponseInvalid` handling rather than live e2e. Browser/e2e environment constraints noted as a risk to revisit in the test strategy.

## Exit Checklist

- [x] Request ID assigned (`TWZ-V2-001`)
- [x] Type classified (feature: AI prompt + schema + API contract + frontend UX/i18n, safety-critical)
- [x] Domains identified (api, web, shared, AI/prompts, security/privacy, integrations, docs)
- [x] Severity and urgency recorded (major / normal)
- [x] Owners assigned (Ihab: intake, business, technical)
- [x] Delivery track chosen (standard)
- [x] Criticality flags documented (prompt rewrite, upload-chain field, contract growth, wording safety)

## Sign-Off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Intake owner | Ihab | approve | 2026-07-07 |

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md` (full V2 mission brief, including prompt shapes, bounds, threat list, acceptance criteria)
- Product invariants: root `CLAUDE.md` "Twinzy Product Constraints"; `rules/00-non-negotiable-rules.md`; `rules/14-ai-safety.md`; `rules/15-file-upload-security.md`
- Prior related work: `docs/features/engineering-os-migration/` (TWZ-OS-001 — established the layered anatomy and gates this feature builds on)
- Rollback reference: revert the feature commits; the API contract is versioned by `promptVersion: 'advanced-global-traits-v2'`; no data migrations exist (stateless, no DB), so rollback is a pure code revert
- Escalation contact: Ihab (sole owner)

## Phase Blockers

None open. Reviewed against the blocker list:

- Request type is unambiguous (owner-authored spec with explicit classification section).
- Ownership is unambiguous (solo owner: Ihab).
- Severity/urgency are recorded above, not guessed.
- Critical-risk areas were reviewed: prompts/schemas (safety-critical wording surfaces), upload chain (`languageCode` addition), AI provider contract growth, translation-endpoint abuse cases (image upload attempts, oversized JSON, score mutation) — all carried forward to the impact, standards, test, and security phases.
- Stable identifier exists: `TWZ-V2-001` / `advanced-global-traits-v2`.
