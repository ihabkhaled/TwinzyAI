# End-to-End Testing Standard

> The house standard for end-to-end (E2E) testing — **two tracks**: (A) API journeys through the fully booted Nest application via the Vitest **`api-integration`** project, and (B) browser journeys through the real web UI via **Playwright** inside `apps/web`. Implements the canon in [/context/architecture-map.md](../context/architecture-map.md), [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), and [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md). For the step-by-step authoring recipe see [/skills/write-e2e-tests.md](../skills/write-e2e-tests.md).

E2E is the slowest, highest-confidence layer, so keep it **few and journey-focused**. Everything a lower layer can prove stays at the lower layer ([testing-strategy.md](./testing-strategy.md)).

---

## 1. The two tracks

| Track | Runner | Lives in | Drives | Doubles |
| --- | --- | --- | --- | --- |
| **A — API e2e** | Vitest, `api-integration` project ([vitest.config.ts](../vitest.config.ts)) | `apps/api/src/tests/*.integration.test.ts` | real HTTP against the booted `AppModule` via supertest | only `AI_PROVIDER_ADAPTER` → `FakeAiAdapter` |
| **B — Browser e2e** | Playwright ([playwright.config.ts](../apps/web/playwright.config.ts)) | `apps/web/e2e/*.spec.ts` | a real Chromium against the dev server (port 3100) | the backend, mocked at the network edge with `page.route` |

The tracks are deliberately separate: Playwright is **not** a Vitest project, and no Vitest project ever picks up `apps/web/e2e/**` (the `web-unit` project excludes it). Real Gemini is called by neither track — every suite passes offline.

```bash
npm run test:integration   # Track A — API journeys
npm run test:e2e           # Track B — Playwright (apps/web workspace)
```

> An e2e test that fakes a service or a use-case is a slow unit test. Keep the **inside real**; double only the true external edge (the AI provider for Track A, the whole backend for Track B).

---

## 2. Pitfall: a misnamed test file silently never runs

Every runner selects files by pattern. A file whose name or location matches **no** project's include pattern is not an error — it is *silence*: the suite stays green while the journey it "covers" is never executed. Check the reported test-file count whenever you add a file.

| You write | What actually happens |
| --- | --- |
| `apps/api/src/tests/game-analyze.integration.test.ts` | runs in `api-integration` — correct |
| `apps/api/src/modules/game/tests/analyze-game.use-case.test.ts` | runs in `api-unit` — correct |
| `apps/api/src/tests/game.e2e-spec.ts` | matches **nothing** — silently never runs |
| `apps/api/src/tests/game.e2e.test.ts` | matches `src/**/*.test.ts` → runs in **`api-unit`**, the wrong project |
| `packages/shared/src/schemas.test.ts` | `shared-unit` includes only `tests/**` — silently never runs; move it to `packages/shared/tests/` |
| `apps/web/e2e/game-flow.spec.ts` | Playwright — correct |
| `apps/web/src/features/game/game-flow.spec.tsx` | Playwright's `testDir` is `e2e/`; `web-unit` includes only `*.test.{ts,tsx}` — silently never runs |

Rules of thumb: Vitest files end in `.test.ts` (`.integration.test.ts` for the booted-app pass) and live under a `tests/` folder; Playwright files end in `.spec.ts` and live only in `apps/web/e2e/`. Nothing else exists.

---

## 3. Track A — API journeys

Boot mechanics, fixtures, and the full assertion catalog live in the [integration standard](./integration-testing-standard.md) — Track A **is** the `api-integration` project, exercised as complete journeys rather than single seams. A journey covers the caller's whole experience: consent → upload → pipeline → schema-valid result, plus every rejection a real client can trigger.

### Required journey matrix (the analyze pipeline)

