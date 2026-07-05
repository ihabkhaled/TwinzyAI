# 06 — Security

- Backend validates everything; never trust the client.
- Safe error envelope (ApiErrorResponse) — no stack traces, provider errors, or internals.
- Helmet + strict CORS allowlist + global rate limiting on the API.
- Secrets only via env; only the config module reads process.env; frontend gets NEXT_PUBLIC_* only.
- Logs are redacted: never log image bytes, prompts with user data in production, or API keys.
- Dependencies audited (npm run audit) and Trivy-scanned; no unmaintained security-relevant packages.
