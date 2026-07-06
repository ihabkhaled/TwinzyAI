# Skill: Reliability Review

> Applies rules/08. Break it on purpose; verify it degrades safely.

1. Kill Gemini (bad key/model) -> friendly keyed error, no hang, no leak, buffer wiped.
2. Timeout path -> the AI-timeout envelope returns within `GEMINI_TIMEOUT_MS` + margin.
3. ClamAV enabled + unreachable in prod config -> upload rejected (fail closed).
4. Fail-safe side effects: logging, cleanup, and fallback selection catch their own
   failures — a side-effect failure never turns a good response into an error, and the
   buffer wipe runs in `finally` on every path (success, failure, timeout).
5. Health endpoints stay accurate under failure; graceful shutdown drains in-flight
   requests; the retry UX works after each failure mode.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
