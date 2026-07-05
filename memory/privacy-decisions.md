# Privacy Decisions

- Images: processed in memory, sent to exactly one AI call, zero-filled in finally. Never
  written to disk, logged, cached, persisted, or returned.
- No accounts, no analytics on photos, no image URLs, no embeddings, no biometric templates.
- Frontend never stores the image in localStorage/sessionStorage/IndexedDB; preview uses an
  object URL revoked on cleanup.
- Trait text is transient per-request; results are not stored server-side.
