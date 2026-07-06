# 23 — The Pre-Merge Review Checklist

> The consolidated review gate. Every box is checked or justified `N/A` before a change merges. This is the gate, not the spec — each section links to its canonical rule file. A green build is **not** proof of correctness: lint green is necessary, not sufficient.

Blocker language for review comments: **MUST FIX** (merge blocker — non-negotiable violation, boundary break, leak, untested behavior) · **SHOULD FIX** (real defect; defer only with explicit acknowledgement) · **FOLLOW-UP** (tracked, safe to land later).

---

## Hard gates (CI + Husky) — all green, no exceptions

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # shared build + per-workspace (tsgo for api)
npm run test:unit       # vitest multi-project
npm run test:coverage   # 95 stmts / 90 branches / 95 funcs / 95 lines on the gated scope
npm run build           # shared + api + web compile clean
npm run security:scan   # trivy — HIGH/CRITICAL fail
```

Never bypass a hook with `--no-verify`. Report a failed gate with the command, failing files, exact error, and whether it relates to the change — never claim green when red.

## 1. Types & lint → [11](./11-eslint-typescript.md), [00](./00-non-negotiable-rules.md)

- [ ] **MUST FIX** — no `any`, no `eslint-disable`, no `@ts-ignore`, no unjustified `@ts-expect-error`, no `!`, `===`/`!==` only
- [ ] **MUST FIX** — no TS `enum`; as-const + `*_VALUES`; no magic strings / domain literal comparisons
- [ ] **SHOULD FIX** — explicit return types on public methods; `import type` for type-only; index access narrowed

## 2. Architecture & extraction → [01](./01-architecture.md), [16](./16-backend-architecture.md)

- [ ] **MUST FIX** — code in the correct layer; one-way dependencies; controller = one delegation, no branching ([18](./18-routes-controllers.md))
- [ ] **MUST FIX** — services focused, ≤ ~20 lines/method, no `Promise.all*`; use cases own orchestration; services never call use cases ([17](./17-manager-layer.md), [19](./19-services-application-layer.md))
- [ ] **MUST FIX** — no cross-module internal imports (index.ts only); no inline domain definitions ([05](./05-types-enums-constants.md))
- [ ] **SHOULD FIX** — shaping extracted to `lib/`; no god files; no new cycles

## 3. Validation, errors & i18n → [21](./21-dto-validation.md), [26](./26-error-handling-and-exceptions.md), [12](./12-i18n.md)

- [ ] **MUST FIX** — every boundary zod-parsed; `.strict()` object schemas; zero `class-validator`/`class-transformer`
- [ ] **MUST FIX** — every user-facing failure a typed `AppError` with a distinct `errors.<feature>.<key>`; envelope compatible (legacy `errorCode` + additive `messageKey`); nothing internal leaks
- [ ] **MUST FIX** — every new `messageKey` has its frontend dictionary entry; all UI strings via `t(key)`; no forbidden wording

## 4. Privacy & AI safety (the Twinzy blockers) → [14](./14-ai-safety.md), [15](./15-file-upload-security.md)

- [ ] **MUST FIX** — image handling: multer memory only, buffer zero-filled in `finally` on every path (failure paths test-asserted), never logged, never returned, never persisted
- [ ] **MUST FIX** — only the trait-extraction prompt sees the image; candidate/judge prompts text-only (no URL/hash/crop/embedding)
- [ ] **MUST FIX** — upload chain order intact and fail-closed (consent → single file → size → MIME → ext → consistency → magic bytes → decode → ClamAV prod-fail-closed)
- [ ] **MUST FIX** — AI responses zod-validated + safety-filtered; `safetyCheck` flags enforced; no sensitive inference; disclaimer server-enforced
- [ ] **MUST FIX** — no payment logic; no face-recognition/biometric/identity capability; `GEMINI_MODEL` from config, never hardcoded

## 5. Config, logging, libraries → [25](./25-configuration-and-environment.md), [22](./22-observability-logging.md), [10](./10-library-modularization.md)

- [ ] **MUST FIX** — no `process.env` outside `config/`/`bootstrap/`; new env vars in the zod schema + `.env.example`
- [ ] **MUST FIX** — `AppLogger` only; no `console.*`; nothing image-shaped or secret-shaped in any log line
- [ ] **MUST FIX** — vendor ownership respected: new/moved packages match the table in [10](./10-library-modularization.md) and `eslint/package-boundaries.config.mjs`; no raw fetch/axios/storage in business code
- [ ] **SHOULD FIX** — milestones logged with request-id correlation; 4xx warn / 5xx error; fail-safe side effects own their `try/catch`; timeouts + terminal states present ([08](./08-reliability-durability.md))

## 6. Tests & coverage → [09](./09-testing-coverage.md), [/testing/coverage-policy.md](../testing/coverage-policy.md)

- [ ] **MUST FIX** — tests written/adjusted **first**; behaviors from [TEST_CASES.md](../TEST_CASES.md) covered; bug fixes ship a reproducing regression test
- [ ] **MUST FIX** — coverage on the gated scope ≥ 95/90/95/95; risk centers (pipeline, file-security, AI safety) near 100%; no `.only`/skips
- [ ] **MUST FIX** — Vitest only (never Jest); `*.test.ts`/`*.integration.test.ts` naming; providers always mocked
- [ ] **SHOULD FIX** — behavior asserted, not implementation; deterministic (time/randomness controlled)

## 7. Docs & change completeness

- [ ] **MUST FIX** — behavior changes reflected in docs/rules in the same change; `.env.example` current
- [ ] **SHOULD FIX** — decision changes recorded in [/memory](../memory/README.md); new pitfalls added to [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
- [ ] **MUST FIX** — diff reviewed for unrelated/destructive changes; no rule weakened; explicit paths staged (never `git add .`); no `.env*`/secrets/`dist/`/`coverage/` staged; Conventional Commits; commit/push only when asked

---

## Merge blockers (any one stops the merge)

`any`/suppression/`!` in production code · gate red or hook bypassed · logic in a controller · layer/boundary violation · inline domain declaration · class-validator usage · user-facing error without `AppError`+`messageKey` · `process.env` or `console.*` outside their homes · vendor SDK outside its owner · **any image-persistence, image-logging, prompt-isolation, payment, or biometric violation** · behavior change without tests or with stale docs · coverage below the floor.
