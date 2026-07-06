# 06 — Technical Refinement

Chosen approach and trade-offs:
- **Fastify platform** (mission-mandated): @nestjs/platform-fastify + root fastify dep + overrides dedupe; bounded body; trustProxy; UUID genReqId. Alternative (stay Express) rejected - mission requires Fastify and pino-http correlation.
- **Validation:** keep **zod** (shared schemas power both sides + AI response validation). Global zod validation in core/validation with issue-flattening logging replicates the reference behavior contract ({field, constraint} issues, typed ValidationError). class-validator rejected: dual validation systems, conflicts with repo-wide zod contracts.
- **Config:** adopt @nestjs/config (vendor owned by src/config) with zod validate + registerAs namespaces (app/security/ai/upload), AppConfigService typed surface. Replaces hand-rolled dotenv loader; keeps fail-fast.
- **Errors:** AppError hierarchy (Validation 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502) with messageKey errors.<feature>.<key>; envelope keeps existing ApiErrorResponse fields, messageKey added additively (frontend compatibility).
- **Manager tier:** refit to canonical application layer - GameManager becomes analyze-game.use-case.ts (multi-step orchestration), HealthManager collapses (pass-through tier removed).
- **Rejected:** big-bang rewrite; class-validator; renaming packages/shared.
