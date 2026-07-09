# Known Pitfalls

> The running log of recurring mistakes and their fixes. **Read before writing code.** These
> traps compile, pass the happy path, and only fail under strict flags, the gates, or
> production load. When a new recurring mistake appears, append it here in
> **Symptom / Cause / Fix** form — keep entries actionable.

---

## A. Strict-TypeScript traps

### A1. `noUncheckedIndexedAccess` — indexed access is `T | undefined`

- **Symptom:** `arr[0]` / `record[key]` works in the editor but typecheck flags it as possibly
  `undefined`.
- **Cause:** the flag is on; every index read widens to `T | undefined`, even when you "know"
  the key exists.
- **Fix:** narrow with a guard, `??` default, or `.at()` + check. Never the non-null assertion
  `!` — it is banned repo-wide.

### A2. `exactOptionalPropertyTypes` rejects explicit `undefined`

- **Symptom:** building `{ traitHint: maybeUndefined }` for a target typed `{ traitHint?: string }`
  fails to compile.
- **Cause:** with the flag on, `{ k?: V }` means *absent or V*, not `V | undefined`.
- **Fix:** omit the key instead of assigning `undefined` — conditionally spread:
  `{ ...(v === undefined ? {} : { traitHint: v }) }`. Do not widen the field to `V | undefined`.

### A3. `Partial<T>` helpers re-introduce `undefined`

- **Symptom:** a generic `stripUndefined(obj): Partial<T>` still fails at strict call sites.
- **Cause:** `Partial<T>` only makes keys optional; value types stay `V | undefined`, which
  `exactOptionalPropertyTypes` rejects.
- **Fix:** strip `undefined` from the value types: `{ [K in keyof T]?: Exclude<T[K], undefined> }`.
  Only collapse bare passthrough values this way — transformed values (`new Date(x)`,
  `x.trim()`) stay conditional spreads, or you evaluate the transform on `undefined`.

---

## B. Union & comparison traps (no `enum` in this repo)

### B1. Comparing against a hand-typed string literal

- **Symptom:** `status === 'actve'` compiles somewhere a union isn't inferred, or silently
  never matches after a rename.
- **Cause:** magic-string comparison instead of the `as const` object member.
- **Fix:** domain values are `as const` objects with derived types and `*_VALUES` arrays
  ([/rules/05-types-enums-constants.md](../rules/05-types-enums-constants.md)); compare against
  the object member (`GameStatus.READY`), validate membership with the `*_VALUES` array or the
  zod schema.

### B2. Non-exhaustive `switch` on a union

- **Symptom:** adding a new union member compiles, but a `switch` silently falls through.
- **Cause:** no exhaustiveness check.
- **Fix:** handle every case and end with a `never` assertion in `default`
  (switch-exhaustiveness-check is an error); a new member then breaks the build until handled.

### B3. Redundant guard after narrowing

- **Symptom:** `no-unnecessary-condition` flags a null check the type system already guarantees.
- **Fix:** trust the narrowing; delete the dead guard.

---

## C. Async, promises & fail-safe side effects

### C1. Floating promise drops work and errors

- **Symptom:** a side effect "sometimes doesn't happen"; no error surfaces.
- **Cause:** an un-awaited promise (`no-floating-promises` is an error).
- **Fix:** `await` it, or for an intentional fire-and-forget side effect, `void` it **with its
  own internal try/catch + logger.error**. A bare `void doThing()` that can reject is still a bug.

### C2. A throwing side-effect handler breaks the primary flow

- **Symptom:** a best-effort step failing causes the analyze request to 500 even though the
  game result was ready.
- **Cause:** a non-critical side effect throwing back into the request path.
- **Fix:** side effects are fail-safe — try/catch + log, never rethrow
  ([event-notification-decisions.md](./event-notification-decisions.md)). Exception: the image
  buffer zero-fill in `finally` always runs and is not optional.

### C3. `await` inside a loop serializes independent work

- **Symptom:** N independent operations take N× the latency.
- **Fix:** batch independent awaits. **But:** the three AI calls are sequential BY DESIGN (each
  consumes the previous output) — do not parallelize the pipeline
  ([performance-decisions.md](./performance-decisions.md)).

