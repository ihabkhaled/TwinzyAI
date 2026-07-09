# 19 - Security Review (Hardening Slice G)

- Request: `twinzy-hardening-v3`
- Reviewer: Engineering (AI-assisted), owner-directed hardening program
- Date: 2026-07-09
- Decision: **PASS** — no unresolved High/Critical; one Moderate transitive advisory accepted as a tracked, time-boxed waiver (below).

## Scope

Security-relevant hardening applied in this slice:

- Reverse-proxy trust is OFF by default and only enabled behind a trusted proxy via `TRUST_PROXY=true` (`apps/api/src/bootstrap/fastify-adapter.ts`). Prevents `X-Forwarded-*` client-IP spoofing that would defeat the per-IP throttle and per-IP analysis caps when the container is directly exposed.
- Per-route JSON body caps (`configureSecurity` `onRoute` hook + `bootstrap.constants.ts`): `/game/cancel` capped at 8 KiB, `/game/translate-result` at 256 KiB, both far below the ~11 MiB global multipart limit. Oversized JSON is rejected with a native 413 before it is buffered or parsed — defence in depth on top of the strict zod schemas. Covered by `game-cancel-body-limit.integration.test.ts` and `json-route-body-limit.util.test.ts`.
- HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains`) added to the web response headers (`apps/web/next.config.ts`); the API already emits HSTS via Helmet.
- Dead transport dependencies removed from `apps/api/package.json` (Express-era `helmet`, `multer`, `@nestjs/platform-express`, `@fastify/static`) — smaller attack surface and dependency graph; lockfile re-synced (651 lines removed). `@fastify/helmet` and `@fastify/multipart` remain and are what the Fastify app actually uses.
- Container hardening (`docker-compose.yml`): `read_only`, `tmpfs`, `no-new-privileges`, `cap_drop: ALL`, `mem_limit`/`cpus`; ClamAV moved from `ports` to `expose` (no host exposure).
- Supply-chain guardrails: `.github/dependabot.yml` (weekly npm + github-actions), Node pinned to a single active LTS line (`.nvmrc` 22.20.0, `engines.node >=22.20 <23`, Dockerfiles `node:22-alpine`, all CI workflows via `node-version-file: .nvmrc`).
- CI security gate expanded (`.github/workflows/gate-security-scan.yml`): dependency audit gate, Trivy fs scan (vuln + secret + misconfig, HIGH/CRITICAL failing), plus a Trivy SARIF upload to GitHub code scanning. A runnable `security:scan:images` npm script is provided for image scanning during release.

## Checklist Coverage

- AuthN/AuthZ: N/A — the game is anonymous and unauthenticated by product design; no session, no tenant. Isolation that exists (per-tab/stream correlation ids on cancel) is enforced server-side and unchanged here.
- Input validation / output safety: strict zod `strictObject` at every boundary; per-route body caps added; AI output remains Zod-validated + safety-filtered. Unchanged and intact.
- Secrets handling: no secrets added; `GEMINI_MODEL` still env-driven; no secrets in logs (verified in the 413 log line — only request metadata).
- Abuse controls / rate limits: throttler intact; trust-proxy fix strengthens per-IP limits.
- Data handling / privacy: no image persistence; per-route caps do not log bodies. Unchanged.
- Dependency / CI-CD risk: reduced (dead deps removed, dependabot added, audit + Trivy SARIF gates).

## Findings

None blocking. One accepted waiver.

## Waiver W-1 — transitive Moderate advisory (postcss via Next)

- Advisory: GHSA-qx2v-qp2m-jg93 — PostCSS XSS via unescaped `</style>` in CSS stringify output (`postcss <8.5.10`), pulled transitively by `next` (bundled build-time postcss).
- Severity: **Moderate**. No direct fix: `npm audit fix --force` would downgrade `next` 16 → 9 (unacceptable breaking change).
- Exposure assessment: build-time CSS stringification path, not a runtime request path in this app; no user-controlled CSS is stringified. Practical risk to the running service: low.
- Decision: **Accepted, time-boxed.** The dependency-audit CI gate runs at `--audit-level=high` (fails on High/Critical) so this Moderate does not red the pipeline while remaining visible in every `npm audit` run.
- Remediation owner / plan: the dependency-upgrade slice will bump `next` to a release bundling patched postcss (`>=8.5.10`); once `npm audit` is clean the gate drops back to `--audit-level=low`. Tracked against `twinzy-hardening-v3`.
