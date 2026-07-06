# Engineering Standards — Twinzy

## Purpose

This document defines the minimum engineering quality bar for any change that moves through the Twinzy SDLC. It is a baseline summary: the full, enforceable rule bodies live in [`rules/`](../../rules/README.md) (numbered `00`–`24`) and **win every conflict** with this document.

## Core Standards

### 1. Architecture Fit

- Respect the layered architecture: backend `Controller → Manager → Service → Repository` ([`rules/16-backend-architecture.md`](../../rules/16-backend-architecture.md)); frontend `Component → Hook → Service → Gateway` ([`rules/01-architecture.md`](../../rules/01-architecture.md)).
- Controllers delegate exactly one manager call ([`rules/18-routes-controllers.md`](../../rules/18-routes-controllers.md)).
- Reuse existing patterns unless a better approach is formally justified.
- New architecture decisions require ADRs in [`architecture/adrs/`](../../architecture/adrs/README.md).
- Avoid hidden coupling across modules or workspaces; the ESLint architecture plugin enforces boundaries mechanically.

### 2. Change Design

- Prefer small, reviewable changes.
- Separate refactors from behavior changes when practical.
- Keep interfaces explicit — shared contracts live in `packages/shared` as zod schemas and derived types.
- Keep rollback practical (no DB means rollback is `git revert` + redeploy; keep it that simple).
- Make dependency changes deliberate and documented; every third-party library is wrapped ([`rules/10-library-modularization.md`](../../rules/10-library-modularization.md)).

### 3. Code Quality

- Strong typing is mandatory: no `any`, no `eslint-disable`, no `@ts-ignore`, no non-null assertion `!`, no TypeScript `enum` ([`rules/00-non-negotiable-rules.md`](../../rules/00-non-negotiable-rules.md), [`rules/11-eslint-typescript.md`](../../rules/11-eslint-typescript.md)).
- Public behavior must be easy to trace from input to output to side effect.
- Avoid dead code, placeholder logic, decorative UI, and hidden feature flags with no owner.
- Use consistent naming and module organization.
- Keep functions and modules focused; TSX stays pure composition — state/effects/handlers live in hooks ([`rules/02-frontend-components-tsx.md`](../../rules/02-frontend-components-tsx.md), [`rules/03-frontend-hooks.md`](../../rules/03-frontend-hooks.md)).

### 3a. Shared Definitions and Module Hygiene

- Shared domain concepts have one canonical source of truth: `packages/shared` for cross-side contracts, dedicated `constants/`/`types/`/`schemas/` folders inside each module.
- Contracts, constants, schemas, error codes, and policy identifiers are never duplicated across layers or defined inline ([`rules/05-types-enums-constants.md`](../../rules/05-types-enums-constants.md)).
- Meaningful modules have documented ownership and responsibility.
- Complex modules expose stable public interfaces (barrel `index.ts`) and avoid leaking internals.

### 4. Error Handling

- Handle happy path, failure path, timeout path, dependency failure path, and partial failure path — the Gemini call has explicit timeout and unavailability handling.
- Every error reaching a client is the safe `ApiErrorResponse` envelope; raw provider errors, stack traces, and internals never leak.
- Show meaningful user-facing errors where players interact (i18n keys, friendly copy).
- Never swallow errors without logging and explicit intent.

### 5. Logging, Metrics, and Traces

- Emit structured logs for materially important actions and failures ([`rules/22-observability-logging.md`](../../rules/22-observability-logging.md)).
- Preserve request-id correlation across the request lifecycle; 4xx log as `warn`, 5xx as `error`.
- Redact secrets, credentials, and anything privacy-sensitive — never log image bytes, base64 payloads, or raw AI prompt/response bodies containing them.

### 6. Security and Privacy

- Follow the Twinzy privacy floor ([`security-baseline.md`](./security-baseline.md), [`rules/06-security.md`](../../rules/06-security.md), [`rules/14-ai-safety.md`](../../rules/14-ai-safety.md)): no image persistence, no biometrics, no identity claims.
- Validate inputs at trust boundaries with zod; safety-filter AI outputs for forbidden wording.
- Protect secrets: no `process.env` outside config modules; `GEMINI_MODEL` and keys come from `.env`.
- Keep the upload security chain intact ([`rules/15-file-upload-security.md`](../../rules/15-file-upload-security.md)).
- Review abuse cases: hostile files, oversize payloads, rate-limit evasion.

