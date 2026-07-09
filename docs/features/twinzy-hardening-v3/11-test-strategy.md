# 11-test-strategy.md — TwinzyAI Hardening v3

## Requirement-to-test mapping

| Requirement | Test layers | Evidence location |
| --- | --- | --- |
| Result count 1–10 | Shared schema test, backend DTO test, frontend hook test, Playwright | `packages/shared/tests/`, `apps/api/src/modules/game/tests/`, `apps/web/src/modules/game/test/`, `apps/web/e2e/` |
| Default result count 10 | Shared schema default, DTO default, Playwright default assertion | Same as above |
| Backend validation | API unit/integration tests | `apps/api/src/modules/game/tests/`, `apps/api/src/tests/` |
| Prompts use result count | Prompt rendering test, FakeAiAdapter text-call assertion | `apps/api/src/modules/ai/tests/` |
| Judge returns up to N | Result aggregation unit/integration tests | `apps/api/src/modules/result-aggregation/tests/`, `apps/api/src/tests/` |
| Calibrated scores | Score-band tests, aggregation tests, prompt output tests | `apps/api/src/modules/result-aggregation/tests/`, `packages/shared/tests/` |
| No forbidden wording | `AiSafetyService` tests, forbidden-wording guard tests, integration tests | `apps/api/src/modules/ai/tests/` |
| Image-only-to-step-1 | `FakeAiAdapter` image/text call assertions | `apps/api/src/tests/` |
| Privacy (no image persistence) | Buffer-wipe, no-disk-write, no-base64-log assertions | `apps/api/src/modules/game/tests/` |
| Frontend UI behavior | Component tests, hook tests, Playwright | `apps/web/src/modules/game/test/`, `apps/web/e2e/` |
| Mobile/Arabic | Playwright device projects, RTL assertions | `apps/web/e2e/` |
| ESLint rule correctness | RuleTester tests | `eslint/frontend-architecture-plugin/tests/`, `eslint/architecture-plugin/tests/` |

## Test layers

- **Unit tests:** Vitest for shared schemas, pure helpers, domain policies, services, use cases, hooks, components.
- **Integration tests:** Vitest + NestJS `Test.createTestingModule` for API endpoint and pipeline integration.
- **E2E tests:** Playwright for real browser flows on mobile and desktop, English and Arabic.
- **Visual regression:** Playwright `visual` project with actual specs.
- **Accessibility:** `axe-core` in Playwright across all key states including results shown.
- **Architecture rule tests:** ESLint RuleTester for every custom rule.
- **Security tests:** `npm audit`, Trivy, fallback secret scanner, manual review.
- **Performance tests:** Manual/profile-based; no load suite unless profiling justifies it.

## Negative and edge cases

- Result count 0, 11, null, undefined, string, float.
- Empty traits, empty candidates, empty judged results.
- Missing/invalid prompt version.
- Safety rejection at extraction, candidate, and judge stages.
- Image decode failure, oversized file, MIME mismatch, magic-byte mismatch, ClamAV unavailable.
- Model timeout, malformed JSON, provider error, network failure.
- Cancel during streaming, cancel for non-running stream, duplicate cancel.
- Translation to unsupported language, translation preserving canonical fields.
- Refresh/reset does not leak image data.

## Migration and rollback tests

- Omitting `resultCount` defaults to 10 and produces valid results.
- Rolling back to previous Docker image restores previous behavior (hardcoded 5).
- Shared schema changes are additive; rollback requires both apps to revert together.

## Environment needs

- Local dev with `npm run dev` (builds shared first).
- CI with clean `npm ci`, all gates, and Playwright on port 3100.
- Docker compose for ClamAV integration tests.
- Optional real Gemini key for manual prompt-evaluation rounds (use fixtures for automated tests).

## Evidence plan

- Command output and coverage tables for each gate.
- Playwright HTML report and screenshots for visual/a11y failures.
- Manual testing log with input image traits, selected language, result count, observed behavior, and action items.
- Security scan output with Trivy version, config, and any fallback scanner results.
