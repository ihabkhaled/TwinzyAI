# Unit Testing Standard

> The house standard for unit tests in this workspace: **Vitest 4 + `@nestjs/testing`**, one unit in isolation, mocked at every layer boundary, AAA structure, deterministic, branch-complete. Implements the testing canon in [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) and the strategy in [testing-strategy.md](./testing-strategy.md); the recipe for writing them is [/skills/write-unit-tests.md](../skills/write-unit-tests.md).

A unit test proves **one unit** — a use-case, service, adapter, `lib/` helper, zod DTO schema, or the exception filter — with every collaborator across a layer line replaced by a double. It never opens a real network connection, real clock, real AI provider, or real virus scanner. It is the fastest feedback loop and carries the bulk of the coverage floor. The layer above is the [integration standard](./integration-testing-standard.md) (the full Nest app via supertest); above that, the [e2e standard](./e2e-testing-standard.md).

Unit tests run in the **`api-unit`** project (API), **`shared-unit`** (`packages/shared`), **`web-unit`** (web, owned by that workstream), and **`lint-rules`** (the architecture ESLint plugin) — all defined in the root [vitest.config.ts](../vitest.config.ts). The API projects run through an SWC plugin because esbuild cannot emit the decorator metadata Nest DI relies on; you get that for free by matching the file-name patterns (`src/**/*.test.ts`, colocated under a `tests/` folder — never `*.spec.ts`, which no Vitest project picks up).

A function without a test is unfinished work, not a future task. 100% line coverage with zero scenario coverage is paperwork — see [coverage-policy.md](./coverage-policy.md).

---

## 1. What is a unit (and what to mock)

The unit is the **system under test (SUT)**. Everything it calls across a layer boundary is a double. Mock the dependencies, **never the SUT**, and never the pure logic you are trying to prove.

| Unit under test | Mock these (boundaries) | Never mock |
| --- | --- | --- |
| `application/<action>.use-case.ts` | the services it orchestrates, cleanup service, logger | — |
| `application/<name>.service.ts` | adapters, sibling services' public surface, logger, config (via stubs) | the pure `lib/` helpers it calls |
| `adapters/<vendor>.adapter.ts` (Gemini, ClamAV) | the vendor SDK / socket (doubled inside the adapter) | the adapter's own mapping/error/timeout translation |
| `lib/*.ts`, sanitizers, guards | nothing — pure input → output | everything |
| `dto/*.dto.ts` zod schemas | nothing — parse input, assert result | — |
| `core/errors/app-exception.filter.ts` | the host/reply objects | the mapping logic itself |
| `packages/shared/src` schemas/utils | nothing — pure | — |

**Mock at the right depth.** A service test doubles the AI adapter and exercises the real service + real sanitizer/guard `lib/` helpers. If you mock the safety guard too, the test asserts nothing about the decision it claims to verify.

---

## 2. Build the SUT with the NestJS testing module

Wire DI exactly as production with `Test.createTestingModule`, overriding each boundary with a **typed** double. Never `new Service(...)` with an untyped blob — you lose DI parity and silently miss provider-wiring bugs. Use the shared stubs ([test-data-and-fixtures.md](./test-data-and-fixtures.md)) for the logger and config.

```typescript
// DO — real SUT, doubled boundary, typed fakes, reset between cases
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, vi } from 'vitest';

import { AppLogger } from '../../../core/logger/app-logger.service';
import { AI_PROVIDER_ADAPTER, TraitExtractionService } from '../../ai';
import { FakeAiAdapter } from '../../../tests/fixtures/fake-ai-adapter';
import { buildAppLoggerStub } from '../../../tests/fixtures/stubs';

describe('TraitExtractionService', () => {
  let service: TraitExtractionService;
  let adapter: FakeAiAdapter;

  beforeEach(async () => {
    adapter = new FakeAiAdapter();
    const moduleRef = await Test.createTestingModule({
      providers: [
        TraitExtractionService,
        { provide: AI_PROVIDER_ADAPTER, useValue: adapter },
        { provide: AppLogger, useValue: buildAppLoggerStub().logger },
      ],
    }).compile();
    service = moduleRef.get(TraitExtractionService);
  });

  afterEach(() => vi.clearAllMocks()); // reset impls + call history every test
});
```

```typescript
// DON'T — no DI, untyped blob, leaks state, uses `any`
const service = new TraitExtractionService({ generateFromImage: () => '' } as any); // banned
```

Pure `lib/` helpers and zod schemas need no module at all — call them directly. These are the cheapest, most valuable tests.

