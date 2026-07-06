# 05 — Types, Enums & Constants

> The zero-inline policy in depth. Every type, enum-map, and reusable constant lives in its own dedicated file; every domain value is an as-const member, never a raw string literal. **The TypeScript `enum` keyword is banned repo-wide** — enums are `as const` objects + derived types + a `*_VALUES` array. Implements rules 8–15 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [21-dto-validation.md](./21-dto-validation.md) · [01-architecture.md](./01-architecture.md) · [11-eslint-typescript.md](./11-eslint-typescript.md) · [12-i18n.md](./12-i18n.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)

---

## 1. The zero-inline policy (rules 10–14)

A controller, use case, service, repository, adapter, guard, filter, pipe, hook, or gateway contains **only its primary class/function**. Every reusable type, enum-map, constant, DTO schema, request/response shape, and config map is extracted to a dedicated file and imported (`architecture/no-inline-domain-definitions` rejects violations mechanically).

| Artifact | Goes in | Example |
| --- | --- | --- |
| Types & interfaces | `model/<feature>.types.ts` or `packages/shared/src/types` | `modules/game/model/game.types.ts` |
| Enums (as-const) | `packages/shared/src/enums/<name>.enum.ts` (+ barrel) or `model/<feature>.enums.ts` | `packages/shared/src/enums/verdict.enum.ts` |
| Constants / config maps | `model/<feature>.constants.ts` or `packages/shared/src/constants` | `modules/file-security/model/file-security.constants.ts` |
| Zod DTO schemas | `api/dto/<name>.dto.ts` backed by `packages/shared/src/schemas` | see [21-dto-validation.md](./21-dto-validation.md) |
| Helpers / mappers / formatters | `lib/<feature>.helpers.ts`, `lib/<feature>.mappers.ts` | — |

The only literal that may stay file-local is a logging label:

```ts
const LOG_PREFIX = '[Game:UseCase]'; // ✓ logging convenience, tied to this one file
```

Documented exception: a TSX component file may declare its own `XxxProps` interface (the view contract) — all domain shapes still live in `model/` or shared.

---

## 2. Enums without the `enum` keyword (rule 8)

Every enum is an `as const` object with a derived union type and a runtime `*_VALUES` tuple, exported from its own kebab-case file and re-exported from the barrel.

```ts
// packages/shared/src/enums/verdict.enum.ts
export const Verdict = {
  STRONG_MATCH: 'strong_match',
  GOOD_MATCH: 'good_match',
  PARTIAL_MATCH: 'partial_match',
} as const;

export type Verdict = (typeof Verdict)[keyof typeof Verdict];

// Typed tuple — preserves literal narrowing for zod
export const VERDICT_VALUES = [
  Verdict.STRONG_MATCH,
  Verdict.GOOD_MATCH,
  Verdict.PARTIAL_MATCH,
] as const;
```

```ts
// packages/shared/src/enums/index.ts — the barrel
export * from './public-category.enum';
export * from './verdict.enum';
```

### Zod integration (the narrowing pitfall)

`Object.values(X) as [string, ...string[]]` **erases** literal types — a schema fed that array infers `string`, not the union. Always give zod the **typed `as const` tuple**:

```ts
// Don't — loses narrowing: verdict: string
z.enum(Object.values(Verdict) as [string, ...string[]]);

// Do — keeps narrowing: verdict: Verdict
z.enum(VERDICT_VALUES);
```

Module-private enums that never cross a boundary may live in `model/<feature>.enums.ts` (backend) or the feature `model/` (frontend). Promote to `packages/shared/src/enums` the moment the other side — or a second module — needs them.

---

## 3. Single-value constants are constants too (rule 12, STRICT)

The most-missed half of the rule: a **single named value** is still a constant. Any magic number, TTL, timeout (`GEMINI_TIMEOUT_MS`), size cap (`MAX_IMAGE_SIZE_BYTES`), retry/backoff parameter, `messageKey`, URL, header name, or limit **must** live in a `*.constants.ts` file and be imported. Declaring it at the top of an implementation file — even with a comment — is a violation.

```ts
// Don't — value constants squatting in a service/adapter
const TRAIT_COUNT = 15;                                // ✗ magic number
const GAME_NOT_FOUND_KEY = 'errors.game.notFound';     // ✗ messageKey literal

// Do — declared in the owning constants file, imported where used
// modules/game/model/game.constants.ts
export const TRAIT_COUNT = 15;
export const GAME_MESSAGE_KEYS = {
  NOT_FOUND: 'errors.game.notFound',
} as const;
```

