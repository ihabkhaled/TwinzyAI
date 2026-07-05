# Security Decisions

- Multer memory storage (no temp files on disk) — cleanup equals zero-filling one buffer.
- ClamAV optional via ENABLE_CLAMAV; enabled+unreachable in production fails CLOSED.
- Global throttler: 30 req/min default; analyze endpoint uses stricter per-route limits.
- Error envelope carries stable machine codes (ErrorCode) — clients map codes to i18n strings.
- helmet defaults + explicit CORS allowlist from CORS_ALLOWED_ORIGINS env.
