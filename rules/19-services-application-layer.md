# 19 — Services (Application Layer)

> A service owns **one focused capability** and stays small: guard preconditions → delegate → return a typed result. It never parses HTTP, never holds utility logic, never reads `process.env`, never orchestrates multi-service pipelines (that's the use case — [17-manager-layer.md](./17-manager-layer.md)). Implements rules 18–19 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

---

## What a service MAY / MUST NOT do

**MAY:** inject adapters, domain policies, and (if they ever exist) repositories via constructor DI (`private readonly`); check preconditions the schema can't express; delegate rules to `domain/` and shaping to `lib/`; call `core/` services (AppLogger, config); return typed results; throw typed `AppError`s with `messageKey`s.

**MUST NOT:** touch HTTP request/response objects; call use cases (one-way rule); define inline types/constants/schemas (`architecture/no-inline-domain-definitions`); do inline mapping/formatting/string-building (extract to `lib/`); re-validate what the DTO already proved ([21-dto-validation.md](./21-dto-validation.md)); read `process.env` (use `AppConfigService`); instantiate vendor SDKs (adapters only — [10-library-modularization.md](./10-library-modularization.md)); use `console.*`; let a side-effect failure crash the workflow.

---

## The standard method shape

```ts
@Injectable()
export class TraitExtractionService {
  constructor(
    private readonly ai: AiProviderPort,       // adapter port, not the SDK
    private readonly safety: AiSafetyService,
    private readonly logger: AppLogger,
  ) {}

  async extract(file: ValidatedImage): Promise<TraitSet> {
    const raw = await this.ai.generate(buildTraitPrompt(file));   // lib/ builds the prompt
    const traits = parseTraitSet(raw);                            // zod parse in lib/
    this.safety.assertSafe(traits);                               // safety filter (rules/14)
    this.logger.info('game.traitsExtracted', { count: traits.length }); // ids, never payloads
    return traits;
  }
}
```

Guard → delegate → return. No branching maze, no inline transformation.

## Method-size budget (≤ ~20 lines — ESLint-enforced)

`max-lines-per-function` runs on `*.service.ts`. When a method grows past the budget, the overflow is **not orchestration** — extract it and the method shrinks naturally:

| Bloat in the method | Extract to |
| --- | --- |
| Data shaping / mapping | `lib/<feature>.mappers.ts` |
| String/prompt building, formatting | `lib/<feature>.formatters.ts` |
| Multi-step business rules / invariants | `domain/<feature>.policy.ts` |
| Reusable computation | `lib/<feature>.helpers.ts` |
| A genuinely multi-service sequence | escalate to a use case |

See [/skills/decompose-large-file.md](../skills/decompose-large-file.md) for the mechanical workflow.

## No concurrency primitives in services

`Promise.all | allSettled | any | race` are **banned inside `*.service.ts`** (`no-restricted-syntax`). Fan-out is structural — it belongs in a use case or a named `lib/` helper the service calls ([07-performance-scalability.md](./07-performance-scalability.md)).

## Typed results + `messageKey` errors

Every public method declares an explicit return type — entities/DTOs from shared schemas, never loose objects. Every failure throws the semantically right `AppError` subclass with a distinct `errors.<feature>.<key>` ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)):

```ts
throw new ValidationError('Consent missing', GAME_MESSAGE_KEYS.CONSENT_REQUIRED);
throw new PayloadTooLargeError('Image too large', FILE_MESSAGE_KEYS.TOO_LARGE);
throw new IntegrationError('Provider failed', AI_MESSAGE_KEYS.PROVIDER_FAILED, undefined, cause);
```

## Decomposing a large service

Split by cohesion into focused sub-services behind a thin facade: the original class keeps its provider token and public signatures, each method becoming a one-line delegation; bodies move **verbatim**; pure shared helpers become exported `lib/` functions, stateful ones move into ONE injected collaborator. Consumers and tests stay untouched.

## Type-system traps that bite this layer

- `exactOptionalPropertyTypes`: conditionally spread — never assign explicit `undefined` to an optional.
- Feed zod the typed `as const` tuples, not `Object.values(...)` casts ([05-types-enums-constants.md](./05-types-enums-constants.md)).
- `no-unnecessary-condition`: trust narrowing; drop guards the compiler already proved.
- No `!`: guards, `??`, `?.`.

---

## Checklist

- [ ] One focused capability; multi-service sequences escalated to a use case
- [ ] `@Injectable()` + `private readonly` constructor DI; no `new`, no service locator
- [ ] Every method: guard → delegate → typed return; ≤ ~20 lines
- [ ] Shaping/formatting/rules extracted to `lib/`/`domain/`; no inline declarations
- [ ] No HTTP objects, no SDKs, no `process.env`, no `console.*`, no `Promise.all*`
- [ ] Every failure a typed `AppError` with a distinct `messageKey`
- [ ] Unit tests cover happy + unhappy + boundary with doubled collaborators
