# Development Validation Report

Date: 2026-07-27

## Automated evidence

- `npm run lint`: PASS, 0 errors and 0 warnings.
- `npm run typecheck`: PASS for root, shared, API, web, and web E2E TypeScript projects.
- `npm run format:check`: PASS.
- `npm run test:unit`: PASS, 181 files and 1,171 tests (including the final config-mirror
  regression).
- `npm run test:integration`: PASS, 10 files and 55 tests.
- `npm run test:coverage`: PASS:
  - statements: 97.39% (2,206/2,265)
  - branches: 90.14% (942/1,045)
  - functions: 97.59% (649/665)
  - lines: 97.52% (2,129/2,183)
- `npm run test:e2e:ci`: PASS, 78 Chromium, mobile Chromium, and accessibility tests.
- `npm run test:security`: PASS, 90 files and 568 tests.
- `npm run build`: PASS for shared, NestJS API, and the optimized Next.js production build.
- `npm run quality:dead-code`: PASS.
- `npm run quality:circular`: PASS, no circular dependency found across 830 files.
- `npm run security:audit`: PASS, 0 vulnerabilities.
- `npm run security:scan`: PASS, 0 high/critical vulnerabilities, secrets, or Docker
  misconfigurations.

## Behavior covered

- Stable/mutable/occluded evidence and counterfactual profile bounds.
- Deterministic global, structure-first, accessory-agnostic, presentation, and regional catalog lanes.
- Entity-ID-only catalog filtering and server-attached retrieval evidence.
- Same-prompt council execution, quorum degradation, missing-adapter handling, median behavior, structured critique, validated retry tags, and one-pass retry bound.
- Backend-owned consensus scoring and exaggerated-participant resistance.
- Prose-only finalizer mutation constraints and failure/language fallback.
- Arabic content-language rejection and RTL/BiDi DOM isolation.
- Enrichment cache, source fallback, HTTPS/host allowlist, redirect denial, byte/content-type limits, licensed image metadata, entity resolution, and API request validation.
- Accessible modal keyboard focus, Escape close, return focus, safe links, and result-card rendering.
- Share-contract preservation of enrichment.
- All required advanced benchmark metric calculations with synthetic text-only fixtures.

## Manual/live limits

No production credentials, live paid provider calls, private labeled benchmark set, manual
browser screenshot review, or remote deployment was used. Those remain rollout gates, not
simulated evidence. This workstation used Node 24.14.1; the repository-supported Node 22.22.1
runtime is not installed locally, so the same gates must also run in the pinned CI runtime.
