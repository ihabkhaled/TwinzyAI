# 09 - Full Impact Analysis

- **Request ID:** TWZ-V2-001 · **Feature:** advanced-global-traits-v2 · **Date:** 2026-07-07
- **Owner / approver:** Ihab (product + engineering) · **Track:** standard · **Severity:** major feature, safety-critical surfaces touched (prompts, schemas, new endpoint)

## Purpose

Reveal the full blast radius so no team or system is surprised later.

## Step-by-Step Workflow

1. Reviewed impact across both apps, shared contracts, the AI pipeline, upload security, tooling, QA, security/privacy, support, docs, and monitoring (table below).
2. Documented compatibility, contract-migration, monitoring, support, and compliance implications for the 15-trait → 221-field pipeline upgrade, the 4 → 5 results change, the languageCode flow, and the new `POST /api/v1/game/translate-result` endpoint.
3. Assigned owner (Ihab for all areas — solo maintainer) and mitigation per area.

## Affected Systems

| System / area | Impact summary | Owner | Action required |
| --- | --- | --- | --- |
| Frontend (`apps/web`) | Game module rework: compact summary chips + trait count, grouped detailed-traits accordion (new ui-primitives Accordion with `aria-expanded`/`aria-controls`/keyboard support), image-quality & uncertainty section, top-5 result cards (confidence, country/region, category, mismatch warnings), localized disclaimer, translate-on-locale-switch with loading state and failure-keeps-old-result. Active next-intl locale sent as `languageCode` in the multipart analyze request. | Ihab | Implement per Component → Hook → Service → Gateway anatomy; lazy-render accordion so 221 fields never mount as one block; preserve RTL, dark mode, mobile-first (320/375/390/414); component/hook/gateway tests. |
| Backend (`apps/api`) | Analyze DTO gains `languageCode` (en\|ar today; normalized to default when invalid); analyze use case threads it through all prompts; `MAX_FINAL_RESULTS` 4 → 5; new rate-limited `POST /api/v1/game/translate-result` (Prompt 4, text-only, no file accepted) with server-side overwrite of names/scores/ranks and server-enforced localized disclaimer/fallback constants. | Ihab | Controller stays thin; new use case + services per layered architecture; throttler config for the new route; `AppError`/messageKey errors only. |
| Shared contracts (`packages/shared`) | Largest contract migration to date: 16 nested trait-category Zod strict schemas (221 fields), `uncertaintyNotes` (4 bounded arrays, max 40), `compactTraitSummary` (20–35), `traitCount`, `safetyCheck`; candidate schema (confidenceLevel, globalPopularityLevel, aligned/mismatch trait arrays, localized reasons); judge result schema (verdict, countryOrRegion, publicCategory, three matching-trait tiers, mismatchWarnings, judgeNotes, shouldDisplay, removedCandidates); translation request/response schemas; languageCode schema; promptVersion constant `advanced-global-traits-v2`; as-const value objects for verdict/confidence/popularity/publicCategory (no TS `enum`). All arrays and strings bounded — no unbounded model output accepted. | Ihab | Define once in shared, no inline schemas in services/controllers; candidates/results capped at 5. |
| AI pipeline (prompts, safety filter, provider adapter) | All three prompts rewritten: Prompt 1 extracts 221 visible non-identifying fields localized to `languageCode` (unclear fields say localized "unclear", target 100+ traits when quality allows); Prompt 2 generates up to 5 global candidates with conservative scoring (90+ rare); Prompt 3 strictly judges — rescores, penalizes overconfidence and unclear images, removes unsafe/weak candidates, mandatory localized disclaimer. New Prompt 4 translates existing results text-only. Forbidden-wording guard extended to every new localized field. | Ihab | Only trait extraction sees the image — candidate/judge/translation prompts receive text/JSON only (unchanged invariant, now covered by tests); model fallback chain + `AiResponseInvalid` for invalid/oversized/mixed-language JSON; `GEMINI_MODEL` stays in `.env`. |
| Upload security chain | Behavior unchanged (consent flag, single file, size/MIME/extension/consistency/magic-bytes/decode, ClamAV optional fail-closed in production). Analyze DTO extended with `languageCode` only. Translation endpoint is JSON-only and must reject any file/multipart input. | Ihab | Tests: translate endpoint accepts no image; image buffer still wiped in `finally` on every success/failure path of the longer pipeline. |
| DevOps / platform (Docker, CI, hooks) | No new services, images, or env vars (`GEMINI_MODEL` already env-driven). Throttler limits for the translate route ride the existing rate-limit config. All existing gates must stay green: lint 0 errors/0 warnings, typecheck, coverage 95/90/95/95 on touched modules, knip, madge, trivy. | Ihab | Standard rebuild/redeploy; no pipeline changes. |
| QA automation (Vitest, Playwright) | Major expansion: schema tests (bounds, required categories, forbidden wording); use-case tests (image reaches only trait extraction; buffer wiped in `finally` per failure path; translate never invokes extraction/candidates/judge; names/scores/ranks preserved via server overwrite); frontend tests (locale sent, translate flow, failure keeps old result, accordion a11y, RTL, no storage writes); E2E happy paths en + ar with mocked Gemini, language switch without re-analysis. | Ihab | Write tests first; note E2E/browser environment constraints as a known execution risk — document any un-runnable layer explicitly. |
| Security / privacy | New attack surface: translate endpoint (oversized JSON, fake languageCode, attached image attempts, prompt injection embedded in trait/candidate text, model mutating scores or adding candidates). Mitigations: strict Zod with unknown-key rejection, bounded payload sizes, rate limiting, server-side overwrite of names/scores/ranks, server-enforced disclaimer/fallback constants, safety filter on all output. | Ihab | Threat model + security review artifacts (phase 19) must cover the endpoint before release. |
| Support | User-visible behavior changes: far richer trait display, up to 5 results (was 4), locale switching translates results in place, fewer-than-5 fallback message, translation failure keeps the previous result visible with a localized error. | Ihab | Update README "How it works"; remove stale "15 traits"/"max 4 results" wording; capture translate-failure behavior as known guidance. |
| Documentation (rules, memory, runbooks) | README, `docs/architecture.md`, `docs/ai-safety.md`, `docs/privacy-and-data-retention.md`, `docs/env-vars.md` (if any throttle key is added), `TEST_CASES.md`, `context/architecture-map.md`, `memory/known-pitfalls.md`, `memory/ai-safety-decisions.md`, plus this feature's artifact set. | Ihab | Ship doc updates in the same delivery stream as the code. |
| Monitoring / logs | New failure modes to observe: `AiResponseInvalid` (invalid/oversized/mixed-language model JSON, before and after model fallback), translate-endpoint validation rejects and rate-limit hits, larger Prompt 1 output latency. Logs remain metadata-only — never raw prompts, raw Gemini responses, or image bytes. | Ihab | Structured log coverage for the translate route; watch pipeline latency during hypercare. |

