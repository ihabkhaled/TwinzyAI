# 21 — DTO & Validation

- Request DTOs live in the module dto/ folder; validated with Zod schemas.
- Responses typed from shared schemas (FinalGameResultSchema and friends).
- Every external input (HTTP body, file, AI response, env) passes a schema before use.
- No inline schema definitions in controllers/services.
