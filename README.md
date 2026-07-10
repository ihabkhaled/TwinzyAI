# Twinzy

A **free**, mobile-first, privacy-safe AI game. Upload a photo, get playful public style/vibe
matches based on **written visible traits only** — no face recognition, no identity matching,
no biometric comparison, and your photo is never stored. Fully localized in English and Arabic.

## How it works

1. The frontend uploads one image + a consent flag + the selected language (`en`/`ar`) to
   `POST /api/v1/game/analyze`.
2. The backend validates the file (size, MIME, extension, magic bytes, decode, optional ClamAV).
3. Gemini extracts **advanced grouped visible, non-identifying traits** from the image — 221 named
   fields across 16 categories, targeting **100+ traits** when image quality allows
   (`use-1st-prompt`).
4. The image buffer is destroyed immediately after.
5. Gemini receives the **written traits only** and suggests a candidate pool larger than the requested count from a **global public-figure pool** (`use-2nd-prompt`).
6. A judge pass re-scores and filters (`use-3rd-prompt`) — up to the user-selected number of safe final results (1–10, default 10).
7. The frontend shows traits, results, and a permanent disclaimer — all dynamic output is
   localized (en/ar).
8. Switching language calls `POST /api/v1/game/translate-result`, which translates the existing
   result only — the image is never re-uploaded or re-analyzed.

## Share your result (temporary links)

Sharing is optional and works without a database. The result screen's **Share** button
mints a **temporary public link** (`POST /api/v1/share-results`) that carries only the
already-safety-filtered result JSON — never the uploaded photo. It returns a UUID URL plus
timing; opening `/share/<uuid>` shows the result with a live per-second countdown and
auto-expires (default 10 minutes, configurable). The share sheet offers the native Web
Share API, platform buttons (WhatsApp / Telegram / X / Facebook / LinkedIn / Reddit /
Email), and copy-link. Still free, still no database, still no image shared — the link
lives only in the API's in-memory cache, so it is unreachable the instant it expires (and
an API restart may drop it earlier).

## Quick start

```bash
cp .env.example .env       # fill GEMINI_API_KEY and GEMINI_MODEL
npm install
npm run dev                # web on :3000, api on :4000
```

## Docker

```bash
npm run docker:up
npm run docker:down
```

## Quality gates

Every change must keep all gates green before it counts as done:

```bash
npm run lint           # 0 errors / 0 warnings
npm run typecheck
npm run test:unit
npm run test:coverage  # touched modules per file: 95 stmts / 90 branches / 95 funcs / 95 lines
npm run build
npm run security:scan
```

Husky enforces pre-commit (lint-staged), commit-msg (commitlint, conventional commits), and
pre-push validation. Never bypass hooks with `--no-verify`.

## Simple readable code

The best TwinzyAI code is the code the next developer understands immediately. Before writing:
need it → reuse the existing owner → platform/native → existing wrapper → small helper → direct
readable code → new abstraction only when justified. See
[`rules/28-simple-readable-code.md`](rules/28-simple-readable-code.md) and
[`context/declaration-ownership-map.md`](context/declaration-ownership-map.md). Minimum code always
means minimum **safe** code—never less validation, privacy, AI safety, upload safety, a11y, i18n,
tests, or documentation.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Run web + api in watch mode |
| `npm run lint` / `lint:fix` | ESLint (strict + custom architecture rules) |
| `npm run typecheck` | Strict TypeScript across all workspaces |
| `npm run test` / `test:unit` / `test:integration` / `test:e2e` | Vitest / Playwright suites |
| `npm run test:coverage` | Coverage report |
| `npm run build` | Build shared → api → web |
| `npm run security:scan` | Trivy vulnerability/secret/misconfig scan |
| `npm run security:scan:secrets` | Custom plaintext-secret scanner (complements Trivy) |
| `npm run validate` | lint + typecheck + coverage + build |

## Repository map

```
apps/web          Next.js App Router frontend (PWA, mobile-first)
apps/api          NestJS (Fastify) backend — game pipeline, Gemini adapter, file security
packages/shared   Shared constants/types/enums/interfaces/schemas/utils
eslint/           Split flat config + custom architecture ESLint plugin
```

Knowledge base:

```
CLAUDE.md              Canonical operating policy — SDLC governance + engineering OS (read first)
AGENTS.md              Agent bootstrap (mirrors: CODEX.md, cursor.md, .cursor/rules/, .cursorrules)
rules/                 Engineering rule bodies (start: rules/00-non-negotiable-rules.md)
skills/                Step-by-step task playbooks
context/               Architecture map, stack/toolchain, task router, reference patterns
memory/                Durable decisions + known pitfalls
agents/                Specialist review roles
testing/               Test strategy, coverage policy, fixtures, gates
docs/sdlc/             Permanent company baselines
docs/features/<slug>/  Request-specific SDLC phase artifacts
test-cases/            Reusable detailed test cases
runbooks/              Operational procedures
architecture/adrs/     Architecture decision records
release-notes/         Release communication
support/               Support-facing guidance
```

## Documentation

Canonical policy: [CLAUDE.md](CLAUDE.md). Agent entry: [AGENTS.md](AGENTS.md).
Architecture: [docs/architecture.md](docs/architecture.md). Env vars:
[docs/env-vars.md](docs/env-vars.md). Security: [SECURITY.md](SECURITY.md).
Test matrix: [TEST_CASES.md](TEST_CASES.md).
