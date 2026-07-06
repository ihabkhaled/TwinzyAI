# 04 — Cross-Functional Refinement

- **Engineering:** Express-to-Fastify swaps FileInterceptor/multer for @fastify/multipart behind core/http structural types; filter reply typing becomes HttpReplyLike.
- **QA:** existing unit+integration suites are the behavioral safety net; they must pass unchanged (fixtures preserved).
- **Security:** helmet via @fastify/helmet; ClamAV fail-closed preserved; Trivy gate added; redaction moves into pino config + privacy module stays.
- **DevOps:** Dockerfile.api may need CMD path check (dist layout); docker compose smoke stays.
- **Support:** runbooks/ + support/ templates introduced.
- **Hidden work surfaced:** root vitest/eslint/package.json are shared with the parallel web workstream - changes must be additive and not break web projects; coverage gate scoped to backend+shared logic files initially (web workstream adopts later).
- **Open question resolved:** validation vendor stays zod (repo-wide contract language, shared with frontend); the engineering OS documents Zod-via-pipe as the supported alternative. class-validator is NOT introduced.