```typescript
// DO — pure schema: feed inputs, assert accept/reject
it('treats anything but the literal "true" as no consent', () => {
  expect(isConsentGiven({ consent: 'yes' })).toBe(false);
  expect(isConsentGiven({ consent: 'true' })).toBe(true);
});
```

---

## 3. AAA structure — one behavior per test

Every `it` follows **Arrange → Act → Assert**, separated by blank lines, with exactly one behavior under test. Assert both the **return value** and the **collaborator interaction** — never only that a function ran.

```typescript
// DO — clear AAA, asserts the result AND the recorded provider call
it('sends the image to the provider exactly once with the trait prompt', async () => {
  // Arrange
  adapter.queueImageResponse(buildTraitExtractionJson());
  const buffer = buildJpegBuffer();

  // Act
  const traits = await service.extractTraits(buffer, 'image/jpeg');

  // Assert
  expect(Object.keys(traits)).toHaveLength(TRAIT_KEYS.length); // named constant, never 15
  expect(adapter.imageCalls).toHaveLength(1);
});
```

Keep fixtures minimal and realistic. Factor shared fixtures into the builders under `apps/api/src/tests/fixtures/` ([test-data-and-fixtures.md](./test-data-and-fixtures.md)); never share **mutable** state between tests.

---

## 4. Assert typed errors — class, errorCode, AND messageKey

