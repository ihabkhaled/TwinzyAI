# 21 — DTO & Validation (Zod)

> Validate **every** boundary with a zod schema before anything reaches the application layer. **Zod is the validation vendor; `class-validator` and `class-transformer` are forbidden repo-wide.** DTO schemas live in `api/dto/` backed by `packages/shared` — never inline. Implements rules 13 and 24 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [18-routes-controllers.md](./18-routes-controllers.md) · [05-types-enums-constants.md](./05-types-enums-constants.md) · [26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md) · [/skills/create-dto-validation.md](../skills/create-dto-validation.md)

---

## 1. Validate every boundary

A **boundary** is anything entering the app from outside the type system:

| Boundary | How it is validated |
| --- | --- |
| Request **body** | zod DTO schema via the global validation mechanism in `core/validation` |
| Route **params** / **query** | dedicated schemas with **explicit** coercion (`z.coerce.number().int()...`) — never hand-parsed |
| Uploaded **files** | the file-security chain — size/MIME/extension/magic-bytes/decode ([15-file-upload-security.md](./15-file-upload-security.md)) |
| **AI provider responses** | shared zod schemas + safety filter before any use ([14-ai-safety.md](./14-ai-safety.md)) |
| **Environment** | the zod env schema at startup, fail-fast ([25-configuration-and-environment.md](./25-configuration-and-environment.md)) |
| Frontend: **API responses** | gateways parse with the same shared schemas before returning ([04-frontend-services-gateways.md](./04-frontend-services-gateways.md)) |

Nothing untrusted reaches a service. The parsed, typed DTO is the only thing the controller hands to the application method.

## 2. Schemas live in `api/dto/`, backed by `packages/shared`

Every request/response shape that crosses the wire is defined **once**: cross-side contracts (e.g. `FinalGameResultSchema`) in `packages/shared/src/schemas`; api-only request DTOs in the module's `api/dto/<name>.dto.ts`, composing shared pieces. The type is always `z.infer` — never a parallel hand-written interface.

```ts
// api/dto/analyze-game.dto.ts
import { z } from 'zod';
import { CONSENT_REQUIRED_KEY } from '@modules/game/model/game.constants';

export const AnalyzeGameSchema = z
  .object({
    consent: z.literal(true, { message: CONSENT_REQUIRED_KEY }),
  })
  .strict(); // reject unknown keys — the whitelist/forbid-non-whitelisted equivalent

export type AnalyzeGameDto = z.infer<typeof AnalyzeGameSchema>;
```

Rules:

- **`.strict()` on every object schema.** Unknown keys are rejected, not silently stripped — this closes mass-assignment and unexpected-field holes at the boundary.
- **Bound everything:** every `z.string()` gets `.max()`; every `z.array()` gets `.max()`; numbers get `.min()`/`.max()`. Bounds are named constants, never inline literals.
- **Enums via the typed `as const` tuple** (`z.enum(VERDICT_VALUES)`) so narrowing survives — never string unions, never `Object.values(...)` casts ([05-types-enums-constants.md](./05-types-enums-constants.md)).
- **Coercion is explicit in the schema** (`z.coerce.number()`, `z.literal(true)`) — visible in the DTO, never scattered `Number(...)`/`=== 'true'` in services.
- **Every failure message is a `messageKey`**, not English prose — the frontend localizes it ([12-i18n.md](./12-i18n.md)).

## 3. Global validation via `core/validation`

Validation is wired **once**. The `ZodValidationPipe` in `core/validation` parses with `safeParse`, and on failure logs the flattened issues as structured `{ field, constraint }` pairs, then throws a typed `ValidationError` — never a raw `BadRequestException`:

```ts
// core/validation/zod-validation.pipe.ts (shape)
transform(value: unknown): TOutput {
  const result = this.schema.safeParse(value);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      constraint: i.message, // the messageKey
    }));
    this.logger.warn('validation.failed', { issues });        // fields, never values
    throw new ValidationError('Request validation failed', VALIDATION_FAILED_KEY, { issues });
  }
  return result.data; // coercion + defaults applied — the typed DTO
}
```

The global exception filter renders it as the sanitized envelope with the per-field `details` ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)). A malformed body is a typed **400, never a 500**.

## 4. Validation never lives in services

- Shape, length, format, and cross-field rules (`.refine()`/`.superRefine()`) belong in the schema. Services orchestrate; they do not re-validate what the DTO proved ([19-services-application-layer.md](./19-services-application-layer.md)).
- **Business invariants** (pipeline-stage legality, safety policy) belong in `domain/`/dedicated services — the DTO proves the request is *well-formed*; the domain proves it is *allowed*.
- Avoid ReDoS: no nested quantifiers in schema regex; split simple regex from a `.refine()` for the complex part.
- Deliberate defensive duplication (e.g. the size cap checked in the DTO *and* the upload chain) gets a `// WHY` comment.

## 5. `class-validator` / `class-transformer` are forbidden

No decorator-based DTOs, no `ValidationPipe({ whitelist: ... })`, no `plainToInstance` — anywhere, including tests and future modules. The equivalents are: `.strict()` (whitelist+forbid), `z.coerce`/`.default()` (transform), `z.infer` (typing). This is a repo-wide vendor decision recorded in [/memory/backend-stack.md](../memory/backend-stack.md).

---

## Checklist

- [ ] Every boundary (body, params, query, files, AI responses, env) parsed by a zod schema before use
- [ ] Schemas in `api/dto/` / `packages/shared`; types via `z.infer`; nothing inline
- [ ] `.strict()` on every object schema; every string/array/number bounded with named constants
- [ ] Enums via typed `as const` tuples; coercion explicit in the schema
- [ ] Failures → logged `{ field, constraint }` issues + typed `ValidationError` with `messageKey`s
- [ ] No validation in services; invariants in `domain/`
- [ ] Zero `class-validator`/`class-transformer` imports anywhere
