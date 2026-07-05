# 22 — Observability & Logging

- All logging through LoggerService. No console.* (lint-enforced).
- Never log: image bytes/base64, API keys, full prompts in production, or raw provider errors
  at user-facing level (log server-side, return the safe envelope).
- Log pipeline milestones (validated, traits-extracted, judged) with request-scoped context,
  not payload contents.
