# Privacy & Data Retention

- Uploaded image: retained ONLY in process memory for the duration of one request; wiped in
  finally. Never on disk, never in logs, never in responses, never in any store.
- Traits/results: computed per request, returned to the client, not stored server-side.
- No accounts, no cookies for tracking, no third-party analytics with photo data.
- Gemini receives the image bytes for exactly one trait-extraction call under Google API terms;
  candidate/judge calls receive derived text only.
- Data subject requests: nothing to delete server-side — by design there is no stored data.
