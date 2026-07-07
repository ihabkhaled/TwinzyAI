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
