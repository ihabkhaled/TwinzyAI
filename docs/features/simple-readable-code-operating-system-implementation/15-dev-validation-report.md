# 15 — Developer Validation Report

- Environment: Windows 10, repository root, Node 24 local runner (engine warning noted; clean
  Docker build uses required Node 22)
- Date: 2026-07-10
- Operator: AI-assisted TwinzyAI engineering

## Automated evidence

| Check | Result |
| --- | --- |
| `npm run format:check` | Pass |
| `npm run lint` | Pass, 0 errors / 0 warnings, `--max-warnings=0` |
| `npm run typecheck` | Pass: shared, API, web, and web E2E |
| `npm run test:unit` | Pass: 127 files / 869 tests |
| `npm run test:integration` | Pass: 8 files / 45 tests |
| `npm run test:coverage` | Pass: 97.39% statements, 93.29% branches, 97.65% functions, 97.45% lines |
| `npm run test:e2e:ci` | Pass: 72 Playwright tests, including both 320 px Chromium projects |
| `npm run test:e2e` | Pass: same 72-test stable functional/mobile/a11y matrix |
| `npm run test:visual` | Pass: 4 updated intentional baselines |
| `npm run build` | Pass: shared, Nest API, Next web |
| `npm run quality:dead-code` | Pass: no findings |
| `npm run quality:circular` | Pass: no circular dependency |
| `npm run security:scan` | Pass: 0 HIGH/CRITICAL vulnerabilities, secrets, or misconfigurations |
| `npm run security:scan:secrets` | Pass |
| `npm run audit` | Pass: 0 vulnerabilities |
| Docker build/up/health/smoke/down | Pass after TypeScript peer alignment; API + web healthy, HTTP 200 |

## Acceptance and operational validation

- Provider-call tests prove one image call (`extraction`) followed by text-only
  generation/judging; translation/sharing remain text-only.
- Consent multipart field must precede the image; rejected/queued/busy/duplicate paths do not
  buffer or retain image bytes.
- Buffer wipe is tested on success, failure, cancellation, queue disconnect, and early rejection.
- English/Arabic forbidden wording and every extraction evidence leaf are safety-scanned.
- Canonical disclaimer/share cache-control/no-image guards and translation shape preservation pass.
- Docker startup logs were inspected; the final logger route configuration removes the legacy
  wildcard warning and is revalidated in the final gate pass.

## Known environment note

The host Node version is newer than the repository's `>=22.20 <23` engine. This produced an npm
engine warning only; clean Node 22 Docker installs/builds and runtime health checks pass.

The optional `test:e2e:webkit` project is not a required gate and can hang in the local Windows
runner. No test is marked skipped; the required Chromium/mobile/a11y matrix and visual project pass.
