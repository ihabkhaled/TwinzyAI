# ESLint Architecture

Flat config split by concern under /eslint, composed in eslint/index.mjs (prettier last), root
eslint.config.mjs re-exports it. Custom plugin: eslint/architecture-plugin.mjs
(eslint-plugin-twinzy-architecture) with the rule catalog below.

## Rule catalog (all error-level, applied to apps/** and packages/** TS files)

| Rule | Targets | Contract |
| --- | --- | --- |
| `controller-no-logic` | apps/api files ending `.controller.ts` (any folder) | Every method (except the constructor) is exactly one return statement whose value — after unwrapping `await` — is a call, optional chain, identifier, literal, or member access. Message ids: `singleReturnOnly`, `invalidReturn`. |
| `application-layer-boundaries` | apps/api files in `application/` or ending `.use-case.ts` / `.service.ts` | May import infrastructure/, adapters/, domain/, model/, lib/; must never import from api/ (controllers or DTOs) or provider SDKs. Replaces the former `manager-layer-boundaries`. |
| `repository-persistence-only` | apps/api files in `infrastructure/` or ending `.repository.ts` | Persistence only: no imports from api/, application/, adapters/, no provider SDKs. |
| `no-restricted-layer-imports` | apps/api + apps/web layer folders | One-directional layer flow. API legacy map: controllers/managers/services/repositories/adapters. Canonical additions: `api/` must not import infrastructure/ or adapters/ directly; `dto/` must not import application/ or infrastructure/. Web map (Component → Hook → Service → Gateway) untouched. |
| `no-inline-domain-definitions` | Layer files (controllers, managers, services, repositories, gateways, components, ui + api/, application/, infrastructure/, adapters/) | Interfaces, type aliases, and enums live in definition homes (types/, interfaces/, enums/, constants/, dto/, schemas/, model/, domain/, config/). A single `*Props` interface stays allowed in TSX components. |
| `no-direct-sdk-imports` | Everything except adapters/ folders, `*.adapter.ts` files, and tests | Provider SDKs (Gemini etc.) only inside adapters. |
| `no-direct-env-access` | Everything except apps/api/src/config/, apps/api/src/bootstrap/, apps/web/src/lib/config/, scripts/, e2e/, tooling `*.config.*` files | `process.env` reads only in the config/bootstrap layer. |
| `no-raw-library-imports` | Everything except wrapper homes (lib/, infrastructure/, adapters/, gateways/, core/) and tests | Wrapped libraries (dayjs, pino, ...) and raw HTTP clients are imported only inside their wrapper homes. |
| `tsx-pure-composition` | TSX under components/, features/, app/ | No React built-in hooks, no fetch — state and effects live in hooks/. |
| `no-restricted-vendor-imports` | apps/api/** and packages/shared/** ONLY (never apps/web) | Config-driven policy engine, see below. |

Backend detection is suffix-based where possible (`*.controller.ts`, `*.service.ts`,
`*.use-case.ts`, `*.repository.ts`, `*.adapter.ts`) so files keep their layer while the folder
migration to the canonical anatomy (modules/<feature>/{api, application, domain, infrastructure,
adapters, model, lib} + core/, config/, bootstrap/) is in flight. Anatomy folders are matched on
the src-relative path (see `srcRelativePath` in architecture-plugin/shared/path-utils.mjs) so the
`api` layer folder never collides with the `apps/api` workspace segment; all paths are normalized
to forward slashes so behavior is identical on Windows and POSIX.

## Vendor boundaries (no-restricted-vendor-imports)

The rule is a generic engine: options are `{ policies: [{ from?, forbid, allowIn?, message }],
restrictedAccess: [{ object, property, allowIn?, message }] }`. Patterns are regex strings
compiled with the `u` flag; `forbid` matches the raw import source, `from`/`allowIn` match the
normalized filename. The concrete policy list lives in eslint/package-boundaries.config.mjs and
is scoped in eslint/architecture.config.mjs to apps/api/** and packages/shared/**.

| Vendor(s) | Owning module (allowIn) |
| --- | --- |
| nestjs-pino, pino, pino-http, pino-pretty | apps/api/src/core/logger/ |
| class-validator, class-transformer | Forbidden everywhere — zod is this repo's only validation vendor |
| @nestjs/swagger | apps/api/src/core/openapi/ or apps/api/src/bootstrap/ |
| @nestjs/throttler | apps/api/src/core/rate-limit/ (controllers use its re-exports) |
| @nestjs/config | apps/api/src/config/ |
| fastify, @fastify/*, @nestjs/platform-* | apps/api/src/bootstrap/ (integration tests boot through the bootstrap helpers — no test exception) |
| @google/genai | apps/api/src/modules/ai/adapters/ |
| dotenv | apps/api/src/config/ |
| helmet, multer | apps/api/src/bootstrap/ (legacy transition; will be removed) |
| axios, got, ky, node-fetch, undici, superagent | Forbidden — create an owning HTTP adapter under apps/api/src/core/http first |

`restrictedAccess` flags `process.env` outside apps/api/src/config/, apps/api/src/bootstrap/,
scripts/, e2e/, and `*.config.*` tooling files — mirroring `no-direct-env-access` so the two
rules agree.

## Adaptation points

- **Vendors**: add/move a vendor by editing eslint/package-boundaries.config.mjs — never the
  rule implementation under architecture-plugin/.
- **Layer maps**: the folder lists and forbidden-import maps live in
  architecture-plugin/shared/policy-utils.mjs (`API_LAYER_FOLDERS`,
  `FORBIDDEN_API_LAYER_IMPORTS`, `FORBIDDEN_WEB_LAYER_IMPORTS`, `SDK_PACKAGES`,
  `WRAPPED_LIBRARIES`, `RAW_HTTP_PACKAGES`).
- **Layer detection**: suffix and folder helpers live in
  architecture-plugin/shared/path-utils.mjs; import-target resolution in
  architecture-plugin/shared/source-utils.mjs.
- **Rule wiring**: severity and file scoping in eslint/architecture.config.mjs.
- Rule tests: `npx vitest run --project lint-rules`
  (eslint/architecture-plugin/tests/architecture-rules.test.mjs).

## Documented relaxations (evaluated, not blind)

- security/detect-object-injection OFF — near-100% false positives on typed code.
- security/detect-non-literal-fs-filename OFF for the prompt loader only — paths come from a
  hardcoded candidate list, no user input.
- security/detect-non-literal-regexp OFF for architecture-plugin/shared/policy-utils.mjs only —
  the policy engine compiles regexes from the static pattern lists in
  package-boundaries.config.mjs, no user input.
- unicorn/prevent-abbreviations OFF — wholesale renames (props/env/params) harm readability.
- unicorn/no-null OFF — React/DOM APIs use null. unicorn/prefer-top-level-await OFF — CJS api.
- import-x/no-unresolved not enabled — TypeScript owns module resolution.
- sonarjs cognitive-complexity raised to 15; duplicate-string threshold 5.
- max-lines raised to 600 for test files (includes the `*.test.mjs` lint-rule suites) —
  describe blocks are naturally long.

Plugin compatibility decisions: ESLint pinned to the 9.x maintenance line because
eslint-plugin-react and eslint-plugin-jsx-a11y do not yet declare ESLint 10 support;
eslint-plugin-unicorn pinned to v63 (last 9.x-compatible). Revisit when peers widen.
