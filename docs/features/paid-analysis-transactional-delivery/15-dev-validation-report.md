# 15 — Development Validation Report

Date: 2026-07-28
Branch: `main` release candidate

## Root-cause evidence

- Retained Vercel production trace: PayPal order creation, then paid SSE analysis remained at visible
  trait extraction until the 120-second watchdog.
- Code trace: PayPal capture occurred before extraction; compensation was best-effort in the same
  request with no durable record.
- Release diff: the shared response schema was bumped to `written-traits-v6`, while Prompt 1 still
  instructed every extraction model to return `written-traits-v5`. Production logs showed two
  successful model responses rejected only at `promptVersion: invalid_value`.
- Observability: inbound Vercel OIDC/proxy headers and client addresses were logged, consuming the
  retained payload and exposing credentials/PII.

## Implemented validation

- PayPal Orders v2 approved-order GET preflight validates status, intent, configured amount,
  currency, and request binding.
- Trait extraction, generation, judging, and aggregation complete before PayPal capture.
- Abort is checked before and after capture.
- A closed SSE sink makes the use-case emitter fail, activating post-capture compensation.
- Paid JSON and SSE extraction failures assert zero PayPal captures.
- Whole request headers and remote address/port are behaviorally proven redacted.
- Parsed query parameters are also redacted because Vercel serializes them separately from the URL.
- Prompt 1 now uses `written-traits-v6` and retains the advanced `matchingProfile` and
  `counterfactualProfiles` output. A regression test locks all three together.
- Every pipeline step now attempts at most the first three usable provider/model entries. Disabled
  providers and non-Gemini image routes are filtered before the cap, so they do not consume an
  attempt.
- Paymob is already paid when its preparation succeeds, so JSON and streaming holders now mark it
  refundable before extraction. PayPal remains non-refundable and uncaptured until finalization.

## Gate evidence

- `npm run lint`: pass, 0 errors / 0 warnings.
- `npm run format:check`: pass after normalizing the already-tracked advanced-matching source
  set that the remote Lint workflow would otherwise reject.
- `npm run typecheck`: pass.
- `npm run test:unit`: pass, 181 files / 1,180 tests.
- `npm run test:integration`: pass, 10 files / 56 tests.
- `npm run test:coverage`: pass, 191 files / 1,241 tests; 97.40% statements, 90.19%
  branches, 97.60% functions, 97.53% lines.
- `npm run build`: pass for shared, API, and web production builds.
- `npm run security:scan`: pass; zero high/critical vulnerabilities, secrets, or Docker
  misconfigurations reported.
- `npm run security:scan:secrets`: pass; no plaintext secrets detected.
- `npm run knowledge:build`: pass; generated `.ai/` plane rebuilt after final formatting with
  zero stale items.
- `npm run knowledge:validate`: pass; generated plane matches its inputs.
- `npm run knowledge:benchmark`: pass, 21/21 golden tasks.
- `CI=true npm run test:e2e:ci`: pass, 78 desktop, accessibility, and mobile tests.
- `npm run test:ai`: pass, 90 files / 581 tests.
- `npm run ai:benchmark -- --mode=mock --samples=5`: pass; every pipeline step selected the valid
  mock model with score 0.998.
- Focused payment/game verification: pass, 4 files / 68 tests.
- `git diff --check`: pass.
- Remote push-gate audit for commit `01ed373`: `Gate - Lint` identified the formatter-expanded
  301-line config service; `Gate - Knowledge` identified stale generated `.ai/` state. Both root
  causes are corrected in the follow-up revision, and permanent final-revision gate rules now
  require Lint and Knowledge to be rerun after hook/formatter mutations.

## Release status

Owner authorized commit and push to `main`. PayPal LIVE remains governed by the existing go/no-go
conditions.
