# Coverage Policy

> The coverage contract for this workspace: **statements 95% / branches 90% / functions 95% / lines 95%** on the gated scope, measured with Vitest 4 and the **v8 provider** (`@vitest/coverage-v8`), and enforced at **pre-push**. This implements the canon — [/context/architecture-map.md](../context/architecture-map.md), [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md), and [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) — and is tied to root [vitest.config.mts](../vitest.config.mts).

Coverage is a hard gate, not a vanity metric. A green coverage run proves *which lines executed*, not that behavior is correct — pair it with the scenario discipline in the sibling standards ([unit](./unit-testing-standard.md), [integration](./integration-testing-standard.md), [e2e](./e2e-testing-standard.md)).

---

## 1. The thresholds

| Metric | Floor (gated scope) | Target for critical logic |
| --- | --- | --- |
| `statements` | 95% | near 100% |
| `branches` | 90% (see note) | near 100% of **real** branches |
| `functions` | 95% | near 100% |
| `lines` | 95% | near 100% |

> **Branch-floor note.** The decorator downlevel transform (the SWC pass the API projects need for Nest DI metadata) injects one uncoverable synthetic branch on every `@Injectable`/`@Catch` class-declaration line ([known-pitfalls](../memory/known-pitfalls.md)). The 90% branch floor exists **only** to absorb that artifact; every **real** branch in changed code must still be covered — reviewers check the per-file table, and lowering any threshold to absorb untested logic remains forbidden (§6).

**Critical logic** here = the file-security chain, AI safety filtering, the buffer-wipe guarantee, consent gating, rate limiting, and error sanitization — any path whose failure is a privacy or safety incident. These aim for near-100% with rich scenario coverage (happy path + every rejection/boundary branch), not just a high number. A high percentage with shallow assertions is still inadequate.

The four numbers live in root [vitest.config.mts](../vitest.config.mts). Do **not** edit them down to make a red run pass — that is a silent waiver and is forbidden (§6).

---

## 2. The gated scope — what the floor applies to

The denominator is a **logic-bearing allowlist**, not "all of `src`". `coverage.include` names exactly the files whose behavior the floor guards (mirror of [vitest.config.mts](../vitest.config.mts)):

| In scope | Why |
| --- | --- |
| `apps/api/src/core/errors/error-body.mapper.ts` | maps any throw to the sanitized envelope — leak prevention is logic |
| `apps/api/src/core/errors/app-exception.filter.ts` | the global filter that catches and sanitizes every error |
| `apps/api/src/core/logger/app-logger.service.ts` | redaction/formatting behavior |
| `apps/api/src/core/logger/http-logging.options.ts` | request-log shaping + redaction options |
| `apps/api/src/core/validation/validation-exception.factory.ts` | turns validation failures into typed errors |
| `apps/api/src/core/validation/zod-issue.mapper.ts` | maps zod issues to the client message shape |
| `apps/api/src/core/http/multipart-upload.parser.ts` | parses the multipart upload — bounded, branch-heavy |
| `apps/api/src/core/http/uploaded-image.interceptor.ts` | single-file / consent gate before the handler |
| `apps/api/src/modules/**/application/**/*.ts` | use-cases + services — orchestration, the buffer-wipe guarantee, business logic |
| `apps/api/src/modules/**/infrastructure/**/*.ts` | repositories — parameterized, bounded data access |
| `apps/api/src/modules/**/lib/**/*.ts` | sanitizers, guards, parsers, mappers — pure logic |
| `apps/web/src/modules/**/{helpers,mappers,services,gateway,schemas}/**/*.ts` | frontend domain mapping, validation, transport, and orchestration |
| Selected changed/critical web hooks and UI-preference store | browser lifecycle, sharing, locale/theme state |
| Selected web package/shared wrappers | HTTP streaming, browser/storage boundaries, shared helpers/hooks |
| `packages/shared/src/utils/**/*.ts` | the cross-side pure utilities |

**Excluded from the denominator** — not in the allowlist because they carry no branchable logic or wrap an un-runnable external boundary exercised only through integration stubs. The vitest `exclude` list also strips `**/tests/**`, `**/*.test.ts(x)`, `**/*.d.ts`, and `**/index.ts` barrels outright:

| Excluded | Why |
| --- | --- |
| `apps/api/src/modules/**/adapters/**` | wrap the un-runnable Gemini SDK / clamd TCP socket — exercised via integration stubs |
| `model/`, enums, constants, `types/` | declarations carry no branches |
| `dto/` (zod schema declarations) | schema shapes; their *logic* is proven by contract tests, not counted here |
| error subclasses (`*.error.ts` — one-line status) | a status field + super call, no branch to assert |
| `*.vendor.ts` re-exports | vendor pass-through, no logic |
| `bind-app-logger.ts` + `**/*.module.ts` wiring | DI wiring, no branch logic |
| `apps/api/src/bootstrap/**`, `apps/api/src/main.ts` | app assembly; exercised by the integration boot |
| `apps/api/src/core/openapi/**` | Swagger surface, no branch logic |
| `**/index.ts` barrels | re-exports only |
| `**/tests/**`, `**/*.test.ts(x)`, `**/*.d.ts` | the tests, fixtures, and type declarations themselves |

> **Strategic consequence:** keeping types/enums/constants in dedicated declaration files (an architecture rule — [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)) also keeps them out of the coverage denominator. Clean architecture and a clean gate are the same move.

Never move an `application/` use-case or service, an `infrastructure/` repository, or a `lib/` file out of the allowlist (or into the exclude list) to dodge the gate.

---

## 3. How it is measured (Vitest 4 + v8)

The provider is **`@vitest/coverage-v8`**. Coverage is configured once, at the root config, across all Vitest projects (abridged):

```ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  reportsDirectory: 'coverage',
  include: [/* the logic-bearing allowlist — §2 */],
  exclude: [/* tests, *.d.ts, index.ts barrels — §2 */],
}
```

- `text` → human-readable per-file table in the terminal — the table reviewers read.
- `lcov` → artifact for the PR coverage view.

Run it:

```bash
npm run test:coverage   # build:shared, then vitest run --coverage across all projects
```

The `build:shared` step matters: `@twinzy/shared` is consumed as built `dist`, so a stale build measures yesterday's contract. The root script already chains it — do not bypass the script with a bare `npx vitest`.

---

## 4. Per-file, not just global

A tree-wide average hides thin, untested files behind well-tested ones. This policy measures the **files you touched**, not the summary line.

- **In practice:** before you call work done, confirm each changed `application/` use-case or service, `infrastructure/` repository, `lib/` helper, and in-scope `core/` file clears the floor on all four metrics — read the per-file table, not the total. (Adapters are outside the gated scope; prove them via their unit and integration stubs.)
- **Focused runs** make this cheap:

```bash
npm run test:file-security   # the upload chain
npm run test:ai              # ai + game + result-aggregation
npm run test:security        # file-security + privacy + common
```

- A new file with zero tests must never ride in on the global average — its per-file row is the review evidence.

```ts
// Don't — lower the floor to silence a red run
coverage: { thresholds: { lines: 80 } } // unrecorded waiver — forbidden
```

---

## 5. How it is enforced (pre-push)

The floor is enforced where it cannot be skipped: the **Husky pre-push hook** (see [quality-gates.md](./quality-gates.md)).

| Gate | Hook | Runs | Blocks |
| --- | --- | --- | --- |
| Lint + typecheck | pre-commit | `lint-staged` + `npm run typecheck` | commit |
| Commit format | commit-msg | `commitlint` (Conventional Commits) | commit |
| **Coverage + build** | **pre-push** | **`npm run test:coverage` + `npm run build`** | **push** |

A red suite or a coverage dip below any threshold makes `npm run test:coverage` exit non-zero, which fails pre-push and stops the push. CI re-runs the same command in a clean environment so the gate cannot be a local-only illusion.

- **Never** bypass with `git push --no-verify` (or `git commit --no-verify`) — banned by [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) and the SDLC policy in [/docs/sdlc/company-sdlc-policy.md](../docs/sdlc/company-sdlc-policy.md).
- The local hook and CI use the **same** `npm run test:coverage` entrypoint — no divergent shadow steps.

---

## 6. Waiver rules

The floor is the default; a waiver is the rare, recorded exception.

A waiver is only valid when **all** of the following hold:

1. **Genuinely unreachable defensive code** — e.g. a fall-through arm that an earlier guard already made impossible, or the synthetic decorator branches described in §1. Not "I ran out of time."
2. **Narrowly scoped** with a v8 ignore hint *and* a one-line justification comment, attached to the smallest possible region:
   ```ts
   /* v8 ignore next -- unreachable: the magic-byte stage rejects every other format first */
   throw new InvalidImageError('Unsupported format'); // 422, errorCode FILE_INVALID
   ```
3. **Recorded as a decision** in [/memory/testing-strategy.md](../memory/testing-strategy.md) (or the feature's [12-coverage-plan.md](../docs/features/_template/12-coverage-plan.md) under `docs/features/<slug>/`) with: what was waived, why it is unreachable/unsafe-to-test, who approved it, and the residual risk.
4. **Approved** by a reviewer with authority over the area — privacy/safety/upload/AI-output code requires the security reviewer ([/agents/backend-security-reviewer.md](../agents/backend-security-reviewer.md)).

There is no standing frontend waiver: the web logic allowlist is part of the root coverage gate.

What is **not** a waiver: lowering a threshold, adding a logic file to the exclude list, deleting assertions to make a branch "covered", or `--no-verify`. Each of those is an unrecorded, blanket waiver and is forbidden.

> Prefer **refactoring for testability** over a waiver. An untestable branch usually signals a design smell — extract the decision to a `lib/` helper, the vendor call to an adapter, or the orchestration to a use-case. See [/skills/decompose-large-file.md](../skills/decompose-large-file.md).

---

## 7. Workflow checklist

Tests come **first** ([/rules/09-testing-coverage.md](../rules/09-testing-coverage.md)): write/adjust the failing test, implement the minimal change, then prove the floor.

- [ ] Wrote/updated tests **before** the implementation change.
- [ ] `npm run test:coverage` is green — process exit 0, all four thresholds met.
- [ ] Each **touched** logic file (use-case / service / repository / lib / filter / shared) clears the floor — checked the per-file table, not the global summary.
- [ ] Critical logic (consent, file security, safety filtering, buffer wipe, throttle, error sanitization) is near 100% with branch-level scenarios, not just a high number.
- [ ] Security surface tested where applicable: consent 400, upload rejections (400/413/415/422), 429 past the throttle, no leakage on failure ([/testing/integration-testing-standard.md](./integration-testing-standard.md)).
- [ ] No threshold lowered, no logic file added to the exclude list, no deleted assertions to fake a branch.
- [ ] Any waiver is v8-ignore-scoped, justified inline, **and** recorded + approved per §6.
- [ ] Pre-push gate (`test:coverage` + `build`) passes without `--no-verify`.

---

## Related

[/testing/quality-gates.md](./quality-gates.md) · [/testing/testing-strategy.md](./testing-strategy.md) · [/testing/unit-testing-standard.md](./unit-testing-standard.md) · [/testing/integration-testing-standard.md](./integration-testing-standard.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md) · [vitest.config.mts](../vitest.config.mts) · [/memory/testing-strategy.md](../memory/testing-strategy.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
