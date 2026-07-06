# Testing — Engineering Standards Index

> The house testing standard for this npm-workspaces monorepo (NestJS 11 API + Next.js web + `@twinzy/shared`): strategy, layers, coverage, fixtures, gates, and the bug→retest loop. It implements the canon — [00 non-negotiable rules](../rules/00-non-negotiable-rules.md) (no behavior change without tests, written first), [09 testing & coverage](../rules/09-testing-coverage.md), and the [architecture map](../context/architecture-map.md) — and binds the engineering test suite to the SDLC test artifacts in [/docs/features](../docs/features/README.md) and [/test-cases](../test-cases/unit/unit-test-case-template.md).

Toolchain is fixed: **Vitest 4** (multi-project, root [vitest.config.ts](../vitest.config.ts), `@vitest/coverage-v8`) + **@nestjs/testing** + **supertest** for the API, **Playwright** for browser e2e inside `apps/web`. Validation is **zod** everywhere. No `jest`, no `ts-jest`. See [stack-and-toolchain.md](../context/stack-and-toolchain.md).

---

## The documents in this folder

| Doc | Owns |
| --- | --- |
| [testing-strategy.md](./testing-strategy.md) | The pyramid, what each layer proves, when to write which test |
| [unit-testing-standard.md](./unit-testing-standard.md) | Isolated use-case/service/adapter/lib tests with mocked collaborators |
| [integration-testing-standard.md](./integration-testing-standard.md) | Full Nest app booted over HTTP with only the AI adapter faked |
| [e2e-testing-standard.md](./e2e-testing-standard.md) | Two tracks: API journeys (Vitest `api-integration`) and browser journeys (Playwright) |
| [coverage-policy.md](./coverage-policy.md) | The thresholds (95/90/95/95), gated scope, waivers |
| [test-data-and-fixtures.md](./test-data-and-fixtures.md) | The shared fixture modules, deterministic data, privacy-safe inputs |
| [quality-gates.md](./quality-gates.md) | The six gates and the exact commands that must be green before "done" |
| [bug-triage-and-retest.md](./bug-triage-and-retest.md) | Severity, root-cause, regression test, retest evidence |

---

## The test pyramid (mapped to the real runner projects)

The runner is Vitest 4 in multi-project mode at the repo root ([vitest.config.ts](../vitest.config.ts)). Browser e2e is Playwright and runs separately inside `apps/web`.

```
        ┌──────────────────────────────────────────────┐
        │  Browser e2e — Playwright (apps/web/e2e)      │  Few, slow — real UI, mocked backend
        ├──────────────────────────────────────────────┤
        │  API e2e / integration — api-integration      │  Moderate — full AppModule over HTTP
        ├──────────────────────────────────────────────┤
        │  Contract — zod DTOs + @twinzy/shared schemas │  Per schema — shared-unit + api-unit
        ├──────────────────────────────────────────────┤
        │  Unit — api-unit · web-unit · shared-unit ·   │  Many, fast, isolated — the bulk
        │         lint-rules                            │
        └──────────────────────────────────────────────┘
```

| Vitest project | Root | Includes | Notes |
| --- | --- | --- | --- |
| `api-unit` | `apps/api` | `src/**/*.test.ts` (excl. `*.integration.test.ts`) | SWC plugin emits the decorator metadata Nest DI needs |
| `api-integration` | `apps/api` | `src/**/*.integration.test.ts` | boots the real `AppModule`, drives HTTP with supertest |
| `shared-unit` | `packages/shared` | `tests/**/*.test.ts` | zod schema/constant/util contract tests |
| `web-unit` | `apps/web` | `src/**/*.test.{ts,tsx}` (excl. `e2e/**`) | jsdom; owned by the web workstream |
| `lint-rules` | `eslint` | `architecture-plugin/tests/**/*.test.mjs` | ESLint `RuleTester` suites for the architecture plugin |

Browser e2e = **Playwright** in `apps/web` ([playwright.config.ts](../apps/web/playwright.config.ts), specs in `apps/web/e2e/*.spec.ts`, run via `npm run test:e2e`). It is not a Vitest project.

**Guiding principles**

- Write or adjust tests **first**. A behavior change ships with its tests in the same change ([rules/09](../rules/09-testing-coverage.md)).
- Test at the layer that owns the behavior: pure logic in `lib/`, orchestration in use-cases and focused capabilities in services (both under `application/`), wiring and the HTTP contract in `api-integration`, the user journey in Playwright.
- Test through the real seams: boot the app with `@nestjs/testing` (via the `createTestApp` bootstrap helper), drive HTTP with `supertest`, fake only the AI provider adapter boundary (`FakeAiAdapter`).
- Verify the **contract**, not the echo: parse responses with the `@twinzy/shared` zod schemas; assert the sanitized error envelope (`statusCode` / `errorCode` / `messageKey`) on failures.
- Deterministic always: queued fake AI responses, controlled time, no arbitrary `sleep`.
- Coverage floor: statements/functions/lines **95%**, branches **90%** on the gated scope; privacy/safety-critical paths near 100% — see [coverage-policy.md](./coverage-policy.md).

