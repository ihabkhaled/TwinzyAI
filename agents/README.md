# Agent Roles — Index

> The roster of review roles for the Twinzy backend (`apps/api`), the shared workflow every role runs, the universal guardrails none may relax, and the exact quality-gate commands. Each role is a focused operating manual that implements the canon — it does not replace it.

These roles are **lenses on the specification**, not a substitute for it. The canonical sources, in precedence order:

1. [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) — the hard rules. **Overrides everything else.**
2. [/AGENTS.md](../AGENTS.md) — the canonical agent entry point (project purpose, stack, workflow).
3. [/CLAUDE.md](../CLAUDE.md) — the compact mirror of the operating policy.
4. [/context/architecture-map.md](../context/architecture-map.md) — the layered architecture, the single source of truth for where code lives.
5. [/context/stack-and-toolchain.md](../context/stack-and-toolchain.md) — the locked runtime, lint, test, and build toolchain.
6. [/rules/README.md](../rules/README.md) — the full numbered rules pack (00–27).

> If a role file ever contradicts the rules pack or the architecture map, the canon wins. Fix the role file.

---

## Role index

| Role | One-line mission | Reach for it when |
| --- | --- | --- |
| [backend-architect](./backend-architect.md) | Design modules/boundaries; enforce one-way layering + import rules | Adding a module, splitting a god-file, deciding where code lives |
| [backend-code-reviewer](./backend-code-reviewer.md) | Run the full review checklist + every quality gate | Final gate before a change is declared done |
| [backend-security-reviewer](./backend-security-reviewer.md) | Upload-chain, AI-safety, privacy, leakage, and rate-limit review | Any change touching uploads, prompts, errors, config, or routes |
| [backend-performance-reviewer](./backend-performance-reviewer.md) | Timeout/concurrency/memory/payload audit for the stateless pipeline | Hot paths, external calls, loops with awaits, large buffers |
| [backend-test-engineer](./backend-test-engineer.md) | Write/extend Vitest unit + integration tests to the coverage bar | Any behavior change, new module, or coverage gap |
| [backend-refactor-agent](./backend-refactor-agent.md) | Characterization-tests-first safe refactors; behavior unchanged | Restructuring code that must keep identical behavior |
| [backend-release-gatekeeper](./backend-release-gatekeeper.md) | Final diff + quality-gate + Trivy + Docker-smoke + git-safety blocker | Before staging, committing, or pushing |
| [database-reviewer](./database-reviewer.md) | Guard the **no-persistence** boundary; block any user-data storage | Any new dependency, disk write, cache, or repository folder |
| [observability-reviewer](./observability-reviewer.md) | Logging/redaction/diagnosis review with zero sensitive leakage | Changes touching logs, adapters, error paths, the pipeline |
| [reliability-engineer](./reliability-engineer.md) | Timeouts/fail-closed/cleanup/shutdown/terminal-state safety | External calls, upload handling, startup/shutdown, error flows |

Every role keeps the same shape: **role · mission · inputs · steps · checklist · verdict**.

---

## Shared agent workflow (every role runs this spine)

Each role specializes the same backbone. Run it in order; do not skip steps.

1. **Read the canon.** [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) → [/context/architecture-map.md](../context/architecture-map.md) → [/rules/README.md](../rules/README.md) → the layer rule and [skill](../skills/README.md) for the task.
2. **Inspect the real architecture.** Open the actual files you will touch under `apps/api/src/`. Never invent paths, contracts, endpoints, fields, or event names — confirm them in the repo. Use [/context/codebase-navigation.md](../context/codebase-navigation.md) and [/context/code-map.md](../context/code-map.md).
3. **Check memory.** [/memory/](../memory/README.md) holds settled decisions (privacy, AI safety, security, no-database). Do not re-litigate them silently.
4. **Write/adjust tests FIRST.** Add or extend the Vitest spec(s) that pin the behavior you are about to add, fix, or refactor — see [backend-test-engineer](./backend-test-engineer.md) and [/testing/testing-strategy.md](../testing/testing-strategy.md).
5. **Make the minimal safe change.** Smallest diff that satisfies the tests and the rules. Respect one-way layering; no drive-by rewrites of unrelated code.
6. **Run every quality gate** (below). All green, no warnings.
7. **Update docs.** If behavior, routes, contracts, config, or integrations changed, update the affected docs, memory, and any role/rules file in the same change ([/rules/23-review-checklist.md](../rules/23-review-checklist.md)).
8. **Record durable lessons.** A new recurring mistake goes into [/memory/known-pitfalls.md](../memory/known-pitfalls.md); a new convention goes into the relevant [memory](../memory/README.md) file.
9. **Release safely.** Run [backend-release-gatekeeper](./backend-release-gatekeeper.md). Stage explicitly (never `git add .`), never stage secrets or generated output, never bypass hooks — and never commit or push unless explicitly asked.

