# Simple Readable Code — The TwinzyAI Way

> The best TwinzyAI code is the code the next developer understands immediately. Full rule: [rules/28](../rules/28-simple-readable-code.md); reuse discipline: [rules/29](../rules/29-reuse-before-creating.md); refactor procedure: [rules/30](../rules/30-refactor-discipline.md); ownership answers: [context/declaration-ownership-map.md](../context/declaration-ownership-map.md).

## The Simple Code Ladder

1. Need it? → don't write it otherwise
2. Repo has it? → reuse/extend the owner
3. Platform solves it? → stdlib/Node/browser/Next/Nest/React first
4. Approved wrapper solves it? → adapter/gateway/service/hook/util
5. Small pure helper? → correct `lib//model/`/shared owner
6. Direct readable code? → write that
7. New abstraction → only with a real, current justification

Be lazy about code volume; never lazy about reading, validation, security, privacy, AI safety, upload safety, tests, docs, observability, a11y, i18n, or architecture.

## Before / after

**Clever (banned):**

```ts
const score = results.reduce((a, r) => (r.ok ? a + (WEIGHTS[r.kind] ?? 0) * (r.hi ? 2 : 1) : a), 0);
```

**Boring (required):**

```ts
const scoreFor = (result: JudgedResult): number => {
  if (!result.ok) return 0;
  const weight = WEIGHTS[result.kind] ?? 0;
  return result.isHighSignal ? weight * 2 : weight;
};
const score = sum(results.map(scoreFor));
```

**Inline declaration (banned):**

```ts
// inside a service method
const RETRYABLE = ['RATE_LIMITED', 'AI_TIMEOUT'];        // ✗ belongs in model/*.constants.ts
type RouteEntry = { provider: string; model: string };    // ✗ belongs in model/*.types.ts
```

**Speculative abstraction (banned):** a `ResultFormatterFactory` with one formatter; an options bag nobody passes; a generic `Repository<T>` with one T. Extract on the SECOND real use.

## Anti-patterns to reject in review

Clever one-liners · nested ternaries · hidden control flow · single-consumer factories/strategies/base classes · type gymnastics · god files · duplicate constants/helpers/mappers · dead code and unused config · comments that restate code · copy-paste blocks (token-burning) · "temporary" hacks.

## What simplicity never touches

Minimum code = minimum **safe** code. Image privacy (wipe-in-`finally`, never logged/persisted), consent-first upload validation, Zod at every boundary, AI safety filtering on every provider output, error envelopes + redaction, rate limits, cancellation/cleanup paths, a11y, i18n/RTL, strict TS/ESLint, tests, and gates are constitutionally out of scope for "cleanup".

## Reviewing AI-generated code

Same bar, no exceptions: run the ladder against the diff; reject speculation, duplication, and cleverness; verify declarations landed in their owners; verify the never-weaken list; verify tests moved WITH behavior. An agent's output is junior code until proven otherwise — review it like junior code with senior consequences.
