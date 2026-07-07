# Skill: Create a Use Case (the layer formerly called "Manager")

> Applies rules/17. The manager term is retired: the orchestration layer rules/17 governs now
> lives in `application/*.use-case.ts`. Canonical playbook: create-use-case.md — this file
> keeps the retired-name pointer and the worked example.

1. A use case owns one multi-step workflow: ordering, short-circuits, fallbacks, and cleanup
   guarantees (try/finally). Controllers delegate exactly one call to its `execute(...)`.
2. Inject services only — never adapters, repositories, or SDKs directly.
3. Follow the full steps in create-use-case.md.

## Worked example — the analyze-game use case

`apps/api/src/modules/game/application/analyze-game.use-case.ts` owns the whole game round
and its safety guarantees: consent-first file-security chain, trait extraction as the ONLY
step that sees the image, buffer wipe in `finally` on success AND failure, then text-only
candidate generation, text-only judging, and safe aggregation with the enforced disclaimer.

```ts
@Injectable()
export class AnalyzeGameUseCase {
  public constructor(
    private readonly fileSecurity: FileSecurityService,
    private readonly cleanup: TemporaryFileCleanupService,
    private readonly traitExtraction: TraitExtractionService,
    private readonly candidateGeneration: CandidateGenerationService,
    private readonly candidateJudge: CandidateJudgeService,
    private readonly resultAggregation: ResultAggregationService,
    private readonly logger: AppLogger,
  ) {}

  public async execute(file: UploadedImageFile | undefined, body: unknown): Promise<FinalGameResult> {
    const traits = await this.extractTraitsAndDestroyImage(file, isConsentGiven(body));

    const candidates = await this.candidateGeneration.generateCandidates(traits);
    if (candidates.length === 0) {
      this.logger.warn('game.analyze.noSafeCandidates'); // fail-safe: fallback, never a hard error
      return this.resultAggregation.buildFallback(traits);
    }

    const judged = await this.candidateJudge.judgeCandidates(traits, candidates);
    return this.resultAggregation.aggregate(traits, judged);
  }

  /** The image lives exactly as long as this method — validated, sent to trait
   *  extraction once, then zero-filled no matter what happened. */
  private async extractTraitsAndDestroyImage(
    file: UploadedImageFile | undefined,
    consent: boolean,
  ): Promise<Traits> {
    try {
      const safeFile = await this.fileSecurity.assertSafeImage(file, consent);
      return await this.traitExtraction.extractTraits(safeFile.buffer, safeFile.mimetype);
    } finally {
      this.cleanup.wipe(file); // cleanup guarantee lives in the use case
    }
  }
}
```

4. Unit-test order-of-operations, every short-circuit, and the cleanup guarantee: make any
   step throw and assert the wipe still ran (write-unit-tests.md).

## Keep definitions out of the use-case file

No reusable definition lives inline in a service or use-case file. Types, interfaces, and
enums belong in `types/`, `model/`, or `enums/`; reusable value/config consts and `as const`
maps belong in `constants/` or `model/`. ESLint `architecture/no-inline-domain-definitions`
enforces this across `apps/api` layer files and now also bans module-level value/config
`const` in them. Exempt: function-valued consts, `new`/call-expression DI/factory wiring, and
the single approved `LOG_CONTEXT`/`LOG_PREFIX`.

Gate: npm run lint && npm run typecheck && npm run test:unit && npm run test:coverage && npm run build && npm run security:scan
