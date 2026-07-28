# 15 - Developer Validation Report

## Validation Summary

| Area | Result | Evidence |
| --- | --- | --- |
| Prompt regression | pass | Prompt test failed before the v6 examples and passed after them |
| Provider shorthand normalization | pass | Unit tests reproduce the exact production field shape |
| Direct free-mode analyze stream | pass | Multipart JPEG fixture reached extraction, generation, judge, aggregation, and terminal SSE result |
| PayPal failure ordering | pass | Integration tests confirm extraction failure occurs before capture |
| Lint / typecheck | pass | Lint 0 errors / 0 warnings; all workspace typechecks pass |
| Unit / integration / E2E | pass | 1,196 unit; 57 integration; 78 browser/a11y/mobile |
| Coverage | pass | 97.46 statements / 90.24 branches / 97.65 functions / 97.59 lines |
| Build / architecture | pass | Shared, API, and web builds; knip and circular-dependency gates |
| Security | pass | Trivy 0 HIGH/CRITICAL; npm audit 0 vulnerabilities |
| Knowledge gate | pass | Build, validation, generated-file check, and 21 golden benchmarks |
| Immutable container smoke | pass | API/web healthy; health 200 + `nosniff`; 400/404/413 envelopes |
| Real provider free-mode smoke | pass | 204 traits → 12 candidates → 10 judged/aggregated results → terminal SSE result |

## Functional And Operational Coverage

- Production request `b3efcaab-32a5-4775-87ae-df7357e048ea` established that upload validation
  passed and every configured model returned JSON before strict extraction validation failed.
- The provider normalizer accepts only non-empty, bounded strings in the known enhanced signal
  arrays. Objects and unsupported scalar types still reach strict Zod validation unchanged.
- The shared validation path is used by both the Gemini adapter prevalidator and the extraction
  service final parser.
- Logs record only the number of normalized shorthand signals. They do not record image bytes,
  prompts, signal text, provider responses, or payment credentials.
- The local direct-flow integration test uses the canonical payment-off configuration; this is
  the approved free-by-default path, not a production payment bypass.
- The production-style Docker image used a local synthetic avatar and the configured Gemini
  adapter. The primary model completed extraction, generation, and judge in about 93 seconds; no
  payment code ran.
- The first immutable-image run exposed missing API-workspace production dependencies. The
  Dockerfile was corrected, rebuilt without cache, and re-tested healthy.

## Acceptance Criteria

| Criterion | Validation | Result |
| --- | --- | --- |
| Keep enhanced matching/counterfactual profiles | Structured profiles remain in schema, prompt, fixtures, evidence, and safety scanning | pass |
| Recover observed Gemini shorthand | Exact production string arrays normalize conservatively | pass |
| Do not accept arbitrary malformed output | Empty, oversized, object, number, and null entries still fail | pass |
| Continue beyond extraction | Direct backend integration reaches all later AI stages and terminal result | pass |
| Maximum three model entries | Existing three-entry router cap retained and covered by routing tests | pass |
| Preserve payment protection | Capture remains after complete result; extraction failure does not capture PayPal | pass |

Developer validation is complete. Release completion still requires the pushed GitHub gates and
Vercel deployment checks.
