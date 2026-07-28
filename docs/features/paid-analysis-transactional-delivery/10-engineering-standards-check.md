# 10 — Engineering Standards Check

- Reuse existing payment gate, adapters, holder, schemas, errors, logger, and use cases.
- No new dependency, env value, persistence, inline reusable declaration, unsafe cast, non-null
  assertion, direct `process.env`, raw console logging, or architecture bypass.
- Tests precede production edits.
- Provider responses are Zod parsed and fail closed.
- User errors stay sanitized; logs stay structured and PII/secret free.
- Image buffers remain memory-only and wiped in `finally`.
- Payment and AI calls remain abort/timeout bounded.
- Touched logic must meet per-file 95 statements / 90 branches / 95 functions / 95 lines.
