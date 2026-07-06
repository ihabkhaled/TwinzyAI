# 11 — ESLint & TypeScript: The Strictness Catalog

> The complete lint + type gate and how to pass it. When this doc and the config disagree, **the config wins** — then fix this doc.
>
> **Zero-tolerance gate.** `npm run lint` MUST print **0 errors AND 0 warnings**; `npm run typecheck` MUST pass — both before any commit (Husky pre-commit enforces them; pre-push runs coverage + build; never `--no-verify`). No `eslint-disable`, no `@ts-ignore`; `@ts-expect-error` only with a description and an entry in [docs/package-decisions.md](../docs/package-decisions.md). See rules 1–7 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

```bash
npm run lint        # eslint .        → must be 0/0
npm run lint:fix    # autofix mechanical issues (sort/format/unused)
npm run typecheck   # builds shared, then per-workspace checks; apps/api type-checks with tsgo
```

> `apps/api` type-checks with **tsgo** (`@typescript/native-preview`), not plain `tsc`. Relaxations of any lint rule require a documented entry in [docs/eslint-architecture.md](../docs/eslint-architecture.md).

---

## The modular config layout

`eslint.config.mjs` composes single-purpose flat-config modules from [`/eslint`](../eslint), prettier last:

| Module | Owns |
| --- | --- |
| `base.config.mjs` | Core JS correctness (`no-console`, `eqeqeq`, `curly`, …) |
| `typescript.config.mjs` | Type-aware strictness (`strictTypeChecked` + pinned overrides) |
| `imports.config.mjs` | `simple-import-sort`, `import-x/no-cycle`, `unused-imports` |
| `promise.config.mjs` / `regexp.config.mjs` / `security.config.mjs` / `sonar.config.mjs` / `unicorn.config.mjs` | Async safety, ReDoS, vulnerability patterns, clean-code, modern JS |
| `architecture.config.mjs` + `architecture-plugin/` | **The layer boundaries** — the custom `architecture/*` rules |
| `package-boundaries.config.mjs` | Vendor package → owning folder map ([10-library-modularization.md](./10-library-modularization.md)) |
| `react.config.mjs` / `react-hooks.config.mjs` / `next.config.mjs` / `test.config.mjs` | Frontend + test scopes (jsx-a11y errors; `.only` banned; `no-explicit-any` and `no-non-null-assertion` stay ON in tests) |

Type-aware rules need a clean project graph — fix `typecheck` first when lint errors cascade.

---

## The custom architecture plugin

Standard rules can't express "one delegation per controller method". The plugin ([`eslint/architecture-plugin`](../eslint/architecture-plugin.mjs)) does, and it has its own test project (`lint-rules`):

| Rule | Enforces |
| --- | --- |
| `architecture/controller-no-logic` | A controller method is exactly one delegation — no branching/transformation ([18-routes-controllers.md](./18-routes-controllers.md)) |
| `architecture/no-restricted-layer-imports` | One-way layer imports; cross-module access via `index.ts` only ([01-architecture.md](./01-architecture.md)) |
| `architecture/no-inline-domain-definitions` | Zero inline types/enum-maps/constants/DTOs in layer files ([05-types-enums-constants.md](./05-types-enums-constants.md)) |
| `architecture/no-raw-library-imports` / `architecture/no-direct-sdk-imports` | Vendor packages only inside their owner ([10-library-modularization.md](./10-library-modularization.md)) |
| `architecture/no-direct-env-access` | `process.env` only in `config/`/`bootstrap/` ([25-configuration-and-environment.md](./25-configuration-and-environment.md)) |
| `architecture/repository-persistence-only` | Repositories/infrastructure hold no business logic ([20-repositories-database.md](./20-repositories-database.md)) |
| `architecture/manager-layer-boundaries` | Application-layer (use-case) boundary: calls services only, never transport/SDKs ([17-manager-layer.md](./17-manager-layer.md)) |
| `architecture/tsx-pure-composition` | TSX holds no state/effects/handlers ([02-frontend-components-tsx.md](./02-frontend-components-tsx.md)) |

