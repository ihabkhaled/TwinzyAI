# 11 — Test Strategy

## Requirement-to-test mapping

- Extraction-only image boundary: AI pipeline/service/use-case tests assert exactly one image step and text calls for generation/judge/translation.
- Buffer lifecycle: analyze and streaming use-case tests assert zero-fill on success, generation failure, judge failure, cancellation, and extraction failure.
- Provider routing: registry/router tests assert only extraction requires a vision-capable route.
- Prompt isolation: prompt-template/pipeline tests assert prompts 2/3 contain written evidence and no image metadata/payload.
- Safety: existing schema, forbidden-wording, sensitive-topic, and safety-flag tests remain green.
- Upload/privacy: existing file-security/security/integration suites remain green.
- 320 px layout: focused `mobile-theme.spec.ts` in Chromium and mobile-Chromium, plus existing share/mobile/a11y flows.
- Theme hydration: the toggle keeps server/client `aria-pressed` output stable until client preferences hydrate, then exposes the resolved dark state.
- Governance/static enforcement: custom lint-rule tests and full lint 0/0.
- Shared cleanup: unit/schema/config tests and public-export typecheck.

## Test layers

Unit (pure helpers/services/schemas/lint rules), API integration (real Nest/Fastify with fake provider), web unit, Playwright E2E/a11y, static checks, build, dead-code/circular scans, and security scan.

## Negative and edge cases

Missing consent/file, invalid image, provider timeout/invalid/unsafe output, no safe candidates, abort during streaming, unsupported route capability, 320 px results with ten cards, Arabic/RTL translation, and unknown/expired share.

## Environment and data

Node 22, npm workspaces, built shared package, fake AI adapter, synthetic image fixture, mocked web backend. No real user photos or real provider calls.

## Evidence plan

Record command, result, date, failures, fixes, and unrun reasons in `15-dev-validation-report.md`; preserve failing/retest evidence in bug/defect logs.
