# Code Review Checklist — Twinzy

## Purpose

Use this checklist for every pull request or change review in this repository. A reviewer should be able to answer each item clearly. This document pairs with the enforceable rule body in [`rules/23-review-checklist.md`](../../rules/23-review-checklist.md); when they disagree, the rule file wins.

## Review Preparation

- Read the request summary and linked phase artifacts in `docs/features/<feature-slug>/`.
- Confirm the PR scope matches the documented plan (`05-delivery-plan.md`, `07-technical-roadmap.md`).
- Confirm the PR is reviewable in size and logically cohesive.

## Evidence Reviewers Should Expect

- linked request artifact or summary
- acceptance criteria
- test evidence or test plan
- documentation updates for changed behavior
- rollback notes when relevant (Twinzy has no DB, so rollback is `git revert` + redeploy)
- risk notes for unusual trade-offs or waivers

## Checklist

### Scope and Intent

- [ ] The change solves the documented problem.
- [ ] Scope is consistent with product requirements.
- [ ] Hidden extra behavior has not been introduced.
- [ ] No payment logic, auth, database, or image persistence has crept in (product invariants).

### Architecture and Design

- [ ] The change respects module and layer boundaries: backend `Controller → Manager → Service → Repository`; frontend `Component → Hook → Service → Gateway` ([`rules/01-architecture.md`](../../rules/01-architecture.md), [`rules/16-backend-architecture.md`](../../rules/16-backend-architecture.md)).
- [ ] Third-party libraries stay behind their wrappers/adapters; no raw SDK/`fetch`/`axios`/storage in business code ([`rules/10-library-modularization.md`](../../rules/10-library-modularization.md)).
- [ ] No `process.env` outside the config modules.
- [ ] Architectural impacts are documented; a new ADR exists in [`architecture/adrs/`](../../architecture/adrs/README.md) when architecture changed.
- [ ] Refactors are separated or clearly explained.

### Code Quality

- [ ] Naming is clear and consistent; no `any`, no `eslint-disable`, no `@ts-ignore`, no non-null `!`, no TypeScript `enum` ([`rules/00-non-negotiable-rules.md`](../../rules/00-non-negotiable-rules.md)).
- [ ] Domain types/constants/DTOs/schemas live in dedicated folders, not inline ([`rules/05-types-enums-constants.md`](../../rules/05-types-enums-constants.md)).
- [ ] Complexity is proportionate to the problem.
- [ ] Duplication is avoided or justified.
- [ ] Error handling is explicit and maps to the `ApiErrorResponse` envelope.
- [ ] Logging and observability are present where needed ([`rules/22-observability-logging.md`](../../rules/22-observability-logging.md)).

### Security and Privacy

- [ ] Privacy invariants hold: no image persistence, no biometrics, only the trait-extraction prompt sees the image ([`rules/14-ai-safety.md`](../../rules/14-ai-safety.md)).
- [ ] The upload security chain is intact when touched: consent, single file, size, MIME, extension, magic bytes, decode check, optional ClamAV fail-closed ([`rules/15-file-upload-security.md`](../../rules/15-file-upload-security.md)).
- [ ] Sensitive data is protected and redacted in logs.
- [ ] Input validation (zod) and output safety filtering are covered ([`rules/06-security.md`](../../rules/06-security.md)).
- [ ] Abuse paths and misuse cases were considered (rate limiting, oversize uploads, hostile files).

### Data and Compatibility

- [ ] Shared contract changes (`packages/shared` schemas/types) are documented.
- [ ] Backward compatibility impact on the web client is known; envelope changes are additive.
- [ ] There is no database and no schema migration; any claim otherwise is a red flag.

### Tests

- [ ] Tests exist for the changed behavior (`*.test.ts` unit, `*.integration.test.ts` integration).
- [ ] Tests cover happy path, failure path, and edge cases appropriate to the risk ([`testing/testing-strategy.md`](../../testing/testing-strategy.md)).
- [ ] Touched-module coverage meets the gate (statements/branches/functions/lines ≥ 95/90/95/95) or has an approved waiver ([`testing/coverage-policy.md`](../../testing/coverage-policy.md)).
- [ ] Regression scope is identified.

### Documentation

- [ ] Required docs were updated (feature artifacts, `rules/`/`memory/` when decisions changed).
- [ ] Release notes were updated when behavior changed ([`release-notes/`](../../release-notes/README.md)).
- [ ] Support or runbook docs were updated when operations changed ([`runbooks/`](../../runbooks/README.md), [`support/`](../../support/README.md)).

### Release Readiness

- [ ] Rollout and rollback needs are covered.
- [ ] The gates pass: `npm run lint` (0/0) · `npm run typecheck` · `npm run test:unit` · `npm run test:coverage` · `npm run build` · `npm run security:scan`.
- [ ] No unresolved blocker remains hidden in comments.

## Review Outcomes

- Use `MUST FIX` for blockers.
- Use `SHOULD FIX` for important improvements before merge when reasonable.
- Use `FOLLOW-UP` only for non-blocking items with explicit owner and due date.

## Automatic Blockers

Do not approve when any of the following are true:

- the reviewer cannot explain the change clearly
- architecture or contract impact is unclear
- failure-path handling is missing for critical workflows
- tests do not match the actual risk
- docs are stale for changed behavior
- rollback risk is unaddressed
- open security or privacy concerns are hand-waved
- a gate was silenced (rule weakened, test skipped, threshold lowered) instead of fixed

## Approval Rule

Do not approve when a blocker remains unresolved, when artifacts are missing, or when the reviewer cannot explain the change with confidence.

## Review Record Quality

Review comments should be specific enough that another engineer could understand:

- what is wrong
- why it matters
- what evidence is missing
- what would make the issue resolved