### C4. Async override of a void-return signature swallows rejections

- **Symptom:** an overridden lifecycle/handler method's failure vanishes.
- **Fix:** keep the signature `void`; call async work via `void this.doAsyncWork()` with errors
  handled inside it.

### C5. Naked `setTimeout` in a promise executor

- **Symptom:** `no-promise-executor-return` error on `new Promise(r => setTimeout(r, ms))`.
- **Fix:** brace the executor body — `new Promise<void>((resolve) => { setTimeout(resolve, ms); })`
  — or better, a named delay helper in `lib/`.

---

## D. DI, scopes & module wiring

### D1. Request/transient scope silently promotes its whole graph

- **Symptom:** unexpected per-request instantiation and performance cliffs.
- **Cause:** one scoped provider bubbles its scope up to every consumer.
- **Fix:** default to singleton scope; scope only with a documented reason; prefer passing
  request context as a typed argument.

### D2. Transient-scoped providers cannot be fetched with `app.get()`

- **Symptom:** `app.get(AppLogger)` throws or returns the wrong instance in bootstrap/tests.
- **Cause:** a context-bound (transient-scoped) provider — e.g. the logger — has no single
  instance for `app.get()` to return.
- **Fix:** `await app.resolve(AppLogger)`.

### D3. Cross-module internal import

- **Symptom:** a refactor in module A breaks module B; circular-dependency warnings.
- **Cause:** importing another module's internals instead of its public surface.
- **Fix:** consume other modules only through their public surface; the architecture ESLint
  plugin flags violations ([/rules/01-architecture.md](../rules/01-architecture.md)).

### D4. `forwardRef` masking a design smell

- **Symptom:** "Nest can't resolve dependencies" at boot, or a growing `forwardRef` chain.
- **Fix:** export the provider through the module surface; treat any needed `forwardRef` as a
  signal to move the shared concern into `core/` or invert the dependency.

---

## E. Validation traps (zod is the vendor)

### E1. Non-strict schemas silently pass unknown keys

- **Symptom:** a typo'd or extra client field flows through unvalidated.
- **Cause:** plain `z.object()` strips/ignores unknown keys; you wanted rejection.
- **Fix:** closed shapes use `z.strictObject()` — **strict schemas reject unknown keys**; that
  is the repo default for DTOs and AI response contracts
  ([/rules/21-dto-validation.md](../rules/21-dto-validation.md)).

### E2. Query/multipart fields arrive as strings

- **Symptom:** a "number" or "boolean" from a query param or multipart field never equals its
  numeric/boolean value; zod rejects a valid-looking request.
- **Cause:** HTTP query strings and multipart form fields are ALWAYS strings; zod does not
  coerce by default.
- **Fix:** explicit coercion in the schema — `z.coerce.number()`, `z.coerce.boolean()` (mind
  `"false"` semantics — prefer a literal union), `z.coerce.date()` — never ad-hoc `parseInt`
  in a controller.

### E3. Zod v4 API drift

- **Symptom:** patterns from zod v3 docs fail or deprecate.
- **Fix:** `z.strictObject` for closed shapes; `z.enum` with a tuple of values; `nativeEnum` is
  deprecated (moot here — the TS `enum` keyword is banned anyway).

### E4. Validation logic drifting into services

- **Symptom:** a service re-checks shapes a schema already guarantees, or worse, is the only
  place a check exists.
- **Fix:** validation lives in the zod schema at the boundary (DTO/env/AI response); services
  receive parsed, typed data.

---

## F. Config, logging & inline-constant traps

### F1. `process.env` read outside the config module

- **Symptom:** a value is `undefined` in one environment; no startup failure.
- **Fix:** all env goes through the zod-validated schema in `src/config/`; **AppConfigService
  is the only surface**. `GEMINI_MODEL` especially — env only, never hardcoded.

### F2. Error leaks stack/vendor detail to the client

