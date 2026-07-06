# Skill: Add a Config Value

> Applies rules/00, 16. A config value is an input contract: declared once, Zod-validated at
> boot (fail fast), typed, injected. `process.env` never leaves `src/config`
> (`architecture/no-direct-env-access`).

1. Add the variable to the Zod env schema (`apps/api/src/config/env.schema.ts`) with
   explicit coercion and bounds — a missing or malformed value must refuse to boot:

   ```ts
   GAME_RESULT_TTL_MS: z.coerce.number().int().min(1_000).max(600_000).default(60_000),
   ```

   Required secrets get no default (empty/absent fails the boot); defaults are for
   operational tuning only.
2. Expose it through the `@nestjs/config` layer: keep the value inside its `registerAs`
   namespace and add a typed getter on `AppConfigService` — business code injects the
   service, never reads keys by string:

   ```ts
   public get gameResultTtlMs(): number {
     return this.env.GAME_RESULT_TTL_MS;
   }
   ```

3. Declare it in `.env.example` under its concern group with a one-line comment
   (required/optional, allowed range). Placeholder only — never a real credential.
4. Add the row to docs/env-vars.md (var, side, default, notes) in the SAME change.
5. Fail-fast test: the schema rejects a malformed value and applies the default when unset:

   ```ts
   it('refuses to boot on a malformed TTL', () => {
     expect(() => EnvSchema.parse({ ...validEnv, GAME_RESULT_TTL_MS: 'soon' })).toThrow();
   });

   it('applies the default when unset', () => {
     expect(EnvSchema.parse(validEnv).GAME_RESULT_TTL_MS).toBe(60_000);
   });
   ```

6. Consume via `AppConfigService` injection only. Secrets are never logged, never committed,
   and never reach the web bundle — only `NEXT_PUBLIC_*` values are public. Wire the value
   everywhere the app runs (local `.env`, CI, compose) in the same change.
7. `GEMINI_MODEL` is the standing example: always from `.env`, never hardcoded.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