### 7. Data and Contract Change Rules

Twinzy has no database, so there are no schema migrations or backfills. The equivalent discipline applies to contracts:

- Every `packages/shared` schema change requires compatibility analysis against the web client.
- API envelope changes must be additive unless a breaking change is explicitly approved.
- Do not introduce persistence of any kind for uploaded images or derived biometric data — that is an invariant, not a trade-off.

### 8. API and Contract Rules

- Document contract changes before release.
- Preserve backward compatibility unless a breaking change is explicitly approved.
- Define status codes, validation errors, and rate-limit behavior clearly ([`rules/21-dto-validation.md`](../../rules/21-dto-validation.md), [`rules/18-routes-controllers.md`](../../rules/18-routes-controllers.md)).

### 9. Frontend Standards

- Accessibility is required, not optional ([`rules/13-accessibility.md`](../../rules/13-accessibility.md)).
- All user-facing text goes through i18n ([`rules/12-i18n.md`](../../rules/12-i18n.md)).
- Loading, empty, success, and error states must all be designed.
- Buttons, links, actions, and controls must perform meaningful work or be visibly disabled with reason.

### 10. Performance and Reliability

- Consider latency, retries, idempotency, and concurrency where relevant ([`rules/07-performance-scalability.md`](../../rules/07-performance-scalability.md), [`rules/08-reliability-durability.md`](../../rules/08-reliability-durability.md)).
- The analyze flow depends on an external AI provider: timeouts, failure envelopes, and degraded behavior are part of the design, not an afterthought.
- Test failure recovery and degraded behavior.

### 11. Testability

- Code must be written in a way that is observable and testable ([`rules/09-testing-coverage.md`](../../rules/09-testing-coverage.md), [`testing/`](../../testing/README.md)).
- Critical logic must be scenario-rich, not percentage-rich only.
- Every change must have traceable test coverage: `*.test.ts` for unit, `*.integration.test.ts` for integration.

### 12. Documentation

- Docs are part of the definition of done ([`documentation-baseline.md`](./documentation-baseline.md)).
- Update feature artifacts, runbooks, support docs, and release notes as needed.
- Keep examples, commands, and workflows current.

## Script And Automation Standards

- Recurring engineering actions are captured in root `package.json` scripts; CI and Husky run the same canonical commands.
- The quality gates are: `npm run lint` (0 errors / 0 warnings) · `npm run typecheck` · `npm run test:unit` · `npm run test:coverage` (≥ 95/90/95/95) · `npm run build` · `npm run security:scan` (trivy, 0 HIGH/CRITICAL). See [`testing/quality-gates.md`](../../testing/quality-gates.md).
- Husky enforces pre-commit, commit-msg (conventional commits), and pre-push; never `--no-verify`.
- High-risk scripts must document inputs, side effects, rollback expectations, and safety checks.

## Non-Negotiable Anti-Patterns

- hidden business logic in transport or presentation layers
- undocumented cross-module coupling
- silent fallback behavior that changes product meaning
- retry storms without visibility
- shipping user-visible behavior without documented states and error handling
- leaving temporary flags, toggles, or compatibility shims ownerless
- weakening a lint rule, tsconfig flag, or coverage threshold to make a gate pass

## Review Questions

- Does the change fit the current architecture?
- Is the design understandable and maintainable?
- Are failures handled deliberately?
- Is the blast radius clear?
- Is the change observable?
- Is the rollback realistic?
- Are docs updated?
- Are tests good enough for the real risk?

## Non-Compliance

If a change cannot meet a standard, the gap must be documented with risk, compensating controls, approver, and follow-up owner. Silent non-compliance is not allowed. Product invariants (free game, no biometrics, no image persistence) admit no waiver.

## Minimum Evidence Of Compliance

At review time, the team should be able to point to:

- code locations
- tests
- docs
- config artifacts
- logs or gate outputs where relevant
- approval records where relevant