- **Symptom:** a 500 body contains a stack trace or SDK message.
- **Fix:** throw a typed `AppError` with a `messageKey` (`errors.<feature>.<key>`); the filter
  returns the sanitized envelope (legacy ErrorCode + additive messageKey) and logs full detail
  server-side ([architecture-decisions.md](./architecture-decisions.md)).

### F3. Inline value constant in an implementation file

- **Symptom:** review keeps flagging a magic number/TTL/limit/message key at the top of a
  service.
- **Fix:** named values live in the owning constants module and are imported; no inline domain
  definitions (types/interfaces/constants/DTOs/schemas live in dedicated folders). Extend the
  existing owner before creating a parallel constants file.
- **Enforced (backend):** `architecture/no-inline-domain-definitions` (apps/api only) now ALSO
  bans module-level value/config `const` in layer files — controllers, services, use-cases,
  repositories, adapters, and `api`/`application`/`infrastructure`. Exempt: function-valued
  consts, `new`/call-expression wiring (DI/factories), and the single approved
  `LOG_CONTEXT`/`LOG_PREFIX`. Scoped to apps/api so web `*.variants.ts` class-string bundles
  stay valid.
- **Enforced (frontend):** `frontend-architecture/no-inline-declarations` bans module-level
  types/interfaces/enums and non-function consts in component/container/hook/service/gateway/
  query/route files; `*.variants.ts` design-system bundles are the approved home for class
  strings.

### F4. Logging payloads instead of identifiers

- **Symptom:** an entity, buffer, or AI response body appears in a log line.
- **Fix:** constant event name + identifier metadata via the AppLogger port; nothing derived
  from the image is ever loggable ([observability-decisions.md](./observability-decisions.md)).

---

## G. Toolchain & platform pitfalls (this repo, concrete)

### G1. tsgo (TS7 native) removed `baseUrl`

- **Symptom:** imports that resolved under tsc fail under `tsgo --noEmit`.
- **Cause:** the native compiler dropped `baseUrl` support.
- **Fix:** use tsconfig-relative paths only (explicit `paths` mappings / relative imports).

### G2. Dual fastify copies break plugin typings

- **Symptom:** `@fastify/*` plugin registration fails to type-check or behaves oddly after an
  install.
- **Cause:** `@nestjs/platform-fastify` pins its own fastify; without deduping there are two
  copies with incompatible type identities.
- **Fix:** root `fastify` dependency + a root npm override forcing one copy; **verify
  `npm ls fastify` shows ONE deduped version after every install.**

### G3. Transient-scoped providers and `app.get()` — see D2

### G4. `@Module` classes trip `no-extraneous-class`

- **Symptom:** ESLint flags every Nest module class as extraneous.
- **Fix:** keep `allowWithDecorator: true` on that rule — decorated classes are the framework's
  unit of wiring, not dead code.

### G5. Decorator downlevel emits an uncoverable synthetic branch

- **Symptom:** branch coverage can't reach 95 on files with decorated classes — one synthetic
  branch per decorated class line, under istanbul AND v8.
- **Cause:** the decorator downlevel transform.
- **Fix:** the branch floor is 90 **solely for that artifact**; real branches must be covered.
  Don't chase synthetic branches; don't lower any other threshold
  ([testing-strategy.md](./testing-strategy.md)).

### G6. Legacy brace-expansion npm overrides break newer ESLint's minimatch

- **Symptom:** ESLint 10-line tooling fails on glob handling after carrying over old root
  overrides.
- **Fix:** don't carry legacy brace-expansion npm overrides forward; keep overrides minimal
  (the fastify dedupe override is the sanctioned one).

### G7. A mis-named test file silently never runs

- **Symptom:** a test file exists, is green "locally", and is never executed by any project.
- **Cause:** its name doesn't match the vitest project include patterns
  (`*.test.ts` / `*.integration.test.ts` per project).
- **Fix:** the pattern check is part of review — confirm the file actually ran in the project's
  output before trusting it.

### G8. Express→Fastify idiom map (don't write Express idioms)

- `FileInterceptor`/multer → `@fastify/multipart` registered in bootstrap + structural
  multipart types in `core/http/`.