## Backward Compatibility

- **No external consumers.** The game is free, anonymous, has no SDKs, no partner integrations, and no stored data — the only client of `apps/api` is `apps/web`, deployed together from this monorepo. No compatibility window is required.
- **Contract is versioned.** Every AI payload and response carries `promptVersion: 'advanced-global-traits-v2'`, so the old (`15-trait`) and new shapes are distinguishable and the change is traceable and revertible.
- **Response shape changes materially** (flat 15 traits → 16 nested categories; results 4 → 5; new localized fields). A stale PWA client could receive a shape it cannot render; because nothing is persisted, the worst case is a failed render fixed by the standard service-worker update/refresh. Accepted by Ihab.
- **`languageCode` is tolerant:** requests that omit it or send an invalid value are normalized to the default locale, so no client can be broken by the new field.
- **Routes and status codes are additive:** existing analyze route keeps its path and error envelope; `POST /api/v1/game/translate-result` is a new route.

## Data Migration Needs

No database exists — no schema migrations or backfills, ever (stateless by design). What does migrate:

- **Contract migration in `packages/shared`:** the new advanced trait/candidate/judge/translation schemas and the `advanced-global-traits-v2` promptVersion constant replace the flat 15-trait contract; both sides ship in one release.
- **Env/config:** no new secrets or env vars; `GEMINI_MODEL` remains the single env-driven model input. Any new throttle value for the translate route is added to the existing typed, zod-validated config layer and documented in `docs/env-vars.md`.
- **Cache/PWA invalidation:** standard service-worker versioning on deploy; no manual invalidation steps.

