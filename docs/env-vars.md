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
| AI_PARALLEL_PIPELINE_ENABLED | api | false | Release A parallel candidate-recall fan-out; off = single unchanged generation call |
| AI_ADVANCED_MATCHING_ENABLED | api | false | Master switch for the verified-catalog advanced matching path |
| AI_PUBLIC_FIGURE_CATALOG_ENABLED | api | false | Enables text-only retrieval from the reviewed public-figure catalog |
| AI_ENSEMBLE_ENABLED | api | false | Enables bounded multi-provider text-only council execution |
| AI_CROSS_CRITIQUE_ENABLED | api | false | Enables structured text-only cross-critique |
| AI_SECOND_RETRIEVAL_PASS_ENABLED | api | false | Allows at most one critique-requested retrieval retry |
| PUBLIC_FIGURE_ENRICHMENT_ENABLED | api | false | Enables verified metadata enrichment after final matching |
| WEB_PUBLIC_FIGURE_MODAL_ENABLED | web | false | Enables the additive public-figure details UI |
| NEXT_PUBLIC_PUBLIC_FIGURE_MODAL_ENABLED | web (internal mirror) | derived | Build-time public mirror populated from `WEB_PUBLIC_FIGURE_MODAL_ENABLED`; do not configure separately |
| AI_ENSEMBLE_GENERATION_PARTICIPANTS | api | empty | Comma-separated `provider:model` ranking participants |
| AI_ENSEMBLE_JUDGE_PARTICIPANTS | api | empty | Comma-separated `provider:model` judge participants |
| AI_ENSEMBLE_CRITIQUE_PARTICIPANTS | api | empty | Comma-separated `provider:model` critique participants |
| AI_ENSEMBLE_FINALIZER | api | empty | Single `provider:model` localized explanation finalizer |
| AI_ENSEMBLE_MIN_SUCCESSFUL_PARTICIPANTS | api | 2 | Minimum successful council participants |
| AI_ENSEMBLE_STEP_TIMEOUT_MS | api | 30000 | Per-participant council timeout |
| AI_ENSEMBLE_MAX_CANDIDATES_PER_MODEL | api | 10 | Per-participant ranking result cap |
| AI_ENSEMBLE_MAX_COMBINED_CANDIDATES | api | 25 | Merged candidate-pool cap |
| PUBLIC_FIGURE_CACHE_TTL_SECONDS | api | 86400 | Verified metadata cache TTL |
| PUBLIC_FIGURE_CACHE_MAX_ITEMS | api | 1000 | Verified metadata cache capacity |
| PUBLIC_FIGURE_REQUEST_TIMEOUT_MS | api | 5000 | Remote metadata request timeout |
| PUBLIC_FIGURE_MAX_RESPONSE_BYTES | api | 250000 | Remote metadata response byte cap |
| AI_GENERATION_LANES | api | 2 | recall lanes to fan out (1–6); 2 = strongest + diverse |
| AI_GENERATION_CONCURRENCY | api | 2 | global cap on concurrent generation calls across all analyses (1–16) |
| AI_JUDGE_CONCURRENCY | api | 1 | global cap on concurrent judge calls (1–16); provisions the Release B tournament gate |
| AI_MAX_CALLS_PER_ANALYSIS | api | 5 | hard cap on provider calls/analysis (3–20): extraction + lanes + judge; lanes clamped to fit |
| AI_PARALLEL_QUEUE_TIMEOUT_MS | api | 30000 | max wait for a concurrency permit before a lane is dropped (1000–120000) |
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
| NEXT_PUBLIC_PAYPAL_CLIENT_ID | web | (empty = paywall off) | public PayPal Buttons client id; enables the $0.50 payment step; charset+length bounded |
| PAYPAL_CLIENT_ID | api | (empty = paywall off) | PayPal REST client id (server secret); with the secret, turns the paid-analysis gate ON |
| PAYPAL_CLIENT_SECRET | api | (empty = paywall off) | PayPal REST secret (server secret; never NEXT_PUBLIC) |
| PAYPAL_ENV | api | sandbox | sandbox | live — which PayPal endpoint the credentials target |
| PAYMENT_PRICE_VALUE | api | 0.50 | server-authoritative price per analysis (dot-decimal); never trusted from clients |
| PAYMENT_PRICE_CURRENCY | api | USD | ISO-4217 currency for the price |

Only `apps/api/src/config`, API bootstrap, web/tooling config, and
`apps/web/src/packages/env` may read `process.env` (lint-enforced).