- `res.status().json()` → `HttpReplyLike.status().send()`.
- Express middleware → Nest guards/pipes/interceptors.
- `cookie-parser` → `@fastify/cookie`.

### G9. `@twinzy/shared` resolves the BUILT dist

- **Symptom:** phantom type errors or stale behavior from the shared package.
- **Cause:** npm workspaces resolve `@twinzy/shared` to its compiled dist, not its sources.
- **Fix:** run `npm run build:shared` before typecheck/tests/dev, or you chase stale types.

### G10. Vitest + Nest decorators need the SWC plugin

- **Symptom:** DI resolves to `undefined` in api tests.
- **Cause:** esbuild strips `emitDecoratorMetadata`.
- **Fix:** the SWC plugin in the vitest config is **mandatory** for api projects. Do not remove
  it. (tsgo type-checks; SWC handles test-time decorator metadata; nest build handles emit.)

### G11. Windows paths in lint tooling

- **Symptom:** architecture lint rules mis-match on Windows.
- **Fix:** rules must normalize backslash paths (path-utils.mjs does).

### G12. npm workspaces hoist bins to the root

- **Symptom:** a tool "isn't installed" inside a workspace folder.
- **Fix:** run tooling from the repo root.

### G13. Next 16 (web workstream)

- `next lint` is removed (we run our own eslint); dev/build use Turbopack by default.

---

## H. Quality-gate traps

### H1. Project-wide typecheck fails on files you didn't touch

- **Symptom:** pre-commit blocks your commit on errors elsewhere.
- **Cause:** lint-staged scopes ESLint to staged files, but typecheck runs project-wide.
- **Fix:** fix the pre-existing breakage as part of your change; never suppress or bypass with
  `--no-verify`.

### H2. Stale compiled `.js` next to `.ts` sources

- **Symptom:** a runtime/test picks up old behavior or "module not found".
- **Fix:** build only into `dist/`; delete stray `src/**/*.js`; keep source globs source-only.

### H3. Green build ≠ done

- The gates are `npm run lint && npm run typecheck && npm run test:unit && npm run build`
  plus coverage on pre-push and the Trivy scan — and the release checklist on top
  ([release-checklist.md](./release-checklist.md)).

---

## I. Migration-discovered traps (Express→Fastify + layered-anatomy migration)

### I1. The `AppError` hierarchy needs statuses beyond the 400/401/403/404/409/413/502 set

- **Symptom:** the shared integration contract asserts 415 (unsupported type), 422 (magic-byte /
  decode / infected), and 503 (ClamAV fail-closed unreachable); the core hierarchy has no subclass
  for those, and reusing a 400 `ValidationError` breaks the byte-identical envelope.
- **Cause:** the standard core subclasses don't cover every HTTP status a domain legitimately uses.
- **Fix:** add **module-local** `AppError` subclasses in `model/<feature>.errors.ts` (e.g.
  `UnsupportedImageTypeError` 415, `InvalidImageError` 422, `VirusScanUnavailableError` 503) that
  extend the core `AppError` base and carry the same stable `errorCode` + derived `messageKey`.
  Subclasses may live in any module; only the base + filter live in `core/errors`. See
  [/rules/26-error-handling-and-exceptions.md](../rules/26-error-handling-and-exceptions.md).

### I2. A `@deprecated` compatibility shim self-flags the 0/0 lint gate

