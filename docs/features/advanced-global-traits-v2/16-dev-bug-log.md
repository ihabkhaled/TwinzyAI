# 16 - Internal Bug Log

## Purpose

Track implementation-team defects and their resolution before the change is handed to QA as internally stable. Scope: the `advanced-global-traits-v2` feature (request TWZ-V2-001).

## Bug Log

| Bug ID | Summary | Severity | Found by | Status | Fix PR / commit | Re-test result |
| --- | --- | --- | --- | --- | --- | --- |
| V2-BUG-01 | Language switch always failed with "We could not translate the result. Still showing the previous language." | High (feature-blocking for the translate flow) | User (live dev, 2026-07-08) | fixed | timeout + retry commit | 496 unit/integration + 11 e2e green; live translate 201 |
| V2-BUG-02 | After a failed translation the UI could never retry that locale (permanent dead-end) | Medium (recoverability) | Root-cause analysis of V2-BUG-01 | fixed | same commit | hook + container tests assert retry re-issues the text-only call |
| V2-BUG-03 | Local `dist/main` crash + "vibe engine unavailable" during dev | Medium (dev-env only) | User (2026-07-07) | fixed | prior commit `01c33ae` + this report | dual dev-server race + Gemini free-tier quota; see §Re-Test Notes |

## Root Cause Analysis

### V2-BUG-01 — translation always fails (primary)

- **Symptom:** switching language on a result surfaced the translation-failed
  message every time; the previous language stayed on screen.
- **Root cause:** the shared axios client hard-codes a **15 000 ms timeout**
  (`apps/web/src/packages/axios/http-client.ts`). Real Gemini translation of a
  full result runs **13–25 s** (measured live: light payload 12.9 s, heavy
  5-result payload 23.1 s). `postJson` therefore aborted the request at 15 s
  and the mutation reported failure — even though the backend was returning a
  valid `201` translation. Analyze was immune because it streams over a
  separate fetch path (`stream-request.ts`), not the 15 s axios client, which
  is exactly why analyze worked while translate did not.
- **Evidence:** live probes to `POST /api/v1/game/translate-result` returned
  `HTTP 201` in 12.9 s and 23.0 s with valid Arabic output — proving the
  backend was healthy and the client timeout was the abort point.
- **Fix:** `postJson` now accepts an optional per-request config; the translate
  gateway passes `{ timeout: AI_TRANSLATE_REQUEST_TIMEOUT_MS }` (60 000 ms,
  finite so a genuinely hung request still terminates). The 15 s default is
  unchanged for every other call.

### V2-BUG-02 — no retry after failure (recoverability)

- **Root cause:** `useResultTranslation` set a `failedLanguage` guard on error
  and never cleared it except on a new language change or a fresh analyze, so a
  transient failure (timeout/quota) permanently blocked re-attempts of that
  locale.
- **Fix:** the controller now exposes `retry()`, which clears the guard and
  re-arms the translate effect for the current locale. A **Retry** button
  (localized en/ar, `data-testid="translation-retry"`) renders next to the
  error. Auto-retry is deliberately NOT added (it would hammer a rate-limited
  API); recovery is user-initiated.

### V2-BUG-03 — dev crash + unavailable (environment)

- **`dist/main` crash:** two `next dev`/`nest start` watchers ran concurrently
  (an agent-started dev server plus the user's), racing over `apps/api/dist`
  with `deleteOutDir: true`. Resolved by killing orphaned listeners and never
  holding a background dev server; **one `npm run dev` at a time** is the
  supported flow.
- **"vibe engine unavailable":** Gemini free-tier quota (`limit: 20`,
  `gemini-3.5-flash`) exhausted during heavy same-day testing; the model
  fallback chain served requests via `gemini-3.1-flash-lite` (analyze returned
  `201`). Transient, not a code defect. Follow-up already shipped: bounded
  paths-only AI schema-issue logging (`parseAiJsonResponse`) for future
  diagnosability.

## Re-Test Notes

- `npx tsgo` (shared/api/web): 0 errors.
- `npx vitest run`: **496 passed** (79 files), including 3 new/updated targeted
  tests: translate gateway sends the 60 s timeout; `useResultTranslation`
  re-attempts a failed locale on `retry()` and succeeds (and never calls the
  image stream); `GameResult` renders a working retry button on failure.
- `npx playwright test` (reusing the running dev server, mocked backend):
  **11 passed** — happy path, invalid upload, API-failure/retry, mobile
  320/375, PWA, and axe a11y smoke — confirming no regression to the analyze
  flow or the setup-phase container extraction done for size compliance.
- Live `POST /translate-result` (real Gemini via dev API): `201` with valid
  localized output at 12.9 s and 23.0 s.
- ESLint: 0/0 repo-wide, including the strict size/complexity caps that fired
  on the enlarged result container and were resolved by extracting
  `game-setup.container.tsx` and the `renderResultList` helper (no suppressions).

## Stability Decision

- Current status: **stable**
- Remaining accepted issues: translation latency is inherently 13–25 s (real
  model time); mitigated by the loading banner + 60 s ceiling + user retry.
  Free-tier Gemini quota can still cause transient failures — now recoverable
  via the Retry button.
- Approver: Ihab (owner) / Claude (implementer)

## Exit Checklist

- [x] All internal defects logged
- [x] All blockers fixed or explicitly accepted
- [x] Regression re-run after fixes (496 unit/integration + 11 e2e)
- [x] Build marked internally stable

## Evidence And References To Attach

- Fix commit (timeout + retry) — this delivery stream.
- Prior diagnosis commit `01c33ae` (AI schema-issue logging).
- Live probe timings recorded in `15-dev-validation-report.md`.
