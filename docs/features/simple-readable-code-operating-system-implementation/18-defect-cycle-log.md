# 18 — QA Defect Cycle Log

| Cycle | Finding | Fix returned to QA | Regression result |
| --- | --- | --- | --- |
| 1 | Deterministic 320 px overflow | Test-mode server isolation + same-origin E2E API + shared document-width helper | Pass in desktop/mobile Chromium |
| 2 | Text-only canon contradicted runtime | Narrowed contracts/calls/prompts, prompt v5, static image-call rule | AI/unit/integration/E2E pass |
| 3 | Safety and cleanup gaps on non-happy paths | Consent-before-buffer, parser/presenter wipe, no image shadow/non-Gemini image call | Security-focused tests pass |
| 4 | Share/translation safety drift | Canonical disclaimer, raw-image detection, no-store, pre-scan + recursive shape lock | Unit/integration pass |
| 5 | Dead exports and clean-install failure | Knip sweep, dead config removal, peer-compatible TypeScript API | Knip, npm audit, Docker pass |
| 6 | Documentation/toolchain drift | Canonical precedence, current paths/versions/testing ownership, historical supersession notes | Format/link review + gates pass |
| 7 | Theme toggle rendered different `aria-pressed` values on the server and dark-system client | Hold the pressed state false until preferences hydration completes | Focused regression and all UI-preferences unit tests pass |

Blocking defects after final regression: **0**. Behavior changes introduced during fixes are recorded
in product requirements, release notes, support guidance, and the threat/security records.