- **Symptom:** a transitional re-export shim marked `@deprecated` makes every importer (and the
  shim's own module file) fail `@typescript-eslint/no-deprecated` + `sonarjs/deprecation` — which
  are errors, so the repo can never reach 0/0 while the shim exists.
- **Cause:** `no-deprecated` fires on any reference to a `@deprecated` symbol, including wiring.
- **Fix:** transitional shims must be **short-lived** — deleted in the same migration once all
  callers are repointed to the canonical path. If a shim genuinely must persist, do NOT tag it
  `@deprecated`. When deleting shims, grep for importers **without** an over-broad `grep -v` that
  hides `apps/api/src/tests/fixtures/*` (shared fixtures deep-import module internals).

### I3. Mock assertions trip `unbound-method` and `no-unsafe-*` in strict tests

- **Symptom:** `expect(logger.warn)…`, `mock.calls[0]`, and `expect.any(String)` raise
  `@typescript-eslint/unbound-method`, `no-unsafe-assignment`, or `vitest/valid-expect`
  ("unknown modifier" on asymmetric matchers).
- **Cause:** these type-safety rules target production code; test doubles are intentionally
  loosely typed and reference methods as values.
- **Fix:** relax `unbound-method` + `no-unsafe-*` **for test files only** in
  [`eslint/test.config.mjs`](../eslint/test.config.mjs) (production stays fully strict). For the
  `vitest/valid-expect` false-positive on `expect.any`/`expect.objectContaining`, prefer
  `toMatchObject` / `toBeTypeOf` / `mock.calls` assertions rather than disabling the rule.

### I4. `ConfigService.get(key, { infer: true })` widens away a zod optional's `undefined`

- **Symptom:** `configService.get('ENABLE_SWAGGER', { infer: true }) ?? fallback` is flagged
  `no-unnecessary-condition` (LHS "never undefined") even though the zod schema is a tri-state
  optional transform and the value **is** `undefined` at runtime when the var is absent — masking
  a real bug (the fallback never runs).
- **Fix:** annotate the intermediate to preserve the tri-state:
  `const configured: boolean | undefined = this.configService.get('ENABLE_SWAGGER', { infer: true });`
  then `return configured ?? fallback;`.

### I5. Coverage `include` must be a logic-bearing allowlist, not all of `src`

- **Symptom:** the 95/90/95/95 gate reports ~80% because it counts adapters (wrapping an
  un-runnable vendor SDK / TCP client, exercised only via integration stubs), error subclasses,
  enums, models, DTO schema declarations, and unused scaffolding.
- **Fix:** scope `coverage.include` in [`vitest.config.ts`](../vitest.config.ts) to the
  logic-bearing files (`error-body.mapper`, `app-exception.filter`, logger service +
  http-logging.options, validation factory + zod-issue mapper, http parser + interceptor,
  `modules/**/application`, `modules/**/infrastructure`, `modules/**/lib`, `shared/src/utils`) and
  exclude the rest. Keep [`testing/coverage-policy.md`](../testing/coverage-policy.md) in exact sync.

### I6. Trivy `--skip-dirs` needs `**/`-globs for nested build output

- **Symptom:** `security:scan` FATALs on `apps/web/.next/dev/lock` (locked by a running dev
  server) and scans `apps/*/dist` even with `--skip-dirs dist,.next`.
- **Cause:** a bare `--skip-dirs .next` matches only a top-level `.next`, not `apps/web/.next`.
- **Fix:** use `**/`-prefixed patterns (`**/node_modules,**/dist,**/.next,…`) so nested build
  output across workspaces is skipped.

### I7. `npm install` transient `Cannot set properties of null (setting 'peer')`

- **Symptom:** an install fails with an arborist "peer" null error, often when a `package.json`
  `overrides` block is present (e.g. the fastify dedupe) or another process touches `node_modules`.
- **Fix:** re-run `npm install` — it is transient (a lock race), not a real dependency conflict.
  Confirm the fastify dedupe held with `npm ls fastify` afterward.

### I8. A file-scoped ESLint override breaks when the file it names moves

- **Symptom:** `security/detect-non-literal-fs-filename` (or any file-scoped rule disable) fires
  after a migration because the override in `eslint/security.config.mjs` still points at the old
  path (e.g. `…/prompts/prompt-loader.service.ts` after fs access moved to
  `…/infrastructure/prompt-template.repository.ts`).
- **Fix:** update the override's `files` glob in the same change that relocates the file.

---

## J. Frontend component discipline (web workstream)

### J1. God-component grows past the tight web size limits

- **Symptom:** a `*.component.tsx` / `*.container.tsx` accretes body vars, `.map()`s, and inline
  handlers until it is an unreviewable god-component.
- **Cause:** letting one view file do more than compose; web view files carry limits tighter
  than the repo-wide 300/80 base.
- **Fix:** split into sub-components / sub-containers *before* the file grows. `max-lines` (130),
  `max-lines-per-function` (60), and `react/jsx-max-depth` are enforced on `*.component.tsx` /
  `*.container.tsx` via
  [`eslint/frontend/component-size.config.mjs`](../eslint/frontend/component-size.config.mjs).

### J2. A `.component.tsx` holding hooks or logic

- **Symptom:** a `.component.tsx` calls a hook, maps a list, or defines an inline handler.
- **Cause:** a view that needs state or iteration modeled as a component instead of a container.
- **Fix:** `.component.tsx` is pure JSX — no hooks (`no-hooks-in-components`) and no
  logic/`.map()`/inline handlers (`no-inline-component-logic`). When a view must map lists or
  hold body vars it is a CONTAINER (e.g. `game-result.container` / `game-processing.container`),
  which may map.

---

## K. Feature-discovered traps (advanced-global-traits-v2)

### K1. `languageCode` is lenient on analyze (multipart) but strict on translate (JSON) — both are intentional

- **Symptom:** the same concept validates two ways — `/game/analyze` accepts any ≤35-char
  `languageCode` string, while `/game/translate-result` rejects anything but a supported code —
  and "unifying" either direction breaks tests.
- **Cause:** two different boundaries. Multipart fields are always strings and the analyze
  locale is a best-effort hint: absent/junk/unsupported values are NORMALIZED to a supported
  code (default `en`) by `normalizeLanguageCode` via `game/lib/request-language.ts`, so the
  game stays playable (friendly UX at the form-data edge). Translate is a JSON API whose whole
  point is the target language — silently defaulting a bad `targetLanguageCode` would return
  the wrong product outcome, so `TranslateResultRequestSchema` is `z.strictObject` with the
  strict `LanguageCodeSchema` (`z.enum`, unknown keys rejected).
- **Fix:** keep both behaviors. Normalize free-form hints at lenient multipart edges; reject
  strictly when the field IS the request's meaning. Do not "clean up" one to match the other.

### K2. Changing `REQUIRED_PLACEHOLDERS` breaks every test that stubs a template

- **Symptom:** after adding a placeholder to `REQUIRED_PLACEHOLDERS` (e.g. `[LANGUAGE_CODE]`
  in v2), prompt-template unit tests fail with "missing required placeholder" / "Missing
  replacement" even though the real prompt files are correct.
- **Cause:** `PromptTemplateRepository` enforces the contract on EVERY template — loaded or
  stubbed: `assertRequiredPlaceholdersExist` at load, a missing-replacement throw at build,
  and `assertNoUnreplacedPlaceholders` scanning the FULL `PromptPlaceholder` set. Tests stub
  `readFileSync` with inline template strings, which face the same asserts.
- **Fix:** when `REQUIRED_PLACEHOLDERS` changes, sweep the tests in the same change: every
  stubbed template must include every required placeholder for its key, and every
  `buildPrompt` call must supply the new replacement. Compose stubs from `PromptPlaceholder`
  members, never hand-typed `[BRACKET]` strings.

### K3. Hand-listing trait fields instead of deriving from the shared taxonomy

- **Symptom:** a fixture, prompt snippet, or label list "works" until the taxonomy changes,
  then schema validation, the prompt-sync test, or i18n label coverage fails — or drifts
  silently until review catches it.
- **Cause:** the 221-field / 16-category taxonomy is defined ONCE as `TRAIT_CATEGORY_FIELDS`
  in `packages/shared/src/constants/trait-category.constants.ts`. The zod traits schema,
  Prompt 1's JSON template (a unit test asserts every field appears in the built prompt),
  api/web/shared test fixtures, and the en+ar i18n label keys ALL derive from it — a
  hand-written field list is a second source of truth waiting to drift.
- **Fix:** always iterate `TRAIT_CATEGORY_FIELDS` (fixtures generate a value per field,
  labels key per field, prompts/schemas are built from it). Never enumerate trait field
  names by hand anywhere.

### K4. Typed eslint against a stale `packages/shared/dist` floods `no-unsafe-*` false positives

- **Symptom:** lint results differ wildly by machine (0 errors on one, dozens locally,
  hundreds on CI) and every error is a `@typescript-eslint/no-unsafe-*` on "a type that
  cannot be resolved" — always on values imported from `@twinzy/shared`.
- **Cause:** `@twinzy/shared` resolves through its BUILT types (package `exports` →
  `dist/index.d.ts`). Typed eslint therefore lints against whatever `dist/` happens to
  exist: stale after a `packages/shared/src` change → the new exports are error-typed;
  absent (fresh CI checkout) → EVERY shared import is error-typed. The errors are noise —
  the code is fine; the dist is old.
- **Fix:** `npm run lint` / `lint:fix` build shared first (same as `typecheck` and `test`),
  and the pre-commit hook builds shared before lint-staged. Never invoke raw
  `npx eslint <file>` after touching `packages/shared/src` without `npm run build:shared`
  first — and never "fix" these errors with casts; rebuild the dist instead.

### K5. A dependency reached only at boot (Swagger UI → `@fastify/static`) looks "dead" to grep + tests

- **Symptom:** a dep with no `import`/`require` anywhere in `src` is removed as dead; every
  gate stays green, but the running app logs at boot
  `The "@fastify/static" package is missing … FastifyAdapter.useStaticAssets()` (and the
  `/docs` UI breaks).
- **Cause:** `SwaggerModule.setup()` mounts the OpenAPI UI via `useStaticAssets()`, which
  *lazy-loads* `@fastify/static` — there is no static import to grep, and the mocked-route
  integration tests boot through `createTestApp`, which never called `configureSwagger`, so
  nothing exercised the Swagger boot path. "No import + green tests" did not mean "unused".
- **Fix:** before deleting a dependency, check for lazy/transitive/framework-triggered uses
  (Swagger UI, adapters, plugins loaded by a vendor at runtime), not just `grep import`. When
  a boot-only path is untested, add a smoke test that exercises it — `createTestApp({ withSwagger: true })`
  + `swagger-boot.integration.test.ts` now boot the UI so a re-removal fails fast. Verified-dead
  siblings from the same cleanup (express `helmet`/`multer`/`@nestjs/platform-express`) stayed
  removed — the lesson is "prove it, boot included," not "never remove deps".

---

## L. Feature-discovered traps (temporary-shareable-results)

### L1. Playwright route-mock of a cross-origin JSON XHR is flaky under WebKit

- **Symptom:** the share-flow e2e passes on the Chromium engines (chromium + mobile-chromium, 6
  passing) but is unreliable under WebKit when reusing the dev server, so it is documented-skipped
  on WebKit (3 webkit-skipped).
- **Cause:** the share page reads its record via a cross-origin JSON `XHR`; Playwright's `route`-mock
  of that request is flaky under WebKit in reuse-mode. The analyze flow is immune because it uses a
  fetch/SSE path that avoids the mocked cross-origin XHR.
- **Fix:** keep the WebKit share e2e skipped and documented as a HARNESS limitation, not a product
  gap — the share logic is fully covered by 264 web-unit + 43 backend integration tests. Do not
  "fix" it by loosening the mock or weakening an assertion; re-enable only if WebKit route-mocking of
  cross-origin XHR becomes reliable.

### L2. The in-memory share cache is single-instance and clears on restart

- **Symptom:** a share link created before a redeploy/restart 404s afterward; a link created on one
  replica is unreadable on another.
- **Cause:** the `memory` `ShareResultCachePort` adapter keeps records in this process's heap only —
  there is no shared store, by design (no Redis infra today).
- **Fix:** this is expected operational behavior for the single-instance deployment, not a bug — the
  TTL is short and the limitation is documented (README, `docs/privacy-and-data-retention.md`,
  `docs/architecture.md`). For multi-replica, implement the Redis/Valkey adapter behind the same port
  (select via `SHARE_RESULT_CACHE_DRIVER`) or use sticky sessions. Never add a database (privacy
  invariant) to "fix" this.

**Related:** [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) ·
[backend-stack.md](./backend-stack.md) · [testing-strategy.md](./testing-strategy.md) ·
[ai-context-map.md](./ai-context-map.md)