### Quality gates (toolchain is fixed — never substitute)

Run from the repo root. The exact `package.json` scripts:

```bash
npm run lint            # eslint . — 0 errors AND 0 warnings (incl. the architecture plugin)
npm run typecheck       # tsc --noEmit per workspace (shared builds first)
npm run test:unit       # Vitest projects: api-unit, web-unit, shared-unit, lint-rules
npm run test:coverage   # vitest run --coverage — 95% stmts / 90% branches / 95% funcs / 95% lines
npm run build           # shared → api → web, compiles clean
npm run security:scan   # Trivy fs scan — vuln + secret + misconfig; HIGH/CRITICAL fail the gate
```

Run `npm run test:integration` (the `api-integration` Vitest project, `*.integration.test.ts`) whenever routes, the analyze pipeline, upload security, or module wiring changed. `npm run test:e2e` (Playwright, `apps/web`) belongs to the release gate.

Husky enforces a subset automatically:

| Hook | Runs | Purpose |
| --- | --- | --- |
| `pre-commit` | `lint-staged` + `typecheck` | Block unlintable / untyped staged code |
| `pre-push` | `test:coverage` + `build` | Block pushes that fail tests or won't build |

Never bypass hooks (`--no-verify`) and never weaken a gate to make it pass. A green build is **not** proof of correctness — prove behavior with tests.

### Locked toolchain facts (these win over any stale note)

- Type-checking is per-workspace `tsc --noEmit` (`npm run typecheck` builds `packages/shared` first); builds go through `nest build` for the API.
- Test runner is **Vitest** (projects: `api-unit`, `api-integration`, `shared-unit`, `web-unit`, `lint-rules`) with `@nestjs/testing` + supertest for integration; coverage provider is **v8**. Test files are `*.test.ts` (unit) and `*.integration.test.ts` (integration).
- Validation is **Zod everywhere** — request DTOs, AI responses, env config ([/rules/21-dto-validation.md](../rules/21-dto-validation.md)). **Never class-validator, never the TypeScript `enum` keyword** (as-const objects + derived types, [/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)).
- **There is no database by design** — the product is stateless for privacy ([/rules/20-repositories-database.md](../rules/20-repositories-database.md), [/memory/database-decisions.md](../memory/database-decisions.md)).
- HTTP platform is **Fastify**; logging is **nestjs-pino behind the `AppLogger` wrapper** (`apps/api/src/core/logger`); rate limiting is **@nestjs/throttler** in `apps/api/src/core/rate-limit`.
- Every vendor library is wrapped — Gemini behind `GeminiAdapter`, ClamAV behind `ClamAvAdapter` ([/rules/10-library-modularization.md](../rules/10-library-modularization.md)).

---

## Universal guardrails (apply to every role)

No role may relax these. Full text in [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md); the load-bearing summary:

