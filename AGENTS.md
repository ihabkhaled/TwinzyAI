# AGENTS.md — Agent Bootstrap

**Root [`CLAUDE.md`](CLAUDE.md) is the canonical operating policy for this repository** — the
enterprise SDLC governance brain plus the concrete engineering operating system. Read it fully
before doing any work: analysis, planning, implementation, review, testing, documentation, or
release. This file only bootstraps you into it; it never overrides it.

Precedence when files differ: `CLAUDE.md` > `.cursor/rules/*.mdc` > `AGENTS.md` > `CODEX.md` /
`cursor.md` > `.cursorrules` (legacy shim). When two rules overlap, the **stricter** one applies.

## Simple Code Ladder (permanent policy — rules/28–30)

Before writing code: need it → reuse existing owner → native/platform → existing wrapper/dependency → small helper → direct readable code → new abstraction only when justified. Be lazy about code volume, never about reading, validation, security, privacy, AI safety, file upload safety, tests, docs, observability, accessibility, i18n, or architecture. No inline reusable declarations in layer files; reuse before creating; no clever code. Never bypass hooks or gates. See [rules/28-simple-readable-code.md](rules/28-simple-readable-code.md) and [context/declaration-ownership-map.md](context/declaration-ownership-map.md).


## Mandatory first actions (fast-task protocol)

Before changing anything:

1. Read [`.ai/BOOTSTRAP.md`](.ai/BOOTSTRAP.md) — the compiled ~1,500-token bootstrap carrying
   every universal invariant, the authority order, and the open critical items.
2. Resolve your task: `npm run knowledge:context -- --task="<exact request>"` (add
   `--files=...` or `--diff=origin/main...HEAD` when known), then read
   `.ai/local/current-context.md` — it names the delivery lane, context pack, exact docs,
   source, tests, reviewers, and validation commands.
3. Read the exact code **and the tests** the resolver names, before editing them (in parallel).
4. Read the request artifacts under `docs/features/<feature-slug>/` if they exist for your task.
5. Load canonical detail (`CLAUDE.md` sections, `rules/`, `docs/sdlc/`,
   `memory/known-pitfalls.md`) as the pack directs — routed, not wholesale.

No one may modify code they have not read. Everything under `.ai/` is generated
(`npm run knowledge:build`) — never edit it by hand; fix the authored source in `knowledge/`
or the canonical folders instead.

## Canonical operating rules

- Never skip an SDLC phase; never jump straight to implementation.
- Every request writes or updates its artifacts under `docs/features/<feature-slug>/`.
- No implementation before phases `00`–`13` are documented. Depth scales with request size;
  phase existence and gates never disappear.
- Tests and documentation ship in the same delivery stream as the behavior they cover
  (tests first for new behavior).
- Coverage is measured on **touched modules, per file** — not on repository-wide averages.
- When a permanent rule, gate, standard, or constraint appears, update `CLAUDE.md` first, then
  keep every mirror (this file, `CODEX.md`, `cursor.md`, `.cursor/rules/`, `.cursorrules`)
  aligned in the same delivery stream.

## Project purpose

Twinzy is a **free**, mobile-first, privacy-safe AI game. A user uploads one photo; the backend
extracts the shared 221-field visible, non-identifying trait taxonomy (targeting 100+ populated
written traits when quality allows), then uses those **written traits only** to suggest playful
public style/vibe matches. Entertainment only.

The app is NEVER: face recognition, identity matching, biometric comparison, exact lookalike
matching, or serious facial similarity analysis.

The app NEVER stores: uploaded images, face embeddings, biometric templates, or raw image bytes.

The game is free BY DEFAULT, and monetization exists only inside the recorded owner-gated
programs (docs/features/paypal-donations-and-paid-results/): the voluntary outbound PayPal.me
donation LINK (2026-07-10; env-driven, validated, hidden when unset, never gates anything) and
the env-gated PayPal Orders v2 paywall (2026-07-12 supersession in `22-go-no-go.md` —
capture-at-consumption, server-authoritative price, no persistence; blank
`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` = fully free, a default that may never be inverted;
**LIVE mode is not approved** until the four recorded conditions pass). No subscriptions, no
accounts, no other monetization, and no paywall scope change outside that program's gates.

## Stack

- Frontend: Next.js (App Router) + React + Tailwind CSS + TanStack Query + React Hook Form + Zod
- Backend: NestJS 11 on Fastify + Zod validation (class-validator is forbidden) + Google Gemini
  via its adapter only
- Shared: `packages/shared` (cross-side constants/enums/schemas/types/utils)
- Tooling: TypeScript strict, ESLint flat config + custom architecture plugin (`eslint/`),
  Prettier, Husky + lint-staged + commitlint, Vitest, Playwright, Docker + Docker Compose,
  npm workspaces

## Quality gates

