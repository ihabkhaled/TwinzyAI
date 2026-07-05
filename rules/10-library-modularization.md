# 10 — Library Wrapping & Modularization

Every third-party library is wrapped once in its own module, used everywhere through the wrapper.
Swapping a library (for example replacing the logger implementation with pino) must touch exactly
one folder.

- Gemini SDK -> GeminiAdapter (apps/api/src/modules/ai/adapters)
- Logger -> LoggerService (apps/api/src/infrastructure/logger) — change pino/winston here only
- env/config -> AppConfigService (apps/api/src/config), lib/config (web)
- HTTP client -> lib/http (web); gateways consume the wrapper
- Browser storage -> lib/storage (web)
- Virus scanning -> ClamAvAdapter (file-security module)
- Image validation primitives -> file-security services

Business code imports the wrapper, never the raw package (lint-enforced by
architecture/no-raw-library-imports and architecture/no-direct-sdk-imports).
