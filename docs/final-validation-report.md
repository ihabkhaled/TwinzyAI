# Final Validation Report

Date: 2026-07-06 · Build: main @ d7efd51 · Operator: AI-assisted delivery (Claude)

## Scope validated

Full product: Twinzy monorepo — Next.js 16 web (App Router, PWA), NestJS 11 api on Fastify,
packages/shared contracts, engineering-OS knowledge layers, Docker delivery.

## Command results (all executed on this build)

| Gate | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | PASS — 0 errors, 0 warnings |
| Typecheck | `npm run typecheck` (tsgo for api) | PASS — 0 errors |
| Unit + integration | `npx vitest run` | PASS — 254/254 tests, 30 files |
| Coverage | `npm run test:coverage` | PASS — 99.05% stmts / 97.14% branches / 100% funcs / 99.03% lines (thresholds 95/90/95/95) |
| E2E | `npm run test:e2e` | PASS — 11/11 (happy path, invalid upload, API failure+retry, 320px, 375px, dark/light, PWA smoke, axe a11y ×2) |
| Build | `npm run build` | PASS — shared (tsc), api (nest/tsc → dist/main.js), web (5 static routes) |
| Security scan | `npm run security:scan` (Trivy fs, HIGH/CRITICAL, incl. dev deps) | PASS — clean (multer CVE-2026-5079 remediated via override ≥2.2.0) |
| Docker | `docker compose up -d --build` → health → smoke → `down` | PASS — both containers healthy; api health 200; analyze consent-rejection envelope correct; web / and /game 200; clean teardown |

Boot smoke on the compiled api additionally verified: helmet header set (CSP, HSTS, nosniff,
frame options), pino request logging with request-id correlation and 4xx→WARN mapping, rate-limit
headers (30/min global, 10/min analyze).

## Environment notes

- Windows Application Control (WDAC) blocks Next's native SWC binary locally → local web
  dev/build uses `--webpack`; Docker (Linux) builds use Turbopack (verified in the shipped image).
- Host port 3000 is occupied by an unrelated local project; Docker validation ran the web
  container on `WEB_PORT=3200`. Production mapping is unchanged (`WEB_PORT` env controls it).
- tsgo (@typescript/native-preview) works on this machine and is the api typecheck engine.

## Incidents found & fixed during validation

1. Docker api image shipped without compiled output — stale local `dist/` + `.tsbuildinfo`
   copied into the build context made incremental tsc skip emit. Fix: `.dockerignore` now
   excludes nested `**/dist`, `**/.next`, `**/*.tsbuildinfo`.
2. Same failure mode locally: `nest start --watch` crashed with `Cannot find module dist\main`
   after `deleteOutDir` while a stale root-level tsbuildinfo claimed outputs were current.
   Fix: `tsBuildInfoFile` pinned inside `dist/` (d7efd51).
3. Swagger UI on the Fastify adapter requires `@fastify/static` at runtime — added.
4. Transitive `multer 2.1.1` (HIGH, CVE-2026-5079) under @nestjs/platform-express — forced to
   ≥2.2.0 via npm override; Trivy clean since.

## Product-constraint confirmations

- The game is free — no payment logic exists anywhere.
- No face recognition / identity matching / biometrics — enforced by prompts, Zod schemas,
  forbidden-wording filters, and UI tests; scores are style/vibe fit only; disclaimer enforced
  server-side.
- Images are never stored: multer memory storage only, buffer zero-filled in `finally`
  (tested on success and failure paths), never logged, never returned, no upload volumes.
- Only the trait-extraction prompt receives the image; candidate and judge prompts are
  text-only (type-level guarantee on the provider port + tests).
- Prompts are file-loaded with placeholder validation; `GEMINI_MODEL` and `GEMINI_API_KEY`
  come exclusively from env; no secrets in the web bundle or Docker images.

## Known gaps / follow-ups

- Local Turbopack unavailable until the WDAC policy allowlists Next's native binary.
- Strict CSP on the web app (beyond framework defaults) deferred until the asset inventory
  is stable (api CSP is live via helmet).
- HEIC uploads are rejected by design (no safe pure-JS decoder) — documented.
- E2E runs against a mocked backend by default; real-Gemini runs are manual
  (docs/docker-local-dev.md).
- Trivy 0.72 available (0.71 installed) — routine tool bump.
