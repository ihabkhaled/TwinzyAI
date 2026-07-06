# Integration Testing Standard

> The house standard for API integration tests: boot the **full Nest application** (`AppModule`) with `@nestjs/testing`, drive real HTTP through **supertest**, fake **only** the AI provider adapter, and assert on the **contract** — status, `errorCode` envelope, schema-valid bodies, and the privacy/safety invariants. Implements the canon in [/context/architecture-map.md](../context/architecture-map.md), [/testing/testing-strategy.md](./testing-strategy.md), and [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md); the authoring recipe is [/skills/write-integration-tests.md](../skills/write-integration-tests.md).

## What an integration test is (and is not)

Unit tests mock boundaries and prove one unit in isolation ([unit-testing-standard.md](./unit-testing-standard.md)). Integration tests prove the seams: HTTP → interceptors/guards → controller → application (use-case / service) → adapters, through the **real module wiring**, the real throttler guard, and the real exception filter. There is **no database in this system by design** ([/rules/20-repositories-database.md](../rules/20-repositories-database.md)) — nothing is persisted, so there are no containers, migrations, or read-back-from-storage steps. The durable truth to verify is the **response contract** plus the **recorded provider calls**.

| Layer | Wiring | Doubles | Network in | Runner project |
| --- | --- | --- | --- | --- |
| Unit | `Test.createTestingModule` with providers | every collaborator | none | `api-unit` |
| **Integration** | full `AppModule` | **only `AI_PROVIDER_ADAPTER`** (and ClamAV via config) | supertest (in-process) | `api-integration` |
| Browser e2e | the built web app | backend mocked at the network edge | Playwright | Playwright (apps/web) |

Rule of thumb: an integration test fails when **module wiring, the interceptor/guard chain, DTO parsing, throttling, or the error envelope** are wrong — exactly the bugs unit tests cannot see.

## File naming — or the test never runs

Integration tests are `*.integration.test.ts` under `apps/api/src` — cross-module flows live in `apps/api/src/tests/` (e.g. `game-analyze.integration.test.ts`, `health.integration.test.ts`). The `api-integration` project in [vitest.config.ts](../vitest.config.ts) includes only `src/**/*.integration.test.ts`; the `api-unit` project explicitly excludes that pattern. Consequences:

- `foo.integration.test.ts` → runs in `api-integration`. Correct.
- `foo.test.ts` that boots `AppModule` → runs in `api-unit` — the wrong, slower project. Rename it.
- `foo.integration.spec.ts` → matches **no project and silently never runs**. See the pitfall in [e2e-testing-standard.md](./e2e-testing-standard.md).

Run the pass with `npm run test:integration` (it builds `@twinzy/shared` first — the app imports the built `dist`).

## What every integration test must verify

1. **HTTP contract** — status code and body shape; success bodies parse against the `@twinzy/shared` zod schema (`FinalGameResultSchema.safeParse(...).success === true`).
2. **Error envelope** — failures return the sanitized `{ statusCode, errorCode, message, messageKey }` envelope with a stable `errorCode` value and **no stack, no SQL-ish detail, no secret** ([/rules/22-observability-logging.md](../rules/22-observability-logging.md), [/rules/26-error-handling-and-exceptions.md](../rules/26-error-handling-and-exceptions.md)).
3. **Privacy/safety invariants** — the image reaches the provider **only** via the trait-extraction call (`adapter.imageCalls`), never the text-only steps (`adapter.textCalls`); no consent → zero provider calls; the disclaimer is present on every result ([/rules/14-ai-safety.md](../rules/14-ai-safety.md)).
4. **The file-security chain over HTTP** — each stage rejects with its own status + `errorCode` ([/rules/15-file-upload-security.md](../rules/15-file-upload-security.md)).
5. **Isolation** — adapter queues and recorded calls reset between tests; the app closes in `afterAll`.

## Fake the AI provider — nothing else

The only true external is Gemini, and it is swapped at the **adapter token**, not deeper. `FakeAiAdapter` ([apps/api/src/tests/fixtures/fake-ai-adapter.ts](../apps/api/src/tests/fixtures/fake-ai-adapter.ts)) implements `AiProviderAdapter`, queues deterministic responses per method, and records every call so tests can assert the image never leaks into the text-only pipeline. Real Gemini is **never** called from a test — suites must pass offline, and `GEMINI_MODEL` comes from test env config, never a hardcoded model string.

> Fake at the **adapter** boundary only ([/rules/10-library-modularization.md](../rules/10-library-modularization.md)). Faking a service or a use-case turns an integration test back into a unit test and proves nothing about the seam.

## Wiring the testing module

Import the real `AppModule`, override **only** the true external edges (the AI adapter token, plus ClamAV via a clean stub), and boot with the shared **`createTestApp`** helper ([apps/api/src/bootstrap/create-test-app.ts](../apps/api/src/bootstrap/create-test-app.ts)). It applies the **same** security, validation, and lifecycle configuration as production — the global `/api` prefix, URI versioning, and the Fastify `ready()` gate — so the app under test matches the app that ships. Tests never import `@nestjs/platform-fastify` directly; the bootstrap layer owns the HTTP platform.

