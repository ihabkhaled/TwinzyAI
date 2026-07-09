# 06-technical-refinement.md — TwinzyAI Hardening v3

## Technical context

The monorepo uses npm workspaces with a shared package (`@twinzy/shared`) that must be built before `apps/web` and `apps/api` can consume it. The backend is NestJS 11 on Fastify with typed Zod validation, the frontend is Next.js App Router with React, and the AI provider is Google Gemini via a dedicated adapter. Custom ESLint plugins enforce the declared architecture on both sides.

## Alternatives considered

### Result-count implementation
1. **Add `resultCount` to existing analyze DTOs.** Simple, backward-compatible, keeps one request shape. **Chosen.**
2. **Create a separate `/preferences` endpoint.** Cleaner separation but adds a round trip and breaks the upload flow. Rejected.
3. **Hardcode count to 10 for everyone.** Easier but removes user control. Rejected by product requirement.

### Candidate pool sizing
1. **Fixed pool of 10 regardless of N.** Simple but wastes tokens when N is small. Rejected.
2. **Derived pool `min(max(N * 2, N + 3), safeMax)`.** Balances choice and quality. **Chosen.**
3. **Pool equals N.** No headroom for judge filtering. Rejected.

### Prompt vNext
1. **One massive prompt with all instructions.** Higher risk of model drift and longer output. Rejected.
2. **Keep three-prompt pipeline but enrich each stage.** Preserves privacy invariants and testability. **Chosen.**

### Scaling
1. **Implement Node cluster/PM2 now.** Adds complexity without proven need. Rejected.
2. **Profile single-process first, document scaling ADR.** Lower risk. **Chosen.**

## Chosen approach

- Add `resultCount` as a validated field in shared schema, backend DTO, and frontend UI.
- Rewrite prompts to v3 with richer visible-trait taxonomy, calibrated scoring, and explicit uncertainty handling.
- Bump prompt version and update fixtures/tests.
- Harden shared schemas with cross-field refinements and remove duplicate constants.
- Strengthen test coverage (RuleTester, unit, integration, Playwright) and enable magic-number enforcement.
- Verify security scanners and document scaling plan.

## Rejected approaches

- Separate `/preferences` endpoint.
- Pool equal to N.
- Single monolithic prompt.
- Cluster/PM2 implementation without profiling.

## Open technical questions

1. What is the exact `safeMax` internal candidate pool cap? (Proposed: `max(20, N * 2)` capped by token/model limits.)
2. Should the judge schema's `safetyCheck` be mandatory or optional for backward compatibility with test fixtures?
3. Should `ApiErrorResponseSchema` be `strictObject` or allow extra keys for forward compatibility?
4. Which fallback secret scanner should complement Trivy (`detect-secrets`, `git-secrets`, or GitHub secret scanning)?

## Debt impact

- This work pays down existing debt: untested rules, magic-number policy gap, thin Playwright coverage, duplicate constants, stale coverage docs.
- It adds minimal new debt if the scaling plan is documented but not implemented.
- Moving `game-stream.presenter.ts` to `application/` would reduce architectural debt.