| Journey | Proves | Expected |
| --- | --- | --- |
| Happy path | consent + safe file + 3-step pipeline | 201; body parses with `FinalGameResultSchema`; disclaimer present |
| Image containment | privacy invariant across the whole flow | exactly 1 `imageCalls` entry; text-only steps carry no image |
| No consent | the gate stops the pipeline first | 400 `CONSENT_REQUIRED`; zero provider calls |
| No file | upload validation | 400 `FILE_MISSING` |
| Disallowed type | MIME/extension policy | 415 `FILE_TYPE_NOT_ALLOWED` |
| Renamed bytes | magic-byte check | 422 `FILE_INVALID` |
| Corrupt image | decode check | 422 `FILE_INVALID` |
| Two files | single-file policy | 400 `MULTIPLE_FILES_NOT_ALLOWED` |
| Oversized file | the configured size cap | rejected; pipeline never starts |
| Virus-scan unavailable (prod-mode config) | ClamAV fail-closed | rejected, never silently skipped |
| Provider failure | error sanitization | 5xx envelope with `errorCode`; no `apiKey`, no `stack` |
| Provider timeout | timeout mapping | `AI_TIMEOUT` envelope |
| Empty candidates | fallback branch | schema-valid fallback result, not a crash |
| Rate limit | the analyze throttle | 429 past the per-route limit |
| Unsafe provider output | safety filtering | `AI_RESPONSE_UNSAFE` or sanitized result — forbidden wording never reaches the client |

Negative cases get equal weight with the happy path. A green happy path alone is not adequate validation ([/rules/09-testing-coverage.md](../rules/09-testing-coverage.md)).

### Contract assertions — the three checks per journey

There is no datastore, so "persisted truth" does not exist here; the observable truths are the response, the recorded provider traffic, and the logs.

1. **Response contract** — status code, and the body parsed with the `@twinzy/shared` zod schema (success) or pinned to `{ errorCode }` (failure). Assert the `ErrorCode` member, never a translated/loose message string, so tests hold when wording changes.
2. **Provider traffic** — `adapter.imageCalls` / `adapter.textCalls` prove which pipeline steps ran and that the image stayed contained.
3. **Failure hygiene** — on every failure: nothing sensitive in the body (`expect(bodyText).not.toContain('apiKey')`, no stack), and the pipeline stopped where it should (no further provider calls).

```typescript
it('completes the full journey: consent → upload → schema-valid result', async () => {
  adapter.queueImageResponse(buildTraitExtractionJson());
  adapter.queueTextResponse(buildCandidatesJson());
  adapter.queueTextResponse(buildJudgeJson());

  const response = await request(server())
    .post('/api/v1/game/analyze')
    .field('consent', 'true')
    .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
    .expect(201);

  expect(FinalGameResultSchema.safeParse(response.body).success).toBe(true);
  expect((response.body as { disclaimer: string }).disclaimer).toBe(RESULT_DISCLAIMER);
  expect(adapter.imageCalls).toHaveLength(1);
  expect(adapter.textCalls).toHaveLength(2);
});
```

### Retry semantics

The analyze operation is intentionally **non-idempotent and stateless**: nothing is stored, so a repeated upload simply runs the pipeline again (and burns a throttle slot). The journeys must document that explicitly: a retry after a 4xx is a fresh request; a retry storm hits the 429 boundary. There are no idempotency keys and no duplicate-row hazards — do not invent them.

---

## 4. Track B — browser journeys (Playwright)

Track B lives in `apps/web` and is **owned by the web workstream** — API-side changes never touch it, but API engineers must know its contract because the QA report ([17-qa-report.md](../docs/features/_template/17-qa-report.md)) draws from both tracks.

