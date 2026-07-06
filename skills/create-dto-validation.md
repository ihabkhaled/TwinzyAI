# Skill: Create DTO Validation (Zod)

> Applies rules/21. Zod only — class-validator is forbidden repo-wide.

1. Define the schema in `apps/api/src/modules/NAME/api/dto/NAME.dto.ts`, built on the shared
   contracts in `packages/shared/src/schemas` (run `npm run build:shared` after changing
   them so both sides pick up the new dist).
2. Use `z.strictObject({...})` — unknown keys are REJECTED, not silently stripped.
3. Make every coercion explicit: `z.coerce.number()` for numeric strings, explicit
   transforms/literals for booleans. Never rely on implicit casting.

   ```ts
   // api/dto/analyze-request.dto.ts
   import { z } from 'zod';

   export const AnalyzeRequestSchema = z.strictObject({
     consent: z.literal('true'), // multipart fields arrive as strings — coercion is explicit
   });
   export type AnalyzeRequestDto = z.infer<typeof AnalyzeRequestSchema>;
   ```

4. Derive the type via `z.infer`; never hand-write a parallel interface.
5. Validation happens in the global pipe in `apps/api/src/core/validation` — no ad-hoc
   `parse` calls per controller. On failure the pipe logs the Zod issues as
   `{ field, constraint }` pairs (never raw values) and throws the typed `ValidationError`
   (`AppError` 400) with its `messageKey`, so the client receives the standard envelope.
6. Tests: accept + reject per field, boundary values, unknown-key rejection, and the coerced
   output types (write-unit-tests.md).

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
