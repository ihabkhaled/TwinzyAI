# 00 — Request Intake

- Request ID: `simple-readable-code-operating-system-implementation`
- Title: TwinzyAI Simple Readable Code Operating System implementation and codebase cleanup
- Source: product-owner directive, 2026-07-10
- Type: governance, rules, skills, documentation, agent readiness, static enforcement, full-stack refactor, safety/privacy hardening, and defect fix
- Owners: product/business — TwinzyAI owner; technical delivery — TwinzyAI engineering
- Severity: high maintainability and policy-drift risk; medium user impact from the 320 px overflow defect
- Urgency: current delivery stream
- Delivery track: standard track; no production data migration
- Affected domains: root governance, ESLint, API, web, shared contracts, AI pipeline, upload/privacy boundaries, tests, CI

## Scope

Apply the already-started Simple Code OS to the real TwinzyAI repository, consolidate rather than duplicate existing owners, complete the missing SDLC record, remove concrete dead/duplicate code, restore the declared image boundary (only trait extraction receives the photo), and fix the deterministic 320 px Playwright overflow.

## Critical-risk flags

- Privacy/AI safety: runtime currently conflicts with the request and most repository rules by passing the photo to candidate generation and judging.
- Existing worktree changes: preserve and validate the user's current benchmark/config/shared cleanup.
- Accessibility/i18n/RTL/upload validation: must remain unchanged or stronger.
- Release: blocked until all applicable gates and the focused Playwright suite pass.
