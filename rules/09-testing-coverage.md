# 09 — Testing & Coverage

> Tests are the proof a change is safe — written **first**, run at every gate, enforced by a coverage floor. Runner: **Vitest** (multi-project) + `@nestjs/testing` + supertest (api) + Testing Library (web) + Playwright (e2e). **Never Jest** — no `jest.mock`, `jest.fn`, ts-jest, or `@jest/globals` anywhere. Implements rule 40 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [/testing/testing-strategy.md](../testing/testing-strategy.md) · [/testing/coverage-policy.md](../testing/coverage-policy.md) · [/testing/quality-gates.md](../testing/quality-gates.md) · [/skills/write-unit-tests.md](../skills/write-unit-tests.md) · [/memory/testing-strategy.md](../memory/testing-strategy.md)

---

## 1. Tests-first (TDD is the default)

1. Write a failing test that names the desired behavior.
2. Write the minimum code to make it green.
3. Refactor with the test as the safety net; add the next scenario.

| Situation | What you write first |
| --- | --- |
| New behavior | The failing test, then implement |
| Bug fix | A test that **reproduces** the bug (red), then the fix (green) — the permanent regression guard |
| Behavior change | Updated tests **in the same change** (rule 40) |
| Refactor of untested code | Characterization tests pinning today's behavior first |

Tests assert **behavior**, not implementation details.

---

## 2. Layers & Vitest projects

| Project | Root | Covers | Naming |
| --- | --- | --- | --- |
| `api-unit` | `apps/api` | services, use cases, adapters, filters, lib — collaborators doubled | `*.test.ts` |
| `api-integration` | `apps/api` | controllers through the real Nest pipeline (supertest) | `*.integration.test.ts` |
| `shared-unit` | `packages/shared` | schemas, enums, utils | `*.test.ts` |
| `web-unit` | `apps/web` | hooks, services, gateways, components (Testing Library, jsdom) | `*.test.{ts,tsx}` |
| `lint-rules` | `eslint` | the custom architecture plugin's own tests | `*.test.mjs` |
| e2e | `apps/web/e2e` | Playwright workflows against mocked backend routes | — |

- **Naming is `*.test.ts` / `*.integration.test.ts`** — never `*.spec.ts`.
- The api projects run through **SWC** (`unplugin-swc`) because esbuild can't emit the decorator metadata Nest DI needs — don't remove the plugin from `vitest.config.ts`.
- **`npm run build:shared` is a prerequisite**: every test script builds `packages/shared` first because both apps consume it as dist. A stale shared build is the first suspect for "impossible" contract failures.

---

## 3. Coverage floor: 95 / 90 / 95 / 95

`npm run test:coverage` enforces **statements 95% · branches 90% · functions 95% · lines 95%** on the gated scope; Husky `pre-push` runs it — a dip blocks the push.

- **The branch floor is 90 only because the SWC decorator transform emits a synthetic, unexecutable branch per decorated class.** Real branch coverage is expected at ~95 — never treat the 90 as headroom for untested logic.
- **Gated scope:** `apps/api/src`, `apps/web/src`, `packages/shared/src`, excluding declarative/no-logic files (types, enums, constants, barrels, `main.ts`, Next `app/` route shells) — keeping non-logic out of the denominator is why zero-inline (rules/05) is also coverage strategy.
- **Risk centers sit near 100%:** the analyze pipeline, `file-security`, AI safety filtering, and the exception filter.
- No skipped or focused tests in main (`.only` is lint-banned).

---

## 4. What to test, where

| Layer | Unit | Integration / e2e |
| --- | --- | --- |
| Controller | one delegation: forwards parsed input to exactly one application method | full pipe/filter chain via supertest (status codes, validation, envelope shape) |
| Use case | orchestration order, cleanup in `finally` (buffer wipe on **failure** paths too), error mapping | the route that triggers it |
| Service | happy + unhappy + boundary; correct delegation + args; typed `AppError`s | — |
| Adapter | mapping + error translation with the SDK doubled; timeout behavior | — |
| DTO/schema | valid passes; each missing/invalid/oversized field rejected; boundary values; unknown-key rejection | malformed body → 400 envelope, never 500 |
| Upload chain | every link rejects correctly, in order; fail-closed ClamAV path | end-to-end reject/accept flows |
| AI safety | forbidden wording rejected/sanitized; safetyCheck flags enforced; extraction-only image call; shared schema caps (221-field taxonomy, candidate pool ≤25, requested results 1–10) | — |
| Frontend hook/service/gateway | state transitions, mapping, zod response validation | Playwright flows with mocked routes |

**Boundary discipline:** mock the system's *dependencies*, never the subject. **Always mock external providers (Gemini, ClamAV) — never call a real provider in any test or CI run.** Real-Gemini runs are manual and documented. Isolate every test (`vi.clearAllMocks()` in `beforeEach`); type doubles with `import type { Mock } from 'vitest'` — never `any` or `@ts-ignore`, even in tests.

---

## 5. Scenario coverage (more than line coverage)

Every suite exercises, unless justified in review: happy path · validation failure (typed 400, never 500) · consent missing · not-found/empty · boundary values at the caps · dependency failure (adapter throws → mapped `IntegrationError`) · timeout path · fail-safe side effect (handler swallows its own error) · **privacy invariants** (buffer wiped on failure, nothing image-shaped in logs or responses).

## 6. Determinism

Control time (`vi.useFakeTimers`/`vi.setSystemTime`, restore in `afterEach`) and randomness (inject generators). No arbitrary sleeps; await promises or advance fake timers. No real network, clock, or filesystem in unit tests. Flaky tests are defects — fix the cause, never rerun-until-green.

## 7. Commands & gates

```bash
npm run test:unit        # api-unit + web-unit + shared-unit + lint-rules
npm run test:integration # api-integration
npm run test:e2e         # Playwright (mocked backend)
npm run test:coverage    # enforces 95/90/95/95
```

All gates green before "done" (Husky: pre-commit lint-staged + typecheck; commit-msg commitlint; pre-push coverage + build — never `--no-verify`):

```bash
npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
```

---

## Checklist

- [ ] Test written/updated **first**; bug fixes ship a reproducing regression test
- [ ] Right project: `*.test.ts` unit, `*.integration.test.ts` supertest, Playwright e2e — never Jest, never `*.spec.ts`
- [ ] Providers (Gemini, ClamAV) always doubled; no real network anywhere in CI
- [ ] Scenarios cover happy + validation + boundary + failure + timeout + privacy-invariant paths
- [ ] Coverage ≥ 95/90/95/95 on the gated scope; risk centers near 100%; no `.only`/skips in main
- [ ] Deterministic: time/randomness controlled, zero sleeps
- [ ] `build:shared` fresh before diagnosing contract failures
- [ ] Full gate chain green; hooks never bypassed
