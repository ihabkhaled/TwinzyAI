# Skill: Add / Swap an AI Provider

> Applies rules/10, 14. The provider is one adapter behind a port.

1. Implement the AI provider port (`extractTraitsFromImage`, `generateFromText`) in
   `apps/api/src/modules/ai/adapters/`; the port interface lives in the ai module's `model/`.
2. Wire selection in `ai.module.ts` via the port token; typed config (`AppConfigService`)
   decides the provider — model name always from env, never hardcoded.
3. Never let vendor types cross the port; map provider failures to the 502 `AppError` with a
   stable `messageKey` (`errors.ai.<key>`), keeping the vendor cause server-side only.
4. MANDATORY: register the SDK package in `eslint/package-boundaries.config.mjs` (vendor ->
   `modules/ai/adapters`) so `architecture/no-direct-sdk-imports` bans it everywhere else.
5. Reuse the same prompts/schemas/safety filters — a provider change must not change
   contracts: outputs stay Zod-validated and safety-filtered exactly as before.
6. Adapter tests: timeout, invalid JSON, error mapping, and proof that no image bytes ever
   enter a text-only call. Run the focused suite while iterating: `npm run test:ai`.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