- **Strict types.** No `any`, no `eslint-disable`, no `@ts-ignore`, no `@ts-expect-error` (unless documented in [docs/package-decisions.md](../docs/package-decisions.md)), no `!` non-null assertion.
- **No TypeScript `enum`; no magic values.** Domain values are `as const` objects + derived types + `*_VALUES` arrays in dedicated enum/constant files; compare against those members, never raw literals.
- **No inline declarations** (types, interfaces, constants, DTOs, Zod schemas, request/response shapes, config maps) inside controllers, use-cases, services, repositories, guards, interceptors, pipes, or adapters. Extract to `model/`, `api/dto/`, `lib/`, or `packages/shared`.
- **One-way layering.** Controller (thin, exactly one use-case delegation per handler) → Application (use-case orchestrates the workflow; service owns one focused capability) → Domain (pure) → Infrastructure/Adapters (leaves). Use-cases call services; services never call use-cases ([/rules/16-backend-architecture.md](../rules/16-backend-architecture.md), [/rules/17-manager-layer.md](../rules/17-manager-layer.md), [/rules/19-services-application-layer.md](../rules/19-services-application-layer.md)).
- **Restricted imports** (enforced by the architecture ESLint plugin): controllers can't import adapters/SDKs/repositories; vendor SDKs only inside `adapters/`; `process.env` only in `apps/api/src/config` ([/rules/25-configuration-and-environment.md](../rules/25-configuration-and-environment.md)); cross-module use goes through the module `index.ts`, never deep imports.
- **Typed errors.** Every user-facing error throws an `AppError` subclass (Validation 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, PayloadTooLarge 413, Integration 502) with a `messageKey` of form `errors.<feature>.<key>`; the global exception filter maps it to a sanitized envelope. Never leak stacks, secrets, provider errors, or internals ([/rules/26-error-handling-and-exceptions.md](../rules/26-error-handling-and-exceptions.md)).
- **Config & logging.** Typed, Zod-validated config via `AppConfigService`; never `process.env` outside the config module. Log only via `AppLogger`; never `console.*`; redact everything sensitive ([/rules/22-observability-logging.md](../rules/22-observability-logging.md)).
- **Validation at the boundary.** Every external input — HTTP body, uploaded file, AI response, env — passes a Zod schema before use ([/rules/21-dto-validation.md](../rules/21-dto-validation.md)).
- **Privacy & AI safety are absolute.** No face recognition, no identity matching, no biometrics, no image persistence or logging; only the trait-extraction prompt sees the image; candidate/judge prompts are text-only; `GEMINI_MODEL` comes from `.env`; AI output is Zod-validated and safety-filtered ([/rules/14-ai-safety.md](../rules/14-ai-safety.md), [/rules/15-file-upload-security.md](../rules/15-file-upload-security.md)).
- **The game is free.** Never add payment logic (rule 43).
- **Fail-safe side effects + terminal states.** Security checks fail closed; cleanup runs in `finally`; every request reaches a friendly terminal answer — no hung requests ([/rules/08-reliability-durability.md](../rules/08-reliability-durability.md), [/rules/27-async-events-and-jobs.md](../rules/27-async-events-and-jobs.md)).
- **No behavior change without tests AND docs** in the same change — written test-first (rule 41).

---

## Role checklist (before any role reports "done")

- [ ] Canon read: non-negotiable rules → architecture map → relevant layer rule + skill
- [ ] Real files inspected under `apps/api/src/`; no invented paths, contracts, or names
- [ ] Tests written/adjusted first; coverage gate met (95/90/95/95; risk centers near 100%)
- [ ] One-way layering and restricted imports respected
- [ ] All universal guardrails hold in the diff
- [ ] `npm run lint` / `typecheck` / `test:unit` / `test:coverage` / `build` all green (`security:scan` for the release gate)
- [ ] Docs, memory, and any affected role/rules file updated in the same change
- [ ] Released via the gatekeeper: explicit staging, no secrets/generated output, hooks not bypassed
- [ ] A clear **PASS / FAIL** verdict with specific, file-anchored findings

**Related:** [/rules/23-review-checklist.md](../rules/23-review-checklist.md) · [/skills/final-validation.md](../skills/final-validation.md) · [/testing/quality-gates.md](../testing/quality-gates.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md) · [/context/architecture-map.md](../context/architecture-map.md)
