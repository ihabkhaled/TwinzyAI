# Privacy & Data Retention

- Uploaded image: retained ONLY in process memory for the duration of one request; wiped in
  finally. Never on disk, never in logs, never in responses, never in any store.
- Traits/results: computed per request, returned to the client, not stored server-side.
- No accounts, no cookies for tracking, no third-party analytics with photo data.
- Gemini receives the image bytes for exactly one trait-extraction call under Google API terms;
  candidate/judge/translation calls receive derived text only.
- Translate endpoint (`POST /api/v1/game/translate-result`): receives TEXT ONLY — the client's
  existing structured result plus a target language, as a strict JSON body with no file slot by
  construction. Switching the result language in the UI calls this endpoint and never re-sends,
  re-uploads, or re-analyzes the image.
- Data subject requests: nothing to delete server-side — by design there is no stored data.

## Temporary shared results (share links)

- Sharing is OPTIONAL and database-free: a shared result lives ONLY in the API's in-memory
  TTL cache (no DB, no file, no queue), keyed by a crypto-random UUID.
- Auto-expiry: default 10 minutes, configurable 60–3600s via `SHARE_RESULT_TTL_SECONDS`. The
  record is unreachable the instant it expires; a missing id and an expired id return the
  identical safe 404 (`SHARE_NOT_FOUND`) — no existence oracle.
- The uploaded image is NEVER shared: the create request reuses the strict `FinalGameResult`
  contract, which has no file slot; ingest re-runs the safety filter and rejects any
  `data:`/base64/embedded-image string, so no image bytes/url/hash/metadata/embeddings can
  enter the cache. The share page never fetches or renders the image.
- Public-by-link: anyone holding the UUID URL can view that result until it expires — this is
  intentional (no accounts, no auth by product invariant). The UUID is unguessable, the TTL is
  short, the page is `noindex/nofollow`, and nothing identifies the user.
- The cache may drop links EARLIER than the TTL on API restart/redeploy, or be unreadable
  across replicas in a multi-instance deployment (single-instance today; use Redis/Valkey or
  sticky sessions for multi-replica). Nothing is ever persisted.
- Data subject requests (share): still nothing durable to delete — shared records are transient,
  cache-only, and self-expiring; `DELETE /api/v1/share-results/:shareId` can drop one early.
