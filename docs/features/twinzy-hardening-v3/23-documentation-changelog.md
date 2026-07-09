# 23-documentation-changelog.md — TwinzyAI Hardening v3

## Updated documents

| Document | Why it changed |
| --- | --- |
| `README.md` | Result count changed from "up to 5" to "up to the user-selected count"; added `security:scan:secrets` command. |
| `SECURITY.md` | Documented the new custom secret scanner and Trivy complement. |
| `TEST_CASES.md` | Updated v2→v3 references, result-count bounds, new shared contract cases, and expanded E2E matrix. |
| `release-notes/twinzy-hardening-v3.md` | New release notes for the v3 hardening/feature release. |
| `runbooks/README.md` | Added `secret-rotation.md` entry. |
| `runbooks/secret-rotation.md` | New runbook for rotating exposed secrets. |
| `architecture/adrs/adr-003-horizontal-scaling-plan.md` | New ADR documenting the single-process decision and scaling roadmap. |
| `memory/architecture-decisions.md` | Referenced ADR-003. |
| `testing/frontend/coverage-policy.md` | Noted that `apps/web/vitest.config.mts` is being created in this workstream and the frontend is currently ungated mechanically. |
| `testing/unit-testing-standard.md` | Noted the `test/` vs `tests/` naming drift in the web workspace. |
| `docs/features/twinzy-hardening-v3/15-dev-validation-report.md` | New artifact. |
| `docs/features/twinzy-hardening-v3/23-documentation-changelog.md` | This file. |

## Remaining documentation gaps

- Frontend coverage policy will be fully enforced once `apps/web/vitest.config.mts` is created and wired into the root project list.
- Web `test/` folder naming should be normalized to `tests/` in a follow-up cleanup.
- The `postcss` moderate vulnerability inherited from Next.js 16.2.10 needs a lockfile refresh or upstream patch; documented in release notes.
- `.env` plaintext `GEMINI_API_KEY` is accepted as a local-dev risk but must be rotated before production exposure.