```bash
npm run lint           # 0 errors / 0 warnings
npm run typecheck
npm run test:unit
npm run test:coverage  # touched modules per file: 95 statements / 90 branches / 95 functions / 95 lines
npm run build
npm run security:scan
```

All must pass. Never weaken a rule, skip a test, or loosen tsconfig/eslint to get green.

## Architecture map

Backend anatomy (`apps/api/src` — one-way layered dependencies, mechanically enforced):

```
modules/<feature>/
  api/             controllers + dto — thin, exactly one delegation per handler
  application/     *.use-case.ts (orchestration) + *.service.ts (focused capabilities)
  domain/          pure policies, entities, state machines
  infrastructure/  *.repository.ts — persistence only, parameterized, bounded
  adapters/        *.adapter.ts — every external SDK wrapped (Gemini only via its adapter)
  model/           feature-owned types/constants
  lib/             named helpers (mappers, builders, formatters)
src/core/          AppLogger (pino), AppError + exception filter (messageKey errors.<feature>.<key>),
                   zod validation pipe, rate-limit (throttler), openapi, http types
src/config/        typed, zod-validated, fail-fast — the only place that reads process.env
src/bootstrap/     Fastify app assembly
```

Frontend OS (`apps/web`): `Component → Hook → Service → Gateway` on the
`app → modules/<feature> → shared → packages/<vendor>` anatomy. TSX is pure composition;
state/effects/handlers live in hooks; logic lives in module helpers/mappers; HTTP only through
the gateway/`packages/axios` wrapper; every user-facing string through `packages/i18n`.
Standing rules (mechanically enforced): no inline interface/type/reusable-const in any layer
file — definitions live in `types/`/`enums/`/`constants/`/`model/` (backend
`architecture/no-inline-domain-definitions` incl. module-level value consts; frontend
`frontend-architecture/no-inline-declarations`); and components stay small —
`*.component.tsx`/`*.container.tsx` capped at 130 lines / 60 per function / jsx-max-depth
(`eslint/frontend/component-size.config.mjs`) — split before the cap hits.

Knowledge folders:

```
.ai/                   GENERATED acceleration plane: BOOTSTRAP, HOT_MEMORY, QUICK_ROUTER,
                       manifests/indexes/packs/graphs (rebuild: npm run knowledge:build)
knowledge/             authored knowledge-OS definitions: routing map, delivery lanes, risk
                       classification, budgets, packs, bootstrap/hot-memory sources, golden sets
structure/ product/ domain/ contracts/   canonical area docs (modules, product truth, domain
                       invariants, API/AI/integration contracts)
operations/ incidents/ quality/          ops model, incident process, quality standards
rules/                 engineering rule bodies (start: rules/00-non-negotiable-rules.md)
skills/                step-by-step task playbooks (start: skills/resolve-task-context.md)
context/               architecture map, stack/toolchain, task router, reference patterns
memory/                durable decisions + memory/known-pitfalls.md
agents/                specialist review roles (architecture, security, tests, release, ...)
testing/               test strategy, layers, coverage policy, fixtures, gates
eslint/                split flat config + custom architecture/boundary plugin
docs/sdlc/             permanent company baselines
docs/features/<slug>/  request-specific phase artifacts (00-intake ... 27-retrospective)
test-cases/            reusable detailed test cases
runbooks/              operational procedures
architecture/adrs/     architecture decision records
release-notes/         release communication
support/               support-facing guidance
```

## AI-safety rules

- Only the trait-extraction prompt (`use-1st-prompt.md`) may receive the image.
- Candidate and judge prompts receive **text only** (traits JSON / candidates JSON).
- No face embeddings, no biometric templates, no identity claims, no "you look exactly like X".
- Gemini model name comes from `.env` (`GEMINI_MODEL`); never hardcode it.
- Every Gemini response is Zod-validated and safety-filtered before use.
- Reject/sanitize outputs containing forbidden wording (see `packages/shared/src/constants/safety.constants.ts`).

## File-upload rules

- Backend is the source of truth: consent flag required; one file only; size, MIME, extension,
  extension/MIME consistency, magic bytes, decode check; optional ClamAV (fail closed in prod).
- Image lives in memory only; buffer wiped in `finally`; never logged; never persisted; never returned.

## Release checklist

See the release gate in `rules/`, the baselines in `docs/sdlc/`, and the templates under
`runbooks/` and `release-notes/`. Short form: all quality gates green, Docker up/down clean,
no forbidden wording in UI, no secrets in frontend bundle, docs updated, rollback defined.

## Git etiquette

- Conventional commits, enforced through the Husky hooks (pre-commit lint-staged, commit-msg
  commitlint, pre-push validation) — one commit per reviewable slice.
- Never bypass hooks with `--no-verify`.
- Do not commit or push unless explicitly asked.
