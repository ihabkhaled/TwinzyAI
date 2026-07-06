# Testing Strategy

> The house test strategy for this monorepo: the pyramid mapped to the real Vitest projects, what each layer proves, the doubles each layer allows, and the evidence a change must leave behind. This implements the testing canon — [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md), [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), and [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md) — and aligns with the layered architecture in [/context/architecture-map.md](../context/architecture-map.md). Runner: **Vitest 4** (multi-project, [vitest.config.ts](../vitest.config.ts)) + **@nestjs/testing** + **supertest**, plus **Playwright** for browser e2e. Never Jest, ts-jest, or `jest.*`. Prior decisions live in [/memory/testing-strategy.md](../memory/testing-strategy.md).

A green build is not proof of correctness. A passing happy path is not proof of correctness. Behavior is proven by tests at the **right layer**, with the **right boundary doubled**, across happy, unhappy, boundary, and safety/privacy paths.

---

## 1. The test pyramid

Many fast unit tests at the base; a moderate band of API integration tests through the real Nest pipeline; a thin cap of browser e2e for the journeys that would hurt most if they broke. Push every assertion to the **lowest layer that can prove it** — only escalate when the proof genuinely needs more wiring.

```
            /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
           /  Browser e2e (few) \      Playwright, apps/web/e2e — upload→result journey, a11y, PWA
          /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
         / API integration (some) \    api-integration — full AppModule over HTTP via supertest
        /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
       /       Unit (many)          \  api-unit · shared-unit · web-unit · lint-rules
      /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

| Layer | Vitest project / runner | Subject | Speed / count | Required when |
| --- | --- | --- | --- | --- |
| **Unit** | `api-unit` | one class in isolation — use-case, service, adapter, lib helper, filter, zod DTO | Fast / many | Every API change |
| **Unit** | `shared-unit` | `@twinzy/shared` zod schemas, constants, utils (`packages/shared/tests/`) | Fast / many | Every shared-contract change |
| **Unit** | `web-unit` | web hooks/services/lib (jsdom) — owned by the web workstream | Fast / many | Every web change |
| **Unit** | `lint-rules` | architecture ESLint rules via `RuleTester` | Fast / per rule | Every plugin-rule change |
| **API integration** | `api-integration` | the booted `AppModule` over HTTP, only the AI adapter faked | Medium / moderate | Routes, DTOs, upload chain, throttling, or error envelope change |
| **Browser e2e** | Playwright (`apps/web/e2e`) | the real UI in a browser, backend mocked at the network edge | Slow / few | The critical upload→result journey, theme/PWA/a11y behavior |

> **Anti-pattern: the ice-cream cone.** A few slow, flaky e2e tests bolted onto thin unit coverage. Invert it. If a rule is a pure decision (a sanitizer, a schema, a dimension parser), prove it with a unit test — not a six-hop journey.

---

## 2. What each layer proves

### Unit — logic in isolation

The base of the pyramid. The subject is real; every collaborator across a layer line is a double. Mock at the **boundary**, never the subject. Full standard: [unit-testing-standard.md](./unit-testing-standard.md).

| Subject | Proves |
| --- | --- |
| **Controller** | Delegates to exactly **one application call** — a use-case or a service — and returns the result untransformed; it has no logic to prove ([/rules/18-routes-controllers.md](../rules/18-routes-controllers.md)). |
| **Use-case (`application/`)** | Orchestration order (file security → trait extraction → candidates → judge → aggregation), the fallback branch on zero candidates, and the **buffer-wipe-in-`finally`** guarantee on success *and* failure ([/rules/19-services-application-layer.md](../rules/19-services-application-layer.md)). |
| **Service (`application/`)** | Happy path, each rejection branch, correct delegation + args, error mapping to a typed `AppError` subclass carrying a stable `errorCode` **and** `messageKey` ([/rules/19-services-application-layer.md](../rules/19-services-application-layer.md), [/rules/26-error-handling-and-exceptions.md](../rules/26-error-handling-and-exceptions.md)). |
| **zod DTO / schema** | Valid input parses; each missing/invalid/oversized field is rejected; boundaries at min/max; literal unions rejected on near-miss values ([/rules/21-dto-validation.md](../rules/21-dto-validation.md)). |
| **Adapter** | The wrapper's request/response mapping, timeout, and error translation, with the vendor SDK doubled ([/rules/10-library-modularization.md](../rules/10-library-modularization.md)). |
| **Lib / pure function** | Every branch, pure input → output. **No mocks needed** — if a `lib/` test needs a mock, logic leaked out of the helper. |
| **Exception filter** | Maps any `AppError` to `{ statusCode, errorCode, message, messageKey }`, maps unknown errors to `INTERNAL_ERROR`, and never leaks stacks or secrets. |

```typescript
// DO — service unit test: real service, doubled adapter, covers happy + unsafe + malformed
describe('TraitExtractionService.extractTraits', () => {
  it('returns 15 traits when the provider response is valid and safe', async () => {
    adapter.queueImageResponse(buildTraitExtractionJson());
    await expect(service.extractTraits(buildJpegBuffer(), 'image/jpeg')).resolves.toBeDefined();
  });

  it('throws AiResponseInvalid when the provider returns malformed JSON', async () => {
    adapter.queueImageResponse('not json at all');
    await expect(service.extractTraits(buildJpegBuffer(), 'image/jpeg')).rejects.toMatchObject({
      errorCode: ErrorCode.AiResponseInvalid,
    });
  });

  it('throws AiResponseUnsafe when the safety check flags an identity claim', async () => {
    adapter.queueImageResponse(buildUnsafeTraitJson());
    await expect(service.extractTraits(buildJpegBuffer(), 'image/jpeg')).rejects.toMatchObject({
      errorCode: ErrorCode.AiResponseUnsafe,
    });
  });
});
```

```typescript
// DON'T — fake coverage: asserts the mock, exercises no logic, skips every error path
it('returns traits', async () => {
  adapter.queueImageResponse(traitsJson);
  expect(await service.extractTraits(buffer, 'image/jpeg')).toBeDefined(); // pure pass-through
});
```

### API integration — the HTTP contract

Boot the real `AppModule`, run the real interceptors, throttler guard, and exception filter, and drive it with supertest. The **only** double is the AI provider adapter (`AI_PROVIDER_ADAPTER` → `FakeAiAdapter`) — the true external edge. Full standard: [integration-testing-standard.md](./integration-testing-standard.md).

This layer proves what unit tests cannot: status codes, the multipart upload chain, consent enforcement before any AI call, the 429 throttle, and the exception filter producing a safe `{ errorCode }` instead of leaking a stack.

```typescript
// DO — integration: real pipeline, supertest assertions on the contract
await request(server()).post('/api/v1/game/analyze').expect(400);                    // no consent, no file
await request(server()).post('/api/v1/game/analyze')
  .field('consent', 'true').expect(400);                                            // FILE_MISSING