Every typed-error branch (consent, file rejection, unsafe response, provider failure) throws an **`AppError` subclass** (the shared `ValidationError` / `PayloadTooLargeError` / `IntegrationError` … from `apps/api/src/core/errors`, or a module-local one like file-security's `InvalidImageError` / `UnsupportedImageTypeError`). `DomainException` is gone. Each branch gets a dedicated case pinning the **error class**, its stable **`errorCode`** (an `ErrorCode` member from `apps/api/src/core/errors/error-code.constants.ts`), its **`messageKey`** (from `ERROR_MESSAGE_KEY_BY_CODE`), and — where the HTTP mapping matters — the status. Assert rejections with `rejects.toBeInstanceOf(...)` / `rejects.toMatchObject(...)`, never bare truthiness.

```typescript
// DO — class, errorCode, and messageKey all pinned via named members (never a raw string)
it('throws InvalidImageError when the bytes do not decode as the declared type', async () => {
  const file = buildUploadFile({ buffer: buildCorruptJpegBuffer() });

  await expect(fileSecurity.assertSafeImage(file, true)).rejects.toBeInstanceOf(InvalidImageError);
  await expect(fileSecurity.assertSafeImage(file, true)).rejects.toMatchObject({
    errorCode: ErrorCode.FileInvalid, // FILE_INVALID (422)
    messageKey: ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.FileInvalid],
  });
});

it('throws ValidationError (CONSENT_REQUIRED) before touching the file when consent is absent', async () => {
  await expect(fileSecurity.assertSafeImage(buildUploadFile(), false)).rejects.toBeInstanceOf(
    ValidationError,
  );
  await expect(fileSecurity.assertSafeImage(buildUploadFile(), false)).rejects.toMatchObject({
    errorCode: ErrorCode.ConsentRequired,
    messageKey: ERROR_MESSAGE_KEY_BY_CODE[ErrorCode.ConsentRequired],
  });
});
```

Raw provider or filesystem errors must be **mapped** into a typed `AppError` (e.g. `IntegrationError` for a provider failure) before leaving a service — a unit test that sees a bare `Error` escape a service is a failing test ([/rules/19-services-application-layer.md](../rules/19-services-application-layer.md), [/rules/26-error-handling-and-exceptions.md](../rules/26-error-handling-and-exceptions.md)). The global filter ([`core/errors/app-exception.filter.ts`](../apps/api/src/core/errors/app-exception.filter.ts)) then renders any `AppError` as the sanitized `{ statusCode, errorCode, message, messageKey }` envelope.

---

## 5. Branch coverage — the real target

Line coverage is a side effect; **branch + scenario coverage** is the goal. Exercise both sides of every `if`, `else`, `switch` arm, ternary, `??`, `?.`, and guard clause. A function can hit 100% lines with one happy-path call and still leave every error path untested — that is where the bugs live.

Aim for **≥ 10 cases per service / use-case**. Each suite must include these unless explicitly justified in review:

| Scenario | What to assert |
| --- | --- |
| Happy path | expected return; correct collaborator args; response shape |
| Validation / rejection branch | each file-security stage rejects with its own `ErrorCode` |
| Consent gate | pipeline never proceeds without consent; zero adapter calls |
| Safety filtering | forbidden wording or a flagged safety check → rejected/sanitized ([/rules/14-ai-safety.md](../rules/14-ai-safety.md)) |
| Privacy invariant | buffer zero-filled in `finally`; image only ever in `imageCalls`, never `textCalls` |
| Boundary: at / below / above limits | size cap, minimum dimensions, empty candidate list → fallback |
| Empty / null / optional | absent optional fields handled; `[]` triggers the fallback branch, not a crash |
| Branch flag true/false | e.g. ClamAV enabled vs disabled via `buildConfigStub({ enableClamAv: true })` |
| Collaborator failure | adapter rejects / times out → mapped `AI_PROVIDER_UNAVAILABLE` / `AI_TIMEOUT` |
| Malformed vendor output | non-JSON, schema-invalid, or truncated provider response → `AI_RESPONSE_INVALID` |

Per-file thresholds and the exclusion list (wiring-only files, type-only files) live in [coverage-policy.md](./coverage-policy.md). Don't pad data-only files — spend the effort on logic.

---

## 6. Adapters: double the vendor, prove the translation

Adapter unit tests verify **request mapping, timeout behavior, and error translation**, not vendor behavior — the SDK (or socket, for ClamAV) is doubled. The contract: the adapter returns clean domain-shaped data on success and throws a mapped `AppError` (typically `IntegrationError`) on failure; no vendor error, header, or key ever escapes it ([/rules/10-library-modularization.md](../rules/10-library-modularization.md)). Adapters sit outside the gated coverage scope (they wrap an un-runnable external boundary — [coverage-policy.md](./coverage-policy.md)), but their mapping is still unit-proven here and exercised through the integration stubs.

```typescript
// DO — vendor timeout becomes a typed, safe error
it('maps a provider timeout to AI_TIMEOUT without leaking the raw error', async () => {
  sdk.generateContent.mockRejectedValue(new Error('deadline exceeded; apiKey=abc123'));

  await expect(adapter.generateFromText('prompt')).rejects.toMatchObject({
    errorCode: ErrorCode.AiTimeout,
  });
  await expect(adapter.generateFromText('prompt')).rejects.not.toMatchObject({
    message: expect.stringContaining('apiKey'),
  });
});
```

The model name comes from config (`GEMINI_MODEL` via the config stub) — a test that hardcodes a real model string is wrong twice.

---

## 7. Fail-safe side effects and async discipline

A fire-and-forget side effect (cleanup, logging) must **never reject the caller** — and safety-critical cleanup must run on every path. Prove both directions.

```typescript
// DO — the wipe happens even when the pipeline fails
it('wipes the buffer when trait extraction rejects', async () => {
  adapter.queueImageResponse(new Error('provider down'));
  const file = buildUploadFile();

  await expect(analyzeGame.analyze(file, { consent: 'true' })).rejects.toBeInstanceOf(AppError);

  expect(file.buffer.every((byte) => byte === 0)).toBe(true);
});
```

Always `await` the promise under test and drive sequential provider calls with queued responses (`queueTextResponse` twice for candidates + judge); assert call **order and arguments** via the recorded calls, not only counts. See [/rules/08-reliability-durability.md](../rules/08-reliability-durability.md).

---

## 8. Determinism — flaky tests are defects

Never rerun-until-green, never paper over timing with `sleep`. Control everything non-deterministic.

- **Time:** `vi.useFakeTimers()` / `vi.setSystemTime(...)`; restore in `afterEach`. Never assert against live `Date.now()`.
- **Provider:** `FakeAiAdapter` rejects when its queue is empty — an unqueued call fails loudly instead of hanging or flaking.
- **No real I/O:** no network, real clock, real Gemini, or real ClamAV in a unit test — those live behind doubles.
- **Isolation:** `vi.clearAllMocks()` in `afterEach`; rebuild the fake adapter in `beforeEach`. A test that passes only after another test is broken.

```typescript
// DO — frozen clock, restored afterwards
beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z')));
afterEach(() => vi.useRealTimers());
```

---

## 9. Naming

Format: the `it` reads as a behavior — `[does X] when [condition Y]`. `describe` blocks nest **class → method**.

```typescript
// GOOD
describe('FileSecurityService', () => {
  describe('assertSafeImage', () => {
    it('accepts a structurally valid JPEG within the size cap', () => {});
    it('rejects a file larger than the configured maximum', () => {});
    it('rejects a renamed file whose magic bytes do not match the declared type', () => {});
    it('fails closed when ClamAV is enabled but unreachable', () => {});
  });
});

// BAD — vague, untestable from the name, or lying about the assertion
it('should work', () => {});
it('handles error', () => {});
it('returns 400 for invalid input', () => {}); // then asserts a 200 — worse than no test
```

A test description that lies about its assertion is worse than no test: it manufactures false confidence.

---

## 10. The three failures of fake testing — avoid

```typescript
// FAKE 1 — testing the mock: asserts a call happened, nothing about the result or logic
it('calls the provider', async () => {
  await service.extractTraits(buffer, 'image/jpeg');
  expect(adapter.imageCalls).toHaveLength(1); // proves you called a function, not behavior
});

// FAKE 2 — pure pass-through: queue X, assert X back; no branch exercised
it('returns traits', async () => {
  adapter.queueImageResponse(traitsJson);
  expect(await service.extractTraits(buffer, 'image/jpeg')).toBeDefined(); // safety check never tested
});

// FAKE 3 — happy-path-only on a method with five rejection paths
it('analyzes an image', async () => {
  queueHappyPipeline(adapter);
  expect(await analyzeGame.analyze(buildUploadFile(), { consent: 'true' })).toBeDefined();
  // missing: no consent, bad file, unsafe response, provider failure, empty candidates
});
```

The fix is always **more scenarios at the right boundary**, never a lower threshold.

---

## File placement & banned tokens

- Tests live in the nearest `tests/` folder beside the SUT: `apps/api/src/modules/<feature>/tests/<name>.test.ts`; shared-package tests in `packages/shared/tests/<name>.test.ts` (mirrors the layout in [/context/architecture-map.md](../context/architecture-map.md)). The web workspace currently uses `test/` (singular) as a historical convention; new web tests should use `tests/` and existing `test/` folders will be normalized during the `twinzy-hardening-v3` workstream.
- Naming is `*.test.ts` — a `*.spec.ts` file under `apps/api` or `packages/shared` matches **no** Vitest project and silently never runs.
- Type doubles to the collaborator interface (e.g. `FakeAiAdapter implements AiProviderAdapter`); **never** `any`, `@ts-ignore`, non-null `!`, or `eslint-disable` — strict TS and the non-negotiables ([/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), [/rules/11-eslint-typescript.md](../rules/11-eslint-typescript.md)) hold in tests too. No TypeScript `enum` in fixtures — `as const` objects only ([/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)).

```text
DON'T:  jest / jest.mock / jest.fn / jest.spyOn / ts-jest / @jest/globals / *.spec.ts / any / @ts-ignore / eslint-disable
DO:     vi.mock / vi.fn / vi.spyOn / vi.hoisted / vi.useFakeTimers / *.test.ts under tests/ / npm run test:unit
```

---

## Quality gate

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # tsc --noEmit in every workspace
npm run test:unit       # api-unit + web-unit + shared-unit + lint-rules
npm run test:coverage   # statements/functions/lines ≥ 95%, branches ≥ 90%
npm run build           # compiles clean
```

Narrow a run to the module you touched to see the exact metrics the gate enforces, then close every uncovered branch (the focused scripts wrap this for the critical areas):

```bash
npm run test:file-security          # the upload chain, unit + integration
npm run test:ai                     # ai + game + result-aggregation
npx vitest run --project api-unit modules/game   # ad-hoc path filter
```

Never bypass a hook with `--no-verify`. A green run is not proof of correctness — confirm each branch and each `AppError` path has its own assertion.

---

## Checklist

- [ ] Test written/updated **first**; bug fixes ship a reproducing regression test
- [ ] SUT built via `Test.createTestingModule` with typed provider overrides — no `new Service()` blob
- [ ] Mocked at the **boundary**; never the SUT, never the pure util under test
- [ ] AAA structure; one behavior per `it`; asserts return value **and** collaborator interaction
- [ ] Every typed-error branch pins the `AppError` **subclass**, its `errorCode`, and its `messageKey`
- [ ] Scenarios cover happy + validation + consent + safety + privacy + boundary + failure/timeout
- [ ] Adapter tests prove mapping, timeout, and that no vendor detail (key, stack) escapes
- [ ] Buffer-wipe and other `finally` guarantees asserted on success **and** failure paths
- [ ] Deterministic: time controlled; adapter queues reset; `vi.clearAllMocks()` per test; zero sleeps
- [ ] `as const` members / named constants in assertions — no raw literals
- [ ] Touched-file coverage clears the floor (privacy/safety paths near 100%)
- [ ] `npm run lint` / `typecheck` / `test:unit` / `test:coverage` / `build` all green

**Related:** [testing-strategy.md](./testing-strategy.md) · [integration-testing-standard.md](./integration-testing-standard.md) · [e2e-testing-standard.md](./e2e-testing-standard.md) · [coverage-policy.md](./coverage-policy.md) · [test-data-and-fixtures.md](./test-data-and-fixtures.md) · [quality-gates.md](./quality-gates.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/skills/write-unit-tests.md](../skills/write-unit-tests.md) · [/memory/testing-strategy.md](../memory/testing-strategy.md)
