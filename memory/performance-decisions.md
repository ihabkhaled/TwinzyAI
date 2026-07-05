# Performance Decisions

- Gemini calls have a hard timeout (GEMINI_TIMEOUT_MS, default 30s) via AbortController.
- The three AI calls are sequential by design (each depends on the previous output).
- Upload capped at 5 MB default; images never buffered more than once.
- Next standalone output for a small Docker runtime image.
