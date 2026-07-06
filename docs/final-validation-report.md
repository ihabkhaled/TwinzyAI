# Final Validation Report

Date: 2026-07-06 · Build: main @ d7efd51 · Operator: AI-assisted delivery (Claude)

> **Addendum 2026-07-07 (build @ 81b48ba)** — see "Streaming, camera & resilience" at the bottom.

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

---

## Addendum — Streaming, camera & resilience (2026-07-07, build @ 81b48ba)

### What changed
- **No-timeout streaming analyze.** New `POST /api/v1/game/analyze/stream` returns
  `text/event-stream` and emits `accepted` → `stage` (validating → extracting-traits →
  generating-candidates → judging → aggregating) → `result` / `error`, plus keep-alive
  heartbeats. The Gemini adapter now uses `generateContentStream` with an **idle
  (inter-chunk) timeout** (`GEMINI_STREAM_IDLE_TIMEOUT_MS`) instead of a fixed total
  deadline, so a long generation is never cut off while the model is still producing.
  The frontend consumes the stream with a `fetch` + `ReadableStream` reader (no client
  timeout) and shows live per-stage progress. Same safety guarantees preserved (image
  only in trait extraction, buffer wiped in `finally`, text-only after; error events use
  the identical safe envelope as JSON errors).
- **Gemini rate-limit + model fallback.** A pure classifier maps provider errors to
  rate-limited / unavailable / fatal. Each call is retried down the model chain
  (`GEMINI_MODEL` + `GEMINI_FALLBACK_MODELS`) on 429/overload/model-not-found; when every
  model is rate-limited the request fails with a new `429 AI_RATE_LIMITED` the UI invites
  a retry on. Non-retryable errors stop immediately.
- **Camera capture.** A "Take a photo" control (`<input capture="environment">`) sits
  beside upload, feeding the same validation/preview/analyze flow (native camera on mobile).
- **UI spacing.** Results actions and the game page gained bottom padding / breathing room
  so buttons no longer stick to the viewport bottom.
- **ClamAV hosts to env.** The hardcoded fallback host list became the `CLAMAV_HOSTS`
  env array (`.env`, `.env.example`, `docker-compose.yml`).

### Validation (all on build @ 81b48ba)
| Gate | Result |
| --- | --- |
| `npm run lint` | PASS — 0 errors, 0 warnings |
| `npm run typecheck` (tsgo for api) | PASS — 0 errors |
| Unit + integration | PASS — **290/290** tests (37 files; +36 new) |
| Coverage | PASS — 98.94% stmts / 96.98% branches / 100% funcs / 98.92% lines |
| Build (shared → api → web) | PASS |
| E2E (Playwright, SSE mocks) | PASS — 11/11 |
| Live SSE smoke (real API :4000) | PASS — streamed `accepted`/`stage`/`error` frames, safe message, no timeout, no leak |

### Known gaps / notes
- **Parallel frontend-anatomy migration WIP.** Another agent left `apps/web/src/shared`
  and `apps/web/src/packages` (a strict `Component→Hook→Service→Gateway` anatomy) as
  **untracked, incomplete** files not imported by the running app. They are excluded from
  typecheck (`apps/web/tsconfig.json`), tests (`vitest.config.ts` web-unit), and lint
  (`eslint/ignores.config.mjs`) until finished, and are intentionally left uncommitted.
- **Live Gemini outcome depends on the key's quota/model availability.** The streaming +
  fallback infrastructure is proven and unit-tested; a successful end-to-end match
  requires at least one reachable, non-exhausted model in `GEMINI_MODEL` /
  `GEMINI_FALLBACK_MODELS`. The live smoke surfaced a provider-unavailable error safely.
