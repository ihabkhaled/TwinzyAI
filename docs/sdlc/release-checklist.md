# Release Checklist — Twinzy

## Purpose

This checklist is the minimum release gate for any deployment of Twinzy that matters to players, operators, or the project sponsor. It pairs with [`rules/24-release-gate.md`](../../rules/24-release-gate.md) and the runbooks in [`runbooks/`](../../runbooks/README.md).

## Pre-Release

- [ ] Scope delivered matches approved scope
- [ ] Outstanding defects are documented and accepted
- [ ] QA sign-off recorded (`17-qa-report.md`)
- [ ] Security review completed (`19-security-review.md`)
- [ ] UAT or business sign-off completed when applicable
- [ ] Client approval captured when required
- [ ] All automated gates green: `npm run lint` (0/0) · `npm run typecheck` · `npm run test:unit` · `npm run test:coverage` (≥ 95/90/95/95) · `npm run build` · `npm run security:scan` (trivy, 0 HIGH/CRITICAL)
- [ ] Rollout plan documented
- [ ] Rollback plan documented and technically feasible (`git revert` of the release slice + redeploy — see [`runbooks/rollback-template.md`](../../runbooks/rollback-template.md); there are no DB migrations to unwind)
- [ ] Smoke tests prepared ([`runbooks/release-smoke-test.md`](../../runbooks/release-smoke-test.md))
- [ ] Log inspection path confirmed (structured pino JSON, request-id correlation)
- [ ] Runbooks updated
- [ ] Support briefed ([`support/`](../../support/README.md))
- [ ] Release notes prepared ([`release-notes/`](../../release-notes/README.md))
- [ ] Compliance and risk review completed when applicable
- [ ] Go / no-go decision recorded (`22-go-no-go.md`)

## Required Readiness Evidence

Before release, the team should be able to show:

- validation reports (`15-dev-validation-report.md`)
- QA sign-off
- security sign-off where applicable
- rollback steps
- smoke-test definitions
- known-issues guidance for support if needed

## Deployment Execution

- [ ] Release window confirmed
- [ ] Change owner present
- [ ] Approvers reachable
- [ ] `.env` reviewed: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_TIMEOUT_MS`, `MAX_IMAGE_SIZE_BYTES`, `CORS_ALLOWED_ORIGINS`, `ENABLE_CLAMAV` set as intended
- [ ] `docker compose up -d --build` completed cleanly (api, web, optional clamav profile)
- [ ] Smoke tests passed ([`runbooks/release-smoke-test.md`](../../runbooks/release-smoke-test.md))
- [ ] `GET /api/v1/health` returns 200 with security headers
- [ ] External integration healthy (Gemini reachable; analyze happy path succeeds)

## Immediate Post-Release

- [ ] Error rate normal (no unexplained 5xx `error` entries in pino logs)
- [ ] Latency normal for the analyze flow
- [ ] 4xx entries map to expected `warn` logs with error codes / message keys
- [ ] User-facing flows validated (upload → result on the live web app)
- [ ] No image or biometric data persisted anywhere (no volumes on the api service — by design)

## Release Blockers

Release must stop when:

- smoke tests are undefined
- rollback is theoretical rather than practical
- log inspection is unavailable or unstructured
- the release owner cannot explain the blast radius
- open defects are not explicitly accepted
- support ownership is unclear
- any automated gate is red or was silenced

## Hypercare Handoff

- [ ] Hypercare window has owner and duration (`26-hypercare-report.md`)
- [ ] Incident escalation path shared ([`runbooks/api-outage.md`](../../runbooks/api-outage.md), [`runbooks/ai-provider-outage.md`](../../runbooks/ai-provider-outage.md))
- [ ] Support has known-issues guidance ([`support/known-issues-template.md`](../../support/known-issues-template.md))
- [ ] Rollback criteria remain visible until stabilization

## Release Record Expectations

The release report (`25-release-report.md`) should capture:

- what was deployed
- who approved it
- what was validated immediately after deployment
- what issues occurred during rollout
- whether rollback remained available the whole time
