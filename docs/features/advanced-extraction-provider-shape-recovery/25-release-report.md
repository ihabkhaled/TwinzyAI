# 25 - Release Report

Release completed on 2026-07-28.

## Revision

- Commit: `4105a92096f603f5271295cb2bd9937020091e76`
- Subject: `fix(ai): recover enhanced extraction pipeline`
- Branch: `main`
- Push: hook-clean and accepted by `origin/main`

## GitHub Evidence

All push workflows completed successfully:

| Workflow | Run |
| --- | --- |
| Gate - Knowledge | `30350078641` |
| Gate - Coverage | `30350078689` |
| Gate - E2E | `30350078650` |
| Gate - Lint | `30350078711` |
| Gate - Security Scan | `30350078655` |
| Gate - Build | `30350078660` |
| Gate - Unit Tests | `30350078688` |
| Gate - Typecheck | `30350078637` |
| CodeQL | `30350077980` |

## Vercel Evidence

- Backend deployment `dpl_CuMefxNhjgWvpbQSZG2zM3XdeAwx`: `READY`
- Frontend deployment `dpl_BgaqfZeVDsmQRDWMtcQFXPErXQD5`: `READY`
- `GET https://twinzy-ai-web-6jzq.vercel.app/api/v1/health`: HTTP 200 with
  `{"status":"ok","service":"twinzy-api","version":"0.1.0"}`.
- Backend startup logs show exactly three Gemini entries for extraction, generation, judge, and
  translation.
- Vercel runtime-error query over the initial post-deploy window returned no errors.

Rollback remains a focused revert of the implementation commit followed by redeployment.