```typescript
// apps/api/src/tests/game-analyze.integration.test.ts (abridged)
import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { FinalGameResultSchema, RESULT_DISCLAIMER } from '@twinzy/shared';

import { AppModule } from '../app.module';
import { createTestApp } from '../bootstrap/create-test-app';
import { AI_PROVIDER_ADAPTER } from '../modules/ai';
import { ClamAvAdapter } from '../modules/file-security/adapters/clamav.adapter';
import { FakeAiAdapter, buildCandidatesJson, buildJudgeJson, buildTraitExtractionJson } from './fixtures/fake-ai-adapter';
import { buildJpegBuffer } from './fixtures/image-fixtures';
import { buildCleanClamAvStub } from './fixtures/stubs';

describe('POST /api/v1/game/analyze (integration)', () => {
  let app: INestApplication;
  let adapter: FakeAiAdapter;

  beforeAll(async () => {
    adapter = new FakeAiAdapter();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_PROVIDER_ADAPTER) // the true external edge
      .useValue(adapter)
      .overrideProvider(ClamAvAdapter)       // deterministic clean scan, no clamd daemon
      .useValue(buildCleanClamAvStub())
      .compile();

    app = await createTestApp(moduleRef); // shared bootstrap: prefix, versioning, Fastify ready()
  });

  afterEach(() => {
    adapter.imageCalls.length = 0; // reset recorded calls between cases
    adapter.textCalls.length = 0;
  });

  afterAll(async () => {
    await app.close(); // release the server; without it the run hangs
  });

  const server = (): Server => app.getHttpServer();
});
```

> **Why `createTestApp`.** Booting through the same helper that wraps `create-app.ts` means the prefix, versioning, validation pipe, security headers, and the Fastify `ready()` gate are applied exactly once, in one place, and the helper returns a plain `INestApplication`. Never re-create the app with `new FastifyAdapter()` in a test — drifting from the real bootstrap validates a system that doesn't exist, and importing the platform vendor directly breaks the adapter-ownership boundary ([/rules/10-library-modularization.md](../rules/10-library-modularization.md)).

## Driving HTTP with supertest

The analyze route is multipart: consent as a field, the image as an attachment built from the synthetic image fixtures ([test-data-and-fixtures.md](./test-data-and-fixtures.md)) — never a real photograph.

```typescript
it('returns a schema-valid final result on the happy path', async () => {
  adapter.queueImageResponse(buildTraitExtractionJson()); // step 1: image → traits
  adapter.queueTextResponse(buildCandidatesJson());       // step 2: text-only candidates
  adapter.queueTextResponse(buildJudgeJson());            // step 3: text-only judge

  const response = await request(server())
    .post('/api/v1/game/analyze')
    .field('consent', 'true')
    .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
    .expect(201);

  expect(FinalGameResultSchema.safeParse(response.body).success).toBe(true); // contract, not echo
  expect((response.body as { disclaimer: string }).disclaimer).toBe(RESULT_DISCLAIMER);
});
```

## Verifying the privacy and safety invariants

Do not trust a 2xx. The recorded adapter calls are the observable truth about where the image went.

```typescript
// DO — assert the image reached ONLY the trait-extraction step
it('sends the image once and keeps the later steps text-only', async () => {
  queueHappyPipeline(adapter);

  await postValidAnalyze(server()).expect(201);

  expect(adapter.imageCalls).toHaveLength(1); // trait extraction only
  expect(adapter.textCalls).toHaveLength(2);  // candidates + judge, no image parameter exists
});

// DO — consent gate stops the pipeline before any provider call
it('rejects without consent and never calls the provider', async () => {
  const response = await request(server())
    .post('/api/v1/game/analyze')
    .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
    .expect(400);

  expect((response.body as { errorCode: string }).errorCode).toBe(ErrorCode.ConsentRequired);
  expect(adapter.imageCalls).toHaveLength(0);
});
```

```typescript
// DON'T — this only proves the controller returned something
expect(response.status).toBe(201);
```

## The file-security chain over HTTP

Each stage of the upload chain has its own rejection contract. Cover every stage — a renamed file and a corrupt file are different bugs:

| Case | Request shape | Expected |
| --- | --- | --- |
| No file | consent only | 400 `FILE_MISSING` |
| Disallowed type | `.gif` attachment | 415 `FILE_TYPE_NOT_ALLOWED` |
| Renamed bytes | PNG bytes, `.jpg` name + JPEG MIME | 422 `FILE_INVALID` (magic bytes) |
| Corrupt image | JPEG magic bytes, no valid structure | 422 `FILE_INVALID` (decode) |
| Two files | two attachments on the field | 400 `MULTIPLE_FILES_NOT_ALLOWED` |
| Oversized | buffer past the configured cap | rejected per the cap, never processed |
| Virus-scan failure | ClamAV enabled + unreachable (config stub) | fail **closed** — rejected, never skipped |

