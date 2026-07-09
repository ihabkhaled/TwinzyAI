# 08-architecture-review.md — TwinzyAI Hardening v3

## Current architecture context

- Backend: `api → application → domain → infrastructure/adapters` with cross-cutting `src/core` and `src/config`.
- Frontend: `Component → Hook → Service → Gateway` on `app → modules/<feature> → shared → packages/<vendor>`.
- Shared: constants, enums, types, schemas, utils in `packages/shared`.
- Custom ESLint plugins enforce layer boundaries and frontend TSX discipline.

## Impact by area

### Shared package
- New constants and schemas for result count.
- Cross-field refinements tighten the contract.
- `interfaces/` renamed to `types/` for rule compliance.
- No layer-boundary change; shared remains the bottom layer.

### Backend
- `api/` DTOs gain `resultCount`.
- `application/` use cases and services pass the count through the pipeline.
- `adapters/` (Gemini) unchanged except for prompt version injection.
- `result-aggregation/` enforces count and score caps.
- `game-stream.presenter.ts` should move to `application/` or be documented as an exception.

### Frontend
- `modules/game/` UI gains a result-count dropdown.
- Hooks and services pass `resultCount` to gateways.
- `packages/i18n` removes duplicate locale constants by importing from `@twinzy/shared`.
- No new modules; changes are within the existing game module.

### Data-flow changes
- `resultCount` enters at the frontend, is validated at the API boundary, flows through use cases/services, into prompts, and back through aggregation/translation.
- No database or persistent state changes.

## ADR decisions

1. **ADR-001:** Keep the three-prompt pipeline for v3; do not collapse into one monolithic prompt. Privacy invariants (image only to prompt 1) are preserved.
2. **ADR-002:** Result count is a request parameter, not a user preference stored server-side. No persistent user settings are introduced.
3. **ADR-003:** Do not implement cluster/PM2/workers without profiling evidence. Document horizontal-scaling implications instead.
4. **ADR-004:** Move `game-stream.presenter.ts` to `application/` OR add an explicit boundary exception with justification.

## Architecture risks

- The shared schema change is cross-cutting; a mistake affects both apps.
- `game-stream.presenter.ts` in `api/` is a boundary violation that may confuse future contributors.
- Expanded test coverage may expose layout/architecture issues that require refactoring.
