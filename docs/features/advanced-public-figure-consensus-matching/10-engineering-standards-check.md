# Engineering Standards Check

| Standard | Application |
| --- | --- |
| Strict TypeScript/ESLint | No `any`, suppressions, unsafe casts, non-null assertions, enums, or magic values |
| Layering | Thin controllers; use-case orchestration; focused services; pure domain; bounded repositories; wrapped vendors |
| Shared contracts | Strict bounded Zod at every AI/HTTP/cache/share boundary |
| Config | Typed Zod startup config only; all model IDs and flags from environment |
| Privacy/AI safety | Extraction-only image; text-only downstream; safety/language validation |
| Frontend | Pure TSX, hooks/services/gateways, i18n, logical CSS, component caps |
| Security | Allowlisted HTTPS, timeout/size/redirect/content/schema/rate/circuit bounds |
| Observability | Structured counters/timings only; no sensitive payloads |
| Simple Code Ladder | Extend current owners before adding helpers/abstractions |

No rule weakening or waiver is approved. Permanent rule additions must update canonical authored knowledge and rebuild `.ai`.