## Provider failure — the safe envelope

Queue an `Error` on the fake adapter to prove the exception filter sanitizes real-world failures:

```typescript
it('returns a safe error envelope when the provider fails', async () => {
  adapter.queueImageResponse(new Error('raw provider stack trace with apiKey=abc123'));

  const response = await postValidAnalyze(server()).expect(500);

  const bodyText = JSON.stringify(response.body);
  expect(bodyText).not.toContain('apiKey'); // no secret
  expect(bodyText).not.toContain('stack');  // no stack
});
```

Also cover the timeout branch (`AI_TIMEOUT`) and the empty-candidates fallback (queue a candidates response with `[]` and assert the fallback result still validates against the schema).

## Rate limiting — 429 past the throttle

The analyze route carries a stricter per-route throttle than the global default. Prove the boundary: requests within the limit succeed (or fail for their own reasons), the request past it returns **429**. Drive the requests sequentially against the booted app; never `sleep` to reset a window — boot a fresh app per throttle suite or keep the throttle case last and assert only the over-limit response.

```typescript
it('returns 429 once the analyze throttle is exhausted', async () => {
  for (let i = 0; i < ANALYZE_THROTTLE.default.limit; i += 1) {
    queueHappyPipeline(adapter);
    await postValidAnalyze(server());
  }

  await postValidAnalyze(server()).expect(429);
});
```

### Deterministic async — poll a signal, never sleep

Arbitrary `sleep(10_000)` is banned — slow on green, flaky on red. There are no background jobs in this system; every pipeline step is awaited inside the request. If a future case genuinely needs to wait, poll a bounded condition (a recorded call appearing) with a helper, never a fixed delay.

## Isolation and cleanup

- **One boot per suite** in `beforeAll` (booting per test is too slow); reset state per case, not per boot.
- `afterEach`: clear `adapter.imageCalls` / `adapter.textCalls` and any leftover queued responses — a leftover queue entry makes the *next* test pass or fail for the wrong reason.
- `afterAll`: `await app.close()` — leaked handles hang the runner.
- Tests must pass in any order and in isolation; there is no shared datastore to leak through, so any order-dependence is a fixture bug.

## Anti-patterns

- Overriding a service, use-case, or internal provider — that is a unit test wearing an integration costume.
- Asserting only the status code and calling the contract "verified" — parse the body with the shared schema.
- Calling real Gemini or real ClamAV from a test, or reading `process.env` in a test body (use the config layer / stubs).
- Attaching a real photograph as a fixture — synthetic buffers only ([test-data-and-fixtures.md](./test-data-and-fixtures.md)).
- `sleep()` to "wait out" the throttle window; `console.*` in tests.
- Asserting raw error strings instead of the stable `errorCode`.

## Checklist

- [ ] File named `*.integration.test.ts` under `apps/api/src` (cross-module flows in `src/tests/`)
- [ ] Boots the real `AppModule`; only `AI_PROVIDER_ADAPTER` overridden (ClamAV via config stub)
- [ ] Booted via `createTestApp(moduleRef)` (shared bootstrap); no direct `@nestjs/platform-fastify` import
- [ ] Success bodies parsed with the `@twinzy/shared` zod schema; disclaimer asserted
- [ ] Failures pin status, `errorCode`, **and** `messageKey`; body contains no stack, secret, or vendor detail
- [ ] Consent gate proven: zero provider calls without consent
- [ ] Every file-security stage has its own rejection case
- [ ] Image reaches only `imageCalls`; text-only steps carry no image
- [ ] 429 asserted past the analyze throttle; provider failure/timeout mapped safely
- [ ] Adapter queues/calls reset in `afterEach`; `app.close()` in `afterAll`
- [ ] One concern per `it`; the title states scenario + expected outcome

## Quality gate

```bash
npm run lint              # 0 errors AND 0 warnings
npm run typecheck         # tsc --noEmit in every workspace
npm run test:integration  # the api-integration project
npm run test:coverage     # thresholds enforced (95/90/95/95)
npm run build             # compiles clean
```

Related: [testing-strategy.md](./testing-strategy.md) · [unit-testing-standard.md](./unit-testing-standard.md) · [e2e-testing-standard.md](./e2e-testing-standard.md) · [test-data-and-fixtures.md](./test-data-and-fixtures.md) · [quality-gates.md](./quality-gates.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/rules/15-file-upload-security.md](../rules/15-file-upload-security.md) · [/rules/14-ai-safety.md](../rules/14-ai-safety.md) · [/skills/write-integration-tests.md](../skills/write-integration-tests.md) · [/memory/testing-strategy.md](../memory/testing-strategy.md)
