# Environment Variables

| Var | Side | Default | Notes |
| --- | --- | --- | --- |
| NODE_ENV | api | development | development, test, production |
| API_PORT | api | 4000 | |
| TRUST_PROXY | api | false | true only behind a trusted proxy that overwrites forwarding headers |
| WEB_PORT | compose | 3000 | port mapping only |
| CORS_ALLOWED_ORIGINS | api | http://localhost:3000 | comma-separated allowlist |
| GEMINI_API_KEY | api | (empty) | REQUIRED for real analysis; never exposed to web |
| GEMINI_MODEL | api | (empty) | REQUIRED; model id, e.g. gemini-2.5-flash — never hardcoded |
| GEMINI_TIMEOUT_MS | api | 30000 | per-call timeout |
| GEMINI_STREAM_IDLE_TIMEOUT_MS | api | 60000 | maximum inter-chunk idle time |
| AI_MAX_RESPONSE_BYTES | api | 500000 | maximum raw response accepted from any AI provider |
| MAX_IMAGE_SIZE_BYTES | api | 5242880 | 5 MB upload cap |
| ENABLE_CLAMAV | api | false | true = scan; prod fails closed on scanner errors |
| CLAMAV_HOSTS / CLAMAV_PORT | api | 127.0.0.1,clamav / 3310 | ordered host fallback list |
| SHARE_RESULT_TTL_SECONDS | api | 600 | share-link lifetime; min 60, max 3600; non-secret |
| SHARE_RESULT_MAX_PAYLOAD_BYTES | api | 50000 | per-record byte cap; oversized create → 413; non-secret |
| SHARE_RESULT_MAX_ACTIVE_ITEMS | api | 1000 | total cache cap; new create at capacity → 429; non-secret |
| SHARE_RESULT_PUBLIC_BASE_URL | api | http://localhost:3000 | server-only origin for the `/share/<uuid>` link; never user input; set to the real frontend origin in prod; non-secret |
| NEXT_PUBLIC_API_BASE_URL | web | http://localhost:4000 | baked at build; safe public value |
| NEXT_PUBLIC_APP_ENV | web | local | local, test, staging, production; controls dev-only tools |
| NEXT_PUBLIC_PAYPAL_ME_USERNAME | web | (empty = link hidden) | voluntary donate link handle; alphanumeric 1-50 only (zod fail-fast); app never processes money |

Only `apps/api/src/config`, API bootstrap, web/tooling config, and
`apps/web/src/packages/env` may read `process.env` (lint-enforced).
