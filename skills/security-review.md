# Skill: Security Review

> Applies rules/06, 14, 15. Output: docs/security-review-report.md.

1. Uploads: re-verify the full validation chain order (consent first, one file, size, MIME,
   extension, consistency, magic bytes, decode) and fail-closed ClamAV behavior in prod
   config.
2. AI safety (rules/14, memory/ai-safety-decisions.md): only the trait-extraction call
   receives image bytes; candidate and judge calls are text-only; every AI output is
   Zod-validated AND safety-filtered before use; no identity/biometric/lookalike wording can
   reach the client; `GEMINI_MODEL` comes from env.
3. Privacy invariants (memory/privacy-decisions.md): no image is persisted, logged, cached,
   or returned anywhere; buffer wiped in `finally`; no biometric or identity data introduced.
4. Secrets: grep the frontend bundle for keys; check Docker images and compose files for
   baked secrets; only `NEXT_PUBLIC_*` values may reach the web bundle.
5. Errors: confirm every thrown path maps to the safe envelope (`ApiErrorResponse` fields +
   `messageKey`) — no stacks, provider text, or file paths leak.
6. Headers/CORS/rate limits: verify live responses, not just code.
7. Logs: confirm no image bytes, keys, or prompts-with-user-data (observability-review.md).
8. Run `npm run audit` + `npm run security:scan`; record findings and accepted risks in the
   report.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
