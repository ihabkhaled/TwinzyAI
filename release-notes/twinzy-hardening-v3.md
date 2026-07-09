# Release Notes — Twinzy Hardening v3

## Overview

This release improves result quality, user control, and production readiness while keeping the game free, privacy-safe, and free of face recognition, identity matching, or biometric comparison.

## New features

- **Result count selection:** Users can choose 1–10 results from a dropdown; the default is 10.
- **Prompt v3:** Richer visible-trait extraction with stronger taxonomy, uncertainty notes, image-quality caps, and calibrated evidence-based scoring.
- **Calibrated scores:** Scores reflect style/vibe fit from written traits only. 90+ is rare and requires strong visible evidence; lower scores are explained.
- **Shared error envelope:** The frontend can now validate the `ApiErrorResponse` shape via Zod.

## Improvements

- Backend DTOs, use cases, and services validate and pass `resultCount` end-to-end.
- Candidate generation produces a pool larger than the requested count; the judge returns up to the requested count.
- Translation preserves `resultCount`, canonical names, scores, ranks, and verdicts.
- Judge and final-result items include a structured `safetyCheck` with `meetsMinimumEvidence`.
- `traitCount` is now cross-checked against the actual number of populated trait fields.
- Shared schema coverage is included in the coverage allowlist.

## Security

- Added `npm run security:scan:secrets`, a custom scanner that complements Trivy for common plaintext secret patterns.
- Documented secret rotation runbook (`runbooks/secret-rotation.md`).
- Trivy `security:scan` passes with 0 HIGH/CRITICAL vulnerabilities and 0 misconfigurations.
- Plaintext `GEMINI_API_KEY` in local `.env` is a known accepted risk for local development; rotate before production exposure.

## Observability and scaling

- Added ADR-003 horizontal-scaling plan; single-process design kept until profiling proves a bottleneck.
- Per-stage timing metrics and request-id correlation are added/verified.

## Developer experience

- Removed duplicate locale constants in the web workspace; locales are now imported from `@twinzy/shared`.
- Renamed `packages/shared/src/interfaces/` to `packages/shared/src/types/` for rule compliance.
- Added a custom secret scanner and documented Trivy limitations.

## Known limitations and follow-up

- The `postcss <8.5.10` moderate vulnerability is inherited from the latest Next.js 16.2.10 and cannot be resolved without a lockfile regeneration or Next.js patch. An npm override is in place; the lockfile needs to be refreshed in a follow-up.
- Frontend `test/` (singular) folder naming is a historical exception; normalization is planned.
- Frontend coverage is gated once `apps/web/vitest.config.mts` is created and wired in.

## Validation gates

Run before release:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:coverage
npm run build
npm run security:scan
npm run security:scan:secrets
```