---

## What each layer proves

| Layer | Subject under test | Collaborators | Asserts |
| --- | --- | --- | --- |
| **Unit (`api-unit`)** | `application/` use-cases + services, `adapters/`, `lib/`, the exception filter, config schema | Mocked (adapters, sibling services, logger, config stubs) | Business rules, error paths, `errorCode` + `messageKey`, branch coverage, buffer-wipe guarantees |
| **Unit (`shared-unit`)** | `packages/shared/src` zod schemas, constants, utils | None — pure | Accept/reject per field, boundary values, safety-constant coverage |
| **Unit (`lint-rules`)** | custom architecture ESLint rules | `RuleTester` | valid/invalid code samples per rule |
| **Contract (zod DTO)** | `dto/*.dto.ts` schemas (e.g. consent parsing) | None | valid input parses; each invalid shape rejected |
| **API integration/e2e (`api-integration`)** | Booted `AppModule` over HTTP | Real pipeline; only `AI_PROVIDER_ADAPTER` overridden with `FakeAiAdapter` | Status codes, the file-security chain, rate limit 429, sanitized error body, image never reaching text-only steps |
| **Browser e2e (Playwright)** | The built web app in a real browser | Backend mocked via `page.route` | Upload → result journey, a11y, PWA/theme behavior |

Layer-by-layer rules: [unit](./unit-testing-standard.md), [integration](./integration-testing-standard.md), [e2e](./e2e-testing-standard.md).

---

## Required cases per subject

Every subject (a zod schema, a service method, an endpoint) must cover the relevant set:

- **Happy path** — valid minimal input succeeds; response parses against the shared schema.
- **Validation failures** — missing consent, missing file, wrong/undeclared MIME type, oversized file, malformed JSON from the provider → a typed `AppError` subclass / 4xx carrying the right `errorCode` and `messageKey`.
- **Boundary** — at/over the size cap, minimal valid image bytes, empty candidate list (fallback path).
- **File-security chain** — magic-byte mismatch, decode failure, ClamAV fail-closed behavior ([rules/15](../rules/15-file-upload-security.md)).
- **AI safety** — forbidden wording in a provider response is rejected or sanitized; the disclaimer is always present ([rules/14](../rules/14-ai-safety.md)).
- **Privacy invariants** — the image buffer is wiped in `finally` on success *and* failure; image bytes never appear in logs, text-only prompts, or responses.
- **Rate limit** — the analyze route returns 429 past its throttle.
- **Provider failure/timeout** — a Gemini failure maps to a safe envelope (`AI_PROVIDER_UNAVAILABLE` / `AI_TIMEOUT`), never a raw stack or key.
- **Response shape** — required fields present; secrets, stacks, and internal details absent.

---

## Test layout & naming

Tests are colocated in `tests/` folders beside the code they prove. File naming is `*.test.ts` and `*.integration.test.ts` — **never `*.spec.ts`** for Vitest suites (only Playwright specs in `apps/web/e2e/*.spec.ts` use that suffix, and they are excluded from every Vitest project).

```
apps/api/src/modules/<feature>/
  application/<name>.service.ts        tests/<name>.service.test.ts
  application/<action>.use-case.ts     tests/<action>.use-case.test.ts
apps/api/src/core/errors/             tests/app-exception.filter.test.ts
apps/api/src/tests/                   <flow>.integration.test.ts
apps/api/src/tests/fixtures/          fake-ai-adapter.ts · image-fixtures.ts · stubs.ts
packages/shared/tests/                <name>.test.ts
apps/web/e2e/                         <journey>.spec.ts   (Playwright only)
eslint/architecture-plugin/tests/     <name>.test.mjs     (lint-rules)
```

| Suffix | Layer | Runner project |
| --- | --- | --- |
| `*.test.ts` under `apps/api/src` | unit + DTO contract | `api-unit` |
| `*.integration.test.ts` under `apps/api/src` | API integration/e2e | `api-integration` |
| `*.test.ts` under `packages/shared/tests` | shared contract | `shared-unit` |
| `*.test.{ts,tsx}` under `apps/web/src` | web unit | `web-unit` |
| `*.test.mjs` under `eslint/architecture-plugin/tests` | lint rules | `lint-rules` |
| `*.spec.ts` under `apps/web/e2e` | browser e2e | Playwright (not Vitest) |

A file whose name matches none of these patterns **silently never runs** — see the pitfall in [e2e-testing-standard.md](./e2e-testing-standard.md).

Test names describe scenario **and** expected outcome so a failure explains itself: `rejects a renamed file whose bytes do not match the declared type`.

---

## Minimal examples

**Unit — service with mocked collaborators (Vitest + @nestjs/testing):**

```typescript
describe('FileSecurityService.assertSafeImage', () => {
  it('rejects a file whose magic bytes do not match the declared MIME type', async () => {
    const file = buildUploadFile({ buffer: buildPngBuffer(), mimetype: 'image/jpeg' });

    await expect(service.assertSafeImage(file, true)).rejects.toMatchObject({
      errorCode: ErrorCode.FileInvalid,
    });
  });
});
```

