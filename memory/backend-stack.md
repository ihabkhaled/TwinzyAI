# Backend Stack

- NestJS 11 on Express 5; CJS build via nest build (tsc), dev watch via nest start --watch.
- Zod (not class-validator) for all validation — one validation library across the repo.
- dotenv loaded only inside the config module; AppConfigService parses env with a Zod schema.
- @google/genai is the Gemini SDK, imported only in GeminiAdapter.
- tsgo evaluated and rejected for now (v7 dev preview; no emitDecoratorMetadata) — see
  docs/package-decisions.md.
