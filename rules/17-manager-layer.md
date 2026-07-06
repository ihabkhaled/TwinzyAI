# 17 — Application Layer: Use Cases (formerly Managers)

> **The manager tier is retired.** Its responsibilities live in `application/<action>.use-case.ts`. A use case owns one multi-step, multi-collaborator business operation: the ordered sequence, its side effects, and its cleanup guarantees. Enforced by `architecture/manager-layer-boundaries` (the plugin rule keeps its historical name; it now guards the use-case boundary). Implements rule 17 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

Related: [19-services-application-layer.md](./19-services-application-layer.md) · [16-backend-architecture.md](./16-backend-architecture.md) · [/skills/create-manager-use-case.md](../skills/create-manager-use-case.md)

---

## Service vs. Use case — the decision

**Service is the default.** Escalate to a use case only when one operation genuinely coordinates **multiple services in an ordered sequence with owned side effects/cleanup**.

| Signal | Service | Use case |
| --- | --- | --- |
| One focused capability, single delegation, a read | ✅ | — |
| Single call + fail-safe side effect | ✅ | — |
| Ordered multi-service pipeline with cleanup guarantees | — | ✅ |
| Cross-module coordination under one operation | — | ✅ |

**One-way rule: use cases call services; services never call use cases.** Violating it creates cycles and hides who owns the sequence. A use case never touches HTTP objects, never imports controllers or API DTO schemas, never instantiates SDKs (adapters only, usually via the services it calls), and never reads `process.env`.

---

## The worked example: `analyze-game.use-case.ts`

The analyze pipeline is the canonical use case — an ordered, cleanup-guaranteed orchestration:

```
execute(input):
  1. consent check                → ValidationError('errors.game.consentRequired') if absent
  2. file security chain          → FileSecurityService (ordered checks, fail-closed — rules/15)
  3. trait extraction             → the ONLY stage that sees the image (rules/14)
  4. buffer wipe                  → in finally — runs on EVERY path, success or failure
  5. candidate generation         → text-only prompts over the extracted traits
  6. judge                        → text-only ranking of candidates
  7. aggregate                    → result-aggregation → FinalGameResult (shared schema)
```

```ts
@Injectable()
export class AnalyzeGameUseCase {
  constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly candidates: CandidateService,
    private readonly judge: JudgeService,
    private readonly aggregation: ResultAggregationService,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: AnalyzeGameInput): Promise<FinalGameResult> {
    await this.fileSecurity.validate(input);                    // consent + full chain
    try {
      const traits = await this.traitExtraction.extract(input.file); // image stage
      const generated = await this.candidates.generate(traits);      // text-only
      const ranked = await this.judge.rank(traits, generated);       // text-only
      return this.aggregation.aggregate(ranked);
    } finally {
      wipeBuffer(input.file.buffer); // lib/ helper — the use case owns the guarantee
    }
  }
}
```

The use case owns **when** the wipe happens; the services own **how** each stage works. Note the image never crosses stage 3 — from candidates onward everything is text.

---

## Rules

- One use case per business operation; name it `<action>.use-case.ts` (`AnalyzeGameUseCase`). No god classes — a second operation is a second use case.
- The use case sequences and guards; it does not implement. Mapping/formatting goes to `lib/`, rules to `domain/`, capabilities to services.
- Cleanup guarantees (buffer wipe, resource release) live in the use case's `finally` — never scattered across services hoping someone runs them.
- Concurrency primitives are allowed **here** (not in services): bounded fan-out over independent stage-internal calls is a use-case concern ([07-performance-scalability.md](./07-performance-scalability.md)).
- Every failure surfaces as a typed `AppError` + `messageKey`; the use case never catches-and-suppresses a pipeline failure ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)).
- Tests: orchestration order, argument passing, error propagation, and **the wipe on failure paths** are all unit-asserted with doubled services ([09-testing-coverage.md](./09-testing-coverage.md)).

---

## Checklist

- [ ] Escalated to a use case only for a genuine ordered multi-service operation
- [ ] Use case calls services; no service calls a use case; no HTTP/SDK/env access
- [ ] Cleanup guarantees in `finally`, asserted on failure paths
- [ ] Sequencing only — implementation delegated to services/`lib/`/`domain/`
- [ ] Typed `AppError` + distinct `messageKey` per failure scenario
