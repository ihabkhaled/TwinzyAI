# ADR-002 - Zod as the Single Validation Vendor (Including the HTTP Boundary)

## Status

Accepted — 2026-07-05

## Context

Validation happens at three trust boundaries in Twinzy:

1. **HTTP in:** multipart fields and DTOs on `POST /api/v1/game/analyze` (consent flag, file metadata) and any future endpoint.
2. **AI provider out/in:** every Gemini response is schema-validated and safety-filtered before use — this has been zod from day one.
3. **Cross-side contracts:** `packages/shared` publishes the request/response schemas both `apps/api` and `apps/web` consume — also zod, with TypeScript types derived from the schemas.

The NestJS ecosystem's conventional answer for boundary (1) is `class-validator` + `class-transformer` with the built-in `ValidationPipe`. Adopting the strict engineering OS (ADR-001) forced the question: standardize the HTTP boundary on the ecosystem default, or extend the already-dominant zod usage to cover it?

## Decision

**Zod is the single validation vendor for the entire backend, including the HTTP boundary.** Concretely:

- DTO schemas are zod schemas; DTO types are derived via `z.infer` — one source of truth, no decorated classes.
- A global zod validation mechanism in `core/validation` applies request schemas at the HTTP boundary (replacing any role `class-validator`'s `ValidationPipe` would have played).
- Validation failures map to the standard 400 `ApiErrorResponse` envelope, and each zod issue is logged structurally as `{field, constraint}` pairs — enough for debugging and analytics, never echoing raw submitted values (privacy: no payload content in logs).
- `class-validator` and `class-transformer` are not dependencies and must not be introduced; the wrapped-vendor ESLint enforcement treats validation as an owned surface like any other vendor.
- Shared contracts continue to live in `packages/shared` as zod schemas consumed by both sides.

## Consequences

### Positive

- One validation mental model and one issue format across HTTP DTOs, AI-response checking, and shared contracts.
- Types are derived from schemas (`z.infer`), eliminating class/interface drift between declared shape and validated shape.
- The frontend validates with the exact same schema objects the backend enforces — contract drift between `apps/web` and `apps/api` is structurally impossible for shared shapes.
- `{field, constraint}` issue logging gives consistent, redaction-safe observability for every rejected request.
- No decorator/reflection metadata machinery on the hot path; schemas are plain values that are easy to compose and test.

### Negative

- Departs from the NestJS ecosystem default; Nest documentation and examples using `ValidationPipe`/decorators do not apply verbatim and newcomers need a short orientation.
- The global zod validation glue in `core/validation` is repository-owned code that must be maintained and tested to the same 95/90/95/95 coverage bar.
- Decorator-driven conveniences that assume `class-transformer` (implicit type coercion on DTO classes) are unavailable; coercion is explicit in schemas (e.g., multipart string `'true'` handling for consent).

## Alternatives Considered

- **`class-validator` + `class-transformer` at the HTTP boundary, zod everywhere else.** Rejected — the dual-validation-system risk is the core objection: two vendors means two issue formats, two coercion behaviors, two places a rule can be forgotten, and inevitable drift between the decorated DTO classes and the zod contracts in `packages/shared` that the frontend consumes. The AI-response boundary — the most safety-critical validation in the product — is already zod; splitting the stack would make the ecosystem-default choice the odd one out, not the standard.
- **`class-validator` everywhere (drop zod).** Rejected — it cannot express the shared isomorphic contracts cleanly (the frontend consumes plain zod schemas, not decorated classes), would force a rewrite of the proven AI-response validation and safety filtering, and derives types worse (classes as types vs. `z.infer`).
- **A third vendor (e.g., a JSON-schema validator) as the unifier.** Rejected — replaces a working standard with migration risk on every boundary and loses zod's TypeScript-first inference that the whole codebase leans on.