- **Location & naming:** `apps/web/e2e/<journey>.spec.ts` (`game-flow.spec.ts`, `mobile-theme.spec.ts`, `pwa-a11y.spec.ts`), helpers in `apps/web/e2e/helpers.ts`.
- **Server:** Playwright starts the dev server on **port 3100** (`npm run dev:e2e`) via the `webServer` block in [playwright.config.ts](../apps/web/playwright.config.ts).
- **Backend mocked at the edge:** suites intercept API calls with `page.route` — real Gemini is never called; runs are deterministic and offline. Running against a real backend is an explicit, opt-in mode documented in [docs/docker-local-dev.md](../docs/docker-local-dev.md).
- **Scope:** the upload→consent→result journey, mobile viewport/theming, PWA installability, and axe accessibility checks ([/rules/13-accessibility.md](../rules/13-accessibility.md)).
- **Discipline:** same determinism rules as everywhere — no fixed sleeps (use Playwright's auto-waiting and `expect` polling), no real user data, no real photographs in fixtures.

```bash
npm run test:e2e     # from the repo root — runs Playwright in apps/web
```

---

## 5. Fixtures, isolation, and determinism

Canonical fixture conventions: [test-data-and-fixtures.md](./test-data-and-fixtures.md).

- **Synthetic images only.** `buildJpegBuffer()` / `buildPngBuffer()` / `buildWebpBuffer()` / `buildCorruptJpegBuffer()` — never a real photograph, in either track.
- **Queue exactly what the journey consumes.** A leftover `FakeAiAdapter` queue entry poisons the next test; reset recorded calls and queues in `afterEach`.
- **One boot per suite** (`beforeAll`), `await app.close()` in `afterAll` — leaked handles hang the run.
- **Control time** with `vi.useFakeTimers()` only where a journey is time-sensitive; restore in `afterEach`.
- **No external network** in any track; a test must pass offline.

---

## 6. Coverage and the gate

Track A contributes to the coverage thresholds; Track B does not (Playwright is outside the Vitest coverage scope, and `apps/web` is excluded under the recorded waiver — see [coverage-policy.md](./coverage-policy.md)). The critical journeys — consent, the file-security chain, safety filtering, the 429 boundary, error sanitization — should sit near 100%. Drive every change through the full gate ([quality-gates.md](./quality-gates.md)):

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # tsc --noEmit in every workspace
npm run test:unit       # all unit projects
npm run test:coverage   # thresholds met (95/90/95/95)
npm run build           # shared + api + web compile clean
npm run security:scan   # trivy — 0 HIGH/CRITICAL
```

Never bypass a hook with `--no-verify`. A green run is not proof of correctness — confirm each journey asserts the response contract, the provider traffic, and the failure hygiene, not just the status code. A bug that escaped becomes a failing journey test first, then a fix ([bug-triage-and-retest.md](./bug-triage-and-retest.md)).

---

## Checklist

- [ ] Track A files named `*.integration.test.ts` under `apps/api/src/tests/`; Track B files named `*.spec.ts` under `apps/web/e2e/` — nothing else
- [ ] New test file actually appears in the runner's reported file count (the silent-skip check)
- [ ] Track A boots the real `AppModule`; only the AI adapter is faked; globals mirror `main.ts`
- [ ] Journey matrix covered: happy, containment, consent, every upload rejection, provider failure/timeout, fallback, 429, unsafe output
- [ ] Success bodies parse with the shared zod schema; disclaimer asserted verbatim
- [ ] Failures pin status **and** `ErrorCode`; no stack / secret / vendor detail in any body
- [ ] Provider traffic asserted per journey (`imageCalls` / `textCalls`)
- [ ] Retry semantics stated: stateless re-run, bounded by the throttle
- [ ] Track B mocks the backend at the network edge; no real Gemini, no real photos
- [ ] Adapter queues reset per case; `app.close()` per suite; no sleeps
- [ ] No `any`, no non-null `!`; `as const` members and named constants, never raw literals
- [ ] `lint` / `typecheck` / `test:unit` / `test:coverage` / `build` / `security:scan` all green; no `--no-verify`

**Related:** [/testing/testing-strategy.md](./testing-strategy.md) · [/testing/integration-testing-standard.md](./integration-testing-standard.md) · [/testing/unit-testing-standard.md](./unit-testing-standard.md) · [/testing/coverage-policy.md](./coverage-policy.md) · [/testing/test-data-and-fixtures.md](./test-data-and-fixtures.md) · [/testing/quality-gates.md](./quality-gates.md) · [/skills/write-e2e-tests.md](../skills/write-e2e-tests.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/rules/06-security.md](../rules/06-security.md) · [/rules/14-ai-safety.md](../rules/14-ai-safety.md)
