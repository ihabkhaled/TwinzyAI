# Library Boundaries

Wrapper map (change a library = touch one folder):
- Gemini SDK: apps/api/src/modules/ai/adapters/gemini.adapter.ts
- Logger backend: apps/api/src/infrastructure/logger/ (swap to pino here only)
- Env access: apps/api/src/config/, apps/web/src/lib/config/
- HTTP client (web): apps/web/src/lib/http/
- Browser storage: apps/web/src/lib/storage/
- Share/clipboard APIs: apps/web/src/lib/share/
- Virus scanning: apps/api/src/modules/file-security/adapters/clamav.adapter.ts
