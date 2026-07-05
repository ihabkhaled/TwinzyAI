# 07 — Performance & Scalability

- Every external call has a timeout (Gemini via GEMINI_TIMEOUT_MS).
- No unbounded Promise.all over user-controlled input; cap concurrency.
- Mobile bundle lean: no heavy deps without a docs/package-decisions.md entry; lazy-load below-fold.
- Avoid needless rerenders: state lives in hooks, components are pure props renderers.
- Object URLs revoked; buffers released promptly; no memory growth per request.