## Monitoring Impact

- **New failure modes:** model returns invalid, oversized, or mixed-language JSON → bounded strict schemas + model fallback chain, terminating in `AiResponseInvalid` with a messageKey (never a provider error to the client); translation failure is a terminal, observable error while the client keeps the old result — no endless loading state.
- **New signals to watch:** translate-endpoint request rate, rate-limit rejections, Zod validation rejects (possible abuse probe), Gemini latency for the much larger Prompt 1 output, and safety-filter rejection counts on the new localized fields.
- **Log discipline unchanged and re-verified:** metadata-only structured logs; no raw prompts, no raw model responses, no image data, no user-identifying content.

## Support and Training Impact

Single-maintainer product (Ihab) — no support team to train. The support surface is the documentation itself:

- README "How it works" rewritten (100+ advanced grouped visible traits, global candidate pool, up to 5 results, all dynamic output localized, language switch translates without re-analysis, image still never stored).
- Known-behavior notes: translation failure keeps the previous result visible with a localized error; fewer than 5 safe results shows the localized fallback; the disclaimer always displays.
- `memory/known-pitfalls.md` and `memory/ai-safety-decisions.md` updated so future sessions (human or AI) inherit the decisions.

## Compliance / Privacy Impact

All privacy guarantees are preserved and several are strengthened:

- **Unchanged invariants:** free game, no payments/accounts/auth/DB; image lives in memory only and is wiped in `finally` on every path; only the trait-extraction prompt ever sees the image; no face recognition, identity matching, or biometric anything — all matching is from written, visible, non-identifying traits.
- **New endpoint stays inside the boundary:** `translate-result` is text-only, never accepts a file, never re-analyzes the image, and cannot alter safety decisions — names/scores/ranks are overwritten server-side and the disclaimer/fallback are server-enforced localized constants, so the model cannot smuggle new claims into a translated result.
- **`languageCode` is not PII** (a locale preference, not an identifier); nothing new is retained — the product still stores no user data, so retention/deletion obligations remain not applicable.
- **Sensitive-inference bans extended:** the 221-field schema is visible-traits-only by construction (e.g. `noteNoHealthInference`), and the forbidden-wording guard covers every new localized field.
- Contracts/SLA and client-approval obligations: Not applicable — free anonymous consumer game with no contracts, SLAs, or external clients (accepted by Ihab).

## Exit Checklist

- [x] Affected systems documented
- [x] Affected teams documented (single owner: Ihab across all areas)
- [x] Compatibility impact documented
- [x] Migration needs documented (contract-only; no persistence)
- [x] Monitoring impact documented
- [x] Support impact documented

## Evidence And References To Attach

- Source spec: `D:\Freelance\TwinzyV2.md` (sections 5–17: language flow, prompts 1–4, schema bounds, security threats, test matrix)
- Sibling artifacts: `docs/features/advanced-global-traits-v2/08-architecture-review.md`, `11-test-strategy.md`, `19-threat-model.md` (phase 19 must cover the translate endpoint)
- Safety canon: `packages/shared/src/constants/safety.constants.ts`, `rules/14-ai-safety.md`, `rules/15-file-upload-security.md`
- Architecture canon: `context/architecture-map.md`, `rules/00-non-negotiable-rules.md`
- Rollback reference: revert the feature commits — the contract is versioned by `promptVersion: 'advanced-global-traits-v2'` and no data migrations exist, so revert is clean and complete.

## Phase Blockers

None open. All department impacts are assessed above (none deferred to "check later"), compatibility is closed-world (single co-deployed client, versioned contract), monitoring and support implications are recorded, and there are no suspected-but-undocumented migration needs because the product has no persistence. Residual execution risks (model JSON validity, translation mutation, 221-field UI performance, E2E environment constraints) carry named mitigations in the table above and are tracked forward into phases 11/12/19. Accepted by Ihab, 2026-07-07.
