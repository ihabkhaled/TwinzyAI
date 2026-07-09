# 04-cross-functional-refinement.md — TwinzyAI Hardening v3

## Participants

- Engineering (full-stack, backend, frontend)
- QA automation
- Security
- DevOps/SRE
- Product/content
- Support (implicit, via docs/runbooks)

## Findings by function

### Engineering
- The result-count change touches shared schemas, backend DTOs, use cases, services, prompts, aggregation, translation, and frontend hooks/UI. It is a cross-cutting feature.
- Current `MAX_CANDIDATES`/`MAX_FINAL_RESULTS` are both 5; they must be split into user-facing limits and internal candidate-pool limits.
- `game-stream.presenter.ts` is in the transport layer but holds orchestration; this should be addressed or documented as an exception.

### QA
- Playwright coverage is thin. The 35+ required scenarios are not yet automated.
- Unit tests for `AiSafetyService`, `file-security`, and several `lib/` helpers are missing or shallow.
- No integration tests for rate limiting, ClamAV fail-closed HTTP path, or cancel-during-stream.

### Security
- Plaintext `GEMINI_API_KEY` in `.env` is accepted as a local-dev risk for now. Trivy did not detect it, so the secret scanner must be verified and complemented.
- AI safety guard needs stronger testing and a judge-level safety flag.

### DevOps/SRE
- No horizontal-scaling ADR exists. SSE/cancel registry is per-process; scaling requires a shared store or sticky sessions.
- Docker compose and multi-stage Dockerfiles are present and non-root; no changes required unless scaling is implemented.

### Product/content
- UI copy must explain the score meaning and why fewer than N results may appear.
- Privacy reassurance should be near the result-count dropdown.

## Hidden work

- Creating SDLC artifacts and updating all governance docs.
- Adding RuleTester tests for 13 frontend rules and 1 missing backend rule.
- Enabling magic-number enforcement and fixing the resulting violations.
- Cleaning up the stale `package-lock.json` and untracked `node_modules` content.
- Extracting shared helpers (`traitReferenceSchema`, `parseStream`, `bootTestApp`).
- Creating frontend fixture builders.

## Integration points

- `packages/shared` schema changes flow to both `apps/api` and `apps/web`.
- Prompt file changes must be version-bumped and tested with fixtures.
- i18n dictionaries must be updated in both `en.json` and `ar.json`.
- Docker build must still produce `packages/shared/dist` before app builds.

## Open questions and decisions

| Question | Decision | Owner |
| --- | --- | --- |
| Should the internal candidate pool cap be fixed or derived from N? | Derived: `min(max(N * 2, N + 3), safeMax)` | Technical owner |
| Should empty results be allowed with a fallback message? | Yes, when safety/quality requires it | Product owner |
| Should we implement cluster/PM2 now? | No; document ADR and profile first | DevOps/SRE owner |
| Should we add a fallback Arabic forbidden-phrase list? | Yes, if model returns Arabic identity claims | Security owner |
| Should `.env` be rotated before implementation? | Accepted as risk-for-now by request owner | Request owner |

## Missing requirements surfaced

- Score-band to verdict mapping must be explicit in shared code.
- `ApiErrorResponseSchema` must be created so the frontend can validate error envelopes.
- Per-result `safetyCheck` must be added to judge and final-result schemas.
- Mobile Safari and Firefox device projects must be added to Playwright.
