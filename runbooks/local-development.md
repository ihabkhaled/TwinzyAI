---
id: runbook-local-development
title: Runbook — Local Development
type: runbook
authority: canonical
status: current
owner: repository owner
summary: Getting the monorepo running locally with npm, including the build:shared trap, the gate commands, and verification.
keywords: [runbook, local, development, npm, dev, build-shared, workspaces, gates, node]
contextTier: 2
relatedCode: [package.json, apps/api/src/main.ts, apps/web/next.config.ts]
relatedTests: []
relatedDocs: [runbooks/environment-bootstrap.md, runbooks/docker.md, docs/docker-local-dev.md]
readWhen: Setting up a dev machine or when local dev behaves strangely (stale shared package, ports, env).
---

# Runbook — Local Development

## Prerequisites

- Node `>=22.20 <23` (`package.json` `engines`); npm workspaces monorepo (`packages/tsconfig`, `packages/eslint-config`, `packages/shared`, `apps/api`, `apps/web`).
- A `.env` created from `.env.example` — see [environment-bootstrap.md](./environment-bootstrap.md). Real analyze runs need `GEMINI_API_KEY` + `GEMINI_MODEL`.
- `npm ci` at the repo root (also installs Husky hooks via the `prepare` script).

## Steps

1. `npm run dev` — this first runs `build:shared`, then starts both apps concurrently (`package.json`): API on `http://localhost:4000`, web on `http://localhost:3000`.
2. Individual apps: `npm run dev:api` / `npm run dev:web`.

### The `build:shared` trap

`packages/shared` is consumed by both apps as a **built** package. Root scripts (`dev`, `build`, `lint`, `typecheck`, `test*`) all run `npm run build:shared` first (`package.json`), but if you invoke a workspace tool directly (e.g. `vitest` watch, `npm run dev:api` after editing `packages/shared`), you run against **stale shared output**. Symptom: changes to shared constants/schemas "don't take effect", or type errors that don't match the source. Fix: `npm run build:shared` and restart the affected process.

## Verify

```bash
curl -i http://localhost:4000/api/v1/health   # 200 {status:'ok', service:'twinzy-api', ...}
```

Open `http://localhost:3000` and run the upload → consent → result flow once. Quality gates before committing (all must be green — CI runs the same commands, `.github/workflows/gate-*.yml`):

```bash
npm run lint && npm run typecheck && npm run test:unit
npm run test:coverage && npm run build
```

`npm run validate` runs the full local gate chain in one command.

## Rollback

Local-only; discard with normal git operations (`git checkout -- <file>` / `git stash`). Never bypass Husky hooks (`--no-verify` is forbidden — CLAUDE.md non-negotiable gates).

## Notes

- Swagger UI at `http://localhost:4000/docs` (on by default outside production, `ENABLE_SWAGGER`).
- Dev-in-Docker alternative: `docker compose -f docker-compose.dev.yml up` (single container running `npm run dev` with a source volume — `docker-compose.dev.yml`). See [docker.md](./docker.md).
- Integration tests never need real keys: the AI adapter is faked (`apps/api/src/bootstrap/create-test-app.ts`, `apps/api/src/tests/fixtures/fake-ai-adapter.ts`); Playwright e2e mocks the backend entirely (`apps/web/playwright.config.ts`).