- `UPPER_SNAKE_CASE` for every module-level value constant.
- Literals that do **not** need extraction: throwaway numerics `0`, `1`, `-1`, `100`; regex; the file-local `LOG_PREFIX`; test descriptions.
- Cross-side values (allowed MIME types, result caps, forbidden-wording lists) live in `packages/shared/src/constants` so web and api can never drift.

---

## 4. No magic strings, no domain string comparisons (rule 9)

Any value with domain meaning — verdict, category, provider, pipeline stage, event name — is an as-const member, never a raw string.

```ts
// Don't
if (result.verdict === 'strong_match') { /* … */ }

// Do
import { Verdict } from '@twinzy/shared';
if (result.verdict === Verdict.STRONG_MATCH) { /* … */ }
```

- **No string-union types for domain values.** `type Verdict = 'strong_match' | '…'` is banned — derive the union from the as-const object.
- **No string-literal switch cases, object keys, or event names** for domain concepts — use the member.
- Allowed literals: `messageKey`s inside their constants file, log messages/prefixes, regex, test descriptions.

---

## 5. Derive, don't re-declare (single source of truth)

- Types derive from schemas and constants: `z.infer<typeof FinalGameResultSchema>`, `keyof typeof GAME_MESSAGE_KEYS`, `(typeof X)[keyof typeof X]`.
- Constants may import types; **types must not import constants** (that cycle crashes at module load). Consumers import each directly.
- `interface` for object shapes, `type` for unions/tuples/mapped types (`consistent-type-definitions`); `import type`/`export type` for all type-only imports.
- `unknown` over `any`; no `!`; honor `exactOptionalPropertyTypes` (conditionally spread, never assign explicit `undefined`).

---

## 6. Search before you create (rule 15, STRICT)

Before creating **any** new `*.constants.ts` / `*.types.ts` / `*.helpers.ts` / `*.util.ts`, **search for the file that already owns the concern and extend it.** A parallel file fragments the source of truth and invites drift.

Mandatory pre-flight search order:

1. `packages/shared/src/{constants,enums,types,schemas,utils}` — cross-side owners first
2. `apps/api/src/modules/<feature>/model/` and `lib/` — the module's own homes
3. `apps/web/src/features/<name>/model/` and `lib/` — the feature's own homes
4. `apps/api/src/core/` — cross-cutting backend owners

Decision rules: **one concern → one file**; co-locate with siblings (one `model/<feature>.constants.ts`, not a per-file scatter); a genuinely new concern gets one descriptively-named file that becomes the single home. Wrong home ≠ valid home — don't drop a `messageKey` into an error-codes file that holds machine codes.

---

## 7. Naming conventions

| Kind | Case | Example |
| --- | --- | --- |
| Files | `kebab-case` | `verdict.enum.ts`, `game.constants.ts` |
| As-const enum objects / types / interfaces | `PascalCase` (singular) | `Verdict`, `GameResult` |
| Enum members | `UPPER_SNAKE_CASE` keys | `Verdict.STRONG_MATCH` |
| Constants (incl. `*_VALUES`) | `UPPER_SNAKE_CASE` | `VERDICT_VALUES`, `MAX_IMAGE_SIZE_BYTES` |
| Variables / functions | `camelCase` | `mapTraitsToPrompt` |
| Booleans | `is`/`has`/`can`/`should` prefix | `isConsentGiven` |

Avoid catch-all filenames (`types.ts`, `utils.ts`) at a module root — use scoped names (`game.types.ts`, `game-sort.constants.ts`).

---

## Checklist

- [ ] No TS `enum` keyword anywhere; as-const object + derived type + `*_VALUES` tuple
- [ ] Zod schemas consume the typed `as const` tuple, never `Object.values(...)` casts
- [ ] No inline type/interface/enum-map/constant in any layer file (LOG_PREFIX excepted)
- [ ] Every single-value constant lives in a `*.constants.ts`
- [ ] No domain string comparisons/unions; members only
- [ ] Cross-side values in `packages/shared` exactly once
- [ ] Searched the existing owner before creating any new constants/types/util file
- [ ] Constants→types import direction respected; type-only imports use `import type`