await request(server()).post('/api/v1/game/analyze')
  .field('consent', 'true')
  .attach('image', buildPngBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
  .expect(422);                                                                     // magic bytes ≠ declared type
```

### Browser e2e — the journey

The thin cap, owned by the web workstream. Playwright drives the real UI (`apps/web/e2e/*.spec.ts`, [playwright.config.ts](../apps/web/playwright.config.ts)) against a dev server with the backend mocked at the network edge (`page.route`) — real Gemini is never called. Reserve these for flows where a regression is expensive:

| Example flow | Asserts |
| --- | --- |
| Upload photo → consent → result screen | The full game journey renders a result with the disclaimer |
| Mobile viewport + theme switch | Layout and theming hold on the primary device class |
| PWA + a11y pass | Installability and axe checks stay green |

---

## 3. Mapping a change to layers

For every change, decide which layers apply and record why a layer is or isn't needed (silence is not a decision).

| Change | Unit | API integration | Browser e2e |
| --- | --- | --- | --- |
| New/changed service logic (AI, file security, aggregation) | Required | If reachable via the route | — |
| New/changed use-case orchestration | Required | Required (the route) | If it changes the journey |
| New/changed controller or DTO schema | DTO + delegation | Required (pipeline) | Optional |
| New/changed shared schema or constant | Required (`shared-unit`) | If it shapes a response | — |
| New/changed adapter (Gemini, ClamAV) | Required (SDK doubled) | Behavior via `FakeAiAdapter` | — |
| Throttle/rate-limit change | — | Required (429) | — |
| New/changed architecture lint rule | Required (`lint-rules`) | — | — |
| Web UI change | `web-unit` (web workstream) | — | If on the critical journey |
| Bug fix | Reproducing regression test (red → green) | If the bug surfaced at the boundary | If it escaped to the UI |

---

## 4. Environments and doubles

There is **no database by design** ([/rules/20-repositories-database.md](../rules/20-repositories-database.md), [/memory/privacy-decisions.md](../memory/privacy-decisions.md)): nothing is persisted, so there are no test containers, migrations, or seed rows. State lives only for the length of a request.

| Environment | Used by | External vendors |
| --- | --- | --- |
| **Unit** | all unit projects | Doubled (the adapter, or the SDK inside it) |
| **API integration** | `api-integration` | `FakeAiAdapter` replaces the Gemini adapter; ClamAV disabled or faked via config stub |
| **Browser e2e** | Playwright | Backend mocked with `page.route`; no real network |

Rules that hold across environments:

- **No real network, real clock, or real vendor in any test.** Every suite must pass offline. `GEMINI_MODEL`/`GEMINI_API_KEY` in tests are fake values supplied through the config layer.
- **Configuration is typed and validated.** Tests provide config through `buildConfigStub` (see [test-data-and-fixtures.md](./test-data-and-fixtures.md)), never ad-hoc `process.env` reads ([/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md)).
- **Each suite owns its state.** Reset the fake adapter's queues and recorded calls in `afterEach`; never depend on order or leftovers from another test.
- **Shared package is built first.** Root test scripts run `npm run build:shared` before Vitest because `@twinzy/shared` resolves to the built `dist` — a stale build tests yesterday's contract.

---

## 5. Test data & fixtures

- **Builders over literals.** Construct payloads with the shared builders (`buildTraitExtractionJson()`, `buildCandidatePayload({ styleVibeFitScore: 101 })`) so a test states only the field it cares about.
- **Three intentional buckets:** baseline/happy data, edge-case data (boundaries, empty candidate list, max size), and negative data (corrupt bytes, wrong magic bytes, forbidden wording).
- **Synthetic only — especially images.** Test images are minimal synthetic byte buffers (`buildJpegBuffer()`), never real photographs of real people. No PII, no real secrets.
- **Deterministic and isolated.** Builders return fresh objects; the fake adapter fails loudly when no response is queued. Full detail: [test-data-and-fixtures.md](./test-data-and-fixtures.md).

---

## 6. Determinism

Flaky tests are defects — fix the cause, never rerun-until-green or paper over with sleeps.

- **Control time.** `vi.useFakeTimers()` / `vi.setSystemTime(...)`; restore in `afterEach`. Never assert against `Date.now()`.
- **Control the provider.** `FakeAiAdapter` queues responses per method and rejects when the queue is empty — a test that "sometimes" passes is consuming another test's queue.
- **No arbitrary `sleep`/`setTimeout`** to "wait for" async work — await the promise, advance fake timers, or assert on the observable effect.
- **Isolate every test.** `vi.clearAllMocks()` and adapter-queue resets in `afterEach`; a test that only passes after another test is broken.
- **Async is explicit.** Await every promise; assert rejections with `rejects.toMatchObject({ errorCode: ... })` or `rejects.toBeInstanceOf(AppError)`, not bare truthiness.

---

## 7. Scenario coverage (more than line coverage)

100% lines through one happy-path call is paperwork. Branch + scenario coverage is the real target. Every meaningful suite exercises these unless explicitly justified in review:

| Scenario | Why |
| --- | --- |
| Happy path | The feature works; the response parses against the shared schema. |
| Validation failure | Bad/missing/oversized input → typed 4xx with a stable `errorCode`, never 500. |
| Consent missing | The pipeline stops before the file-security chain; the provider is never called. |
| File-security rejection per stage | Size, MIME, extension, extension/MIME consistency, magic bytes, decode, virus scan — each stage has its own rejection test ([/rules/15-file-upload-security.md](../rules/15-file-upload-security.md)). |
| ClamAV fail-closed | Scanner unreachable in production-mode config → reject, never skip silently. |
| AI safety filtering | Forbidden wording / identity-claim flags in a provider response → rejected or sanitized; disclaimer always enforced ([/rules/14-ai-safety.md](../rules/14-ai-safety.md)). |
| Buffer wipe | The image buffer is zero-filled in `finally` on success **and** on every failure path; recorded image calls prove the image reached only trait extraction. |
| Boundary | At / above / below the size cap; empty candidates → fallback result, not a crash. |
| Rate limit | Requests past the analyze throttle → 429. |
| Dependency failure & timeout | Provider rejects or times out → mapped to `AI_PROVIDER_UNAVAILABLE`/`AI_TIMEOUT`, no raw error leaks. |
| Empty / null | Optional fields absent are handled; `[]` returns the fallback, not `null` or a crash. |

```typescript
// DO — prove the privacy invariant, not just the happy path
it('wipes the image buffer even when trait extraction fails', async () => {
  adapter.queueImageResponse(new Error('provider down'));
  const file = buildUploadFile();

  await expect(analyzeGame.analyze(file, { consent: 'true' })).rejects.toBeInstanceOf(AppError);
  expect(file.buffer.every((byte) => byte === 0)).toBe(true); // zero-filled in finally
});
```

---

## 8. Security & privacy tests (mandatory on the upload route)

The analyze route is not "tested" until its security surface is — preferably via **`api-integration`** so the real chain runs end to end ([/rules/06-security.md](../rules/06-security.md), [/skills/security-review.md](../skills/security-review.md), [/skills/secure-file-upload.md](../skills/secure-file-upload.md)):

- **Consent** — no consent → 400 `CONSENT_REQUIRED`; the provider adapter records zero calls.
- **Upload validation** — missing file → 400; disallowed type → 415; renamed bytes → 422; second file → 400; oversized → 413/400 per the configured cap.
- **Injection/abuse-shaped input** — script-shaped or injection-shaped field values are treated as **data** and rejected by the zod schema, never interpreted.
- **Rate limit** — past the analyze throttle → 429.
- **Leakage** — a provider failure carrying a fake API key in its message must produce a body containing neither `apiKey` nor `stack`.
- **Privacy** — no image bytes in any log line (assert via the logger stub); no image data in any response.

---

## 9. Coverage floor

- **Thresholds:** statements **95%** / branches **90%** / functions **95%** / lines **95%**, enforced by `npm run test:coverage` (provider **v8**) and Husky `pre-push`.
- **Gated scope:** the logic-bearing allowlist — `apps/api` `application/` (use-cases + services), `infrastructure/` (repositories), `lib/`, plus the in-scope `core/` files (errors, logger, validation, http), and `packages/shared/src/utils`. Adapters (un-runnable vendor boundaries), wiring (`*.module.ts`, `main.ts`, `bootstrap/`), and declaration-only files (`model/`, `dto/`, error subclasses) are excluded; `apps/web` is excluded under a recorded waiver until the web workstream adopts the gate.
- The 90% branch floor exists **only** to absorb the uncoverable synthetic branch the decorator downlevel emits per `@Injectable`/`@Catch` class line — every real branch must be covered. Full policy: [coverage-policy.md](./coverage-policy.md).

---

## 10. Evidence expected

Tests are the proof; the record of running them is the receipt. For a meaningful change, the validation report ([15-dev-validation-report.md](../docs/features/_template/15-dev-validation-report.md)) should capture:

| Evidence | Source |
| --- | --- |
| Suite result (pass/fail counts per project) | `npm run test` |
| Coverage on touched files vs the floor | `npm run test:coverage` |
| HTTP contract checks (400/413/415/422/429) for the analyze route | `npm run test:integration` output |
| Privacy invariants (buffer wipe, single image call) | use-case unit + integration assertions |
| Safety filtering (forbidden wording rejected) | `npm run test:ai` output |
| Lint / typecheck / build / scan green | the quality-gate block in [quality-gates.md](./quality-gates.md) |

Record what was **not** run (and why, with the residual risk) instead of leaving a silent gap. Keep the original failing evidence **and** the retest evidence for any defect — never overwrite history. See [bug-triage-and-retest.md](./bug-triage-and-retest.md).

---

## 11. Adding tests for new code

| New code | Required tests |
| --- | --- |
| zod DTO / schema | Valid input, each invalid field, boundary values, near-miss literal rejection |
| Service method | Happy path, each rejection branch, error mapping, edges |
| Use-case orchestration | Sequence, fallback branch, buffer-wipe-in-`finally`, failure propagation |
| Adapter | Mapping + timeout + error translation with the SDK doubled |
| Shared schema/constant | Contract tests in `packages/shared/tests/` |
| Controller / route | `api-integration`: status, validation chain, throttle, error envelope |
| Architecture lint rule | `RuleTester` valid/invalid samples in `eslint/architecture-plugin/tests/` |
| Critical journey | Playwright spec in `apps/web/e2e/` (web workstream) |
| Bug fix | A regression test that reproduces the bug (red), then proves the fix (green) |

---

## Quality gates

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # tsc --noEmit in every workspace
npm run test:unit       # all unit projects green
npm run test:coverage   # thresholds met (95/90/95/95)
npm run build           # shared + api + web compile clean
npm run security:scan   # trivy — 0 HIGH/CRITICAL
```

Husky enforces lint-staged + typecheck on `pre-commit`, commitlint on `commit-msg`, and `test:coverage` + `build` on `pre-push`. Never bypass with `--no-verify`.

**Related:** [/testing/README.md](./README.md) · [/testing/unit-testing-standard.md](./unit-testing-standard.md) · [/testing/integration-testing-standard.md](./integration-testing-standard.md) · [/testing/e2e-testing-standard.md](./e2e-testing-standard.md) · [/testing/coverage-policy.md](./coverage-policy.md) · [/testing/test-data-and-fixtures.md](./test-data-and-fixtures.md) · [/testing/quality-gates.md](./quality-gates.md) · [/testing/bug-triage-and-retest.md](./bug-triage-and-retest.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/memory/testing-strategy.md](../memory/testing-strategy.md)