**API integration — booted app + supertest enforcing the consent gate:**

```typescript
it('rejects a request without consent before any AI call', async () => {
  const response = await request(server())
    .post('/api/v1/game/analyze')
    .attach('image', buildJpegBuffer(), { filename: 'photo.jpg', contentType: 'image/jpeg' })
    .expect(400);

  expect((response.body as { errorCode: string }).errorCode).toBe(ErrorCode.ConsentRequired);
  expect(adapter.imageCalls).toHaveLength(0); // the image never reached the provider
});
```

Do **not** assert on private internals, snapshot whole error bodies, or `console.log` inside tests — assert on the public contract and the sanitized envelope.

---

## How this binds to the SDLC

The engineering suite is the executable half of the SDLC test artifacts. Keep them in lockstep — same delivery stream, same change.

| SDLC artifact ([/docs/features/_template](../docs/features/_template/README.md)) | This folder | Evidence lives in |
| --- | --- | --- |
| [11-test-strategy.md](../docs/features/_template/11-test-strategy.md) | [testing-strategy.md](./testing-strategy.md) | requirement → test-layer map |
| [12-coverage-plan.md](../docs/features/_template/12-coverage-plan.md) | [coverage-policy.md](./coverage-policy.md) | gated-scope thresholds + waivers |
| [15-dev-validation-report.md](../docs/features/_template/15-dev-validation-report.md) | [quality-gates.md](./quality-gates.md) | gate command output |
| [16-dev-bug-log.md](../docs/features/_template/16-dev-bug-log.md) · [18-defect-cycle-log.md](../docs/features/_template/18-defect-cycle-log.md) | [bug-triage-and-retest.md](./bug-triage-and-retest.md) | defect + retest evidence |
| [17-qa-report.md](../docs/features/_template/17-qa-report.md) | [e2e-testing-standard.md](./e2e-testing-standard.md) | QA scenario matrix |

Reusable scenario cases (not just code) live under `/test-cases`: [unit](../test-cases/unit/unit-test-case-template.md), [integration](../test-cases/integration/integration-test-case-template.md), [e2e](../test-cases/e2e/e2e-test-case-template.md), [security](../test-cases/security/security-test-case-template.md), [business](../test-cases/business/business-test-case-template.md). An escaped defect must leave a preserved case there plus a regression test in the suite. The [qa-baseline](../docs/sdlc/qa-baseline.md) defines the company-wide QA expectations these standards satisfy; [docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md) covers the manual pass.

---

## Delivery blockers — never declare "done" with any of these

1. `npm run typecheck` not clean (`tsc --noEmit` in every workspace).
2. `npm run lint` not **0 errors AND 0 warnings**.
3. Any failing test in any Vitest project or Playwright suite.
4. Gated-scope coverage below the floor (95/90/95/95) without an approved, recorded waiver.
5. Behavior changed but tests not written/updated first.
6. A response asserted without parsing it against the shared zod schema, or a failure asserted without its `errorCode`.
7. Missing negative cases for a critical path (consent, file security, AI safety filtering, rate limit, buffer wipe).
8. A new error scenario without a stable `ErrorCode` member, or a raw provider error leaking to the client.
9. Hooks bypassed with `--no-verify` (no recorded emergency exception).
10. A fixed bug without a regression test proving the original failure is covered.

---

## Run the suite

Root scripts build `@twinzy/shared` first (`npm run build:shared`) because the workspace resolves the package's built `dist` — never run a stale-dist suite.

```bash
npm run test              # build:shared + vitest run — every Vitest project
npm run test:unit         # api-unit + web-unit + shared-unit + lint-rules
npm run test:integration  # api-integration only
npm run test:e2e          # Playwright browser e2e (apps/web)
npm run test:watch        # vitest — local TDD loop (build shared first yourself)
npm run test:coverage     # vitest run --coverage — enforces the thresholds

# Focused packs
npm run test:security       # file-security + privacy + common
npm run test:file-security  # the upload chain only
npm run test:ai             # ai + game + result-aggregation
npm run test:pwa            # web PWA suites
```

Full gate (must all be green before "done") — see [quality-gates.md](./quality-gates.md):

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # tsc --noEmit in every workspace
npm run test:unit       # all unit projects green
npm run test:coverage   # coverage thresholds met
npm run build           # shared + api + web compile clean
npm run security:scan   # trivy — 0 HIGH/CRITICAL findings
```

`pre-push` runs `test:coverage` + `build`; never bypass it. A green build is **not** proof of correctness — walk the [review checklist](../rules/23-review-checklist.md).

**Related:** [testing-strategy.md](./testing-strategy.md) · [coverage-policy.md](./coverage-policy.md) · [quality-gates.md](./quality-gates.md) · [bug-triage-and-retest.md](./bug-triage-and-retest.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/memory/testing-strategy.md](../memory/testing-strategy.md) · [/skills/write-unit-tests.md](../skills/write-unit-tests.md) · [/skills/write-integration-tests.md](../skills/write-integration-tests.md) · [/skills/write-e2e-tests.md](../skills/write-e2e-tests.md) · [/skills/final-validation.md](../skills/final-validation.md)