Companion `no-restricted-syntax` bans `Promise.all|allSettled|any|race` inside `*.service.ts`; `max-lines-per-function` caps service methods at ~20 lines.

---

## Strict TypeScript flags (the real `tsconfig.base.json` — frozen)

`tsconfig.base.json` is frozen: fix code, never flags. The actual flags:

| Flag | Effect |
| --- | --- |
| `strict: true` (+ explicit `noImplicitAny`, `strictNullChecks`, `alwaysStrict`) | All baseline strict guarantees |
| `noUncheckedIndexedAccess` | `arr[i]` / `obj[key]` is `T \| undefined` — always narrow |
| `exactOptionalPropertyTypes` | `foo?: string` rejects explicit `undefined` — conditionally spread |
| `noPropertyAccessFromIndexSignature` | Index-signature members use `obj['key']` |
| `useUnknownInCatchVariables` | `catch (e)` ⇒ `e: unknown` — narrow before use |
| `noImplicitReturns` / `noImplicitOverride` / `noFallthroughCasesInSwitch` | Every path returns; `override` explicit; no fallthrough |
| `noUnusedLocals` / `noUnusedParameters` | Dead locals/params are compile errors (`_`-prefix to keep) |
| `allowUnreachableCode: false` / `allowUnusedLabels: false` | Dead code is a compile error |
| `noUncheckedSideEffectImports` / `isolatedModules` / `moduleDetection: force` | Side-effect imports resolve; each file transpiles independently |
| `allowJs: false` / `noEmitOnError` / `forceConsistentCasingInFileNames` | TS only; no emit on error; case-safe |
| `target ES2023` · `module NodeNext` · `moduleResolution NodeNext` · `skipLibCheck` | Platform baseline |

```ts
// noUncheckedIndexedAccess — narrow index access
const first = candidates[0]; // Candidate | undefined
if (first === undefined) return;

// exactOptionalPropertyTypes — never assign explicit undefined
const meta = { ...(requestId === undefined ? {} : { requestId }) };
```

---

## Pinned typescript-eslint overrides

On top of `strictTypeChecked`: `no-explicit-any`, `no-non-null-assertion`, `no-floating-promises`, `no-misused-promises`, `consistent-type-imports`, `consistent-type-definitions` (interface for shapes), `no-unnecessary-condition`, `only-throw-error` (pairs with typed `AppError`), `prefer-nullish-coalescing`, `prefer-optional-chain`, `require-await`, `return-await` (in-try-catch), `switch-exhaustiveness-check` — all `error`.

## Common violations → root-cause fix

| Finding | Root-cause fix |
| --- | --- |
| `no-explicit-any` | `unknown` + narrowing, a real interface, or a generic |
| `no-non-null-assertion` | Guard, `??`, or `?.` |
| `no-floating-promises` | `await`, `return`, or an owned catch for true fire-and-forget |
| `architecture/controller-no-logic` | Move branching into the use case/service; leave one delegation |
| `architecture/no-inline-domain-definitions` | Extract to `model/*.{types,enums,constants}.ts` / shared |
| `architecture/no-raw-library-imports` | Depend on the owning adapter/module |
| `no-restricted-syntax` (`Promise.all` in service) | Move fan-out to a use case or `lib/` helper |
| `switch-exhaustiveness-check` | Add the case, or `default` with a `never` assertion |
| `noUncheckedIndexedAccess` fallout | Narrow after index access before use |

Fix the cause, never the symptom — disabling a rule is a non-negotiable violation (rule 4).

---

## Checklist

- [ ] `npm run lint` is 0/0; `npm run typecheck` passes (tsgo for api)
- [ ] No `eslint-disable` / `@ts-ignore`; `@ts-expect-error` only with a documented decision
- [ ] No `any`, no `!`, every nullable narrowed; no TS `enum`
- [ ] Architecture rules green: thin controllers, no inline declarations, layer imports respected, vendors in their owners
- [ ] No `.only` in tests; `console.*` replaced by `AppLogger`
- [ ] `tsconfig.base.json` untouched
