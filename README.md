# Twinzy

A **free**, mobile-first, privacy-safe AI game. Upload a photo, get playful public style/vibe
matches based on **written visible traits only** — no face recognition, no identity matching,
no biometric comparison, and your photo is never stored.

## How it works

1. The frontend uploads one image + a consent flag to `POST /api/v1/game/analyze`.
2. The backend validates the file (size, MIME, extension, magic bytes, decode, optional ClamAV).
3. Gemini extracts **15 visible, non-identifying traits** from the image (`use-1st-prompt`).
4. The image buffer is destroyed immediately after.
5. Gemini receives the **written traits only** and suggests 1–5 playful candidates (`use-2nd-prompt`).
6. A judge pass re-scores and filters (`use-3rd-prompt`) — max 4 safe final results.
7. The frontend shows traits, results, and a permanent disclaimer.

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
