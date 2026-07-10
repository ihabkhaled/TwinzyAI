# Backend Architecture

Modules (apps/api/src/modules): health, game, ai, file-security, result-aggregation, privacy.
Each module uses only the folders it needs: api/ (controller + dto/), application/
(use-cases + services), domain/model (policies, entities, constants, types), infrastructure/
(repositories), adapters/ (vendor wrappers), lib/ (pure helpers), tests/, index.ts.

The layer anatomy is one-way and mechanically enforced (the pass-through "Manager" tier is
retired):

```
Controller (api/<feature>.controller.ts — thin, one delegation per method)
  -> Application (application/<action>.use-case.ts for multi-step orchestration;
                  <feature>.service.ts for focused capabilities, <=20 lines/method)
    -> Domain (domain/model — policies, entities, state machines, pure)
      -> Persistence (infrastructure/<feature>.repository.ts — parameterized, bounded)
        -> Integration (adapters/<vendor>.adapter.ts — every external library wrapped)
```

- game: GameController (one route) -> AnalyzeGameUseCase (application/analyze-game.use-case.ts,
  the flow owner) + StyleMatchService (application/style-match.service.ts) -> services from
  other modules.
- ai: PromptTemplateRepository (infrastructure/), TraitExtractionService,
  CandidateGenerationService, CandidateJudgeService, AiSafetyService (application/),
  GeminiAdapter (adapters/ — only SDK touchpoint), prompts/*.md.
- file-security: FileValidationService, MagicByteValidationService,
  ImageDecodeValidationService, VirusScanService (+ ClamAvAdapter),
  TemporaryFileCleanupService, orchestrated by FileSecurityService (all under application/,
  the adapter under adapters/).
- result-aggregation: merges traits + judged results into FinalGameResult, enforces the
  disclaimer and display caps.
- privacy: log-redaction helpers and the no-persistence guarantees.
- health: HealthController delegates straight to HealthService (application/) — no manager tier.

Global: config/ (AppConfigService — only process.env reader), core/logger (AppLogger),
core/errors (typed AppError subclasses + AppExceptionFilter + the stable ErrorCode map + the
messageKey catalog), core/validation, core/http, core/rate-limit, and bootstrap/ (Fastify app
assembly, including create-test-app.ts for integration boots).

Errors are typed, currently-used AppError subclasses (ValidationError 400, NotFoundError 404,
PayloadTooLargeError 413, TooManyRequestsError 429, IntegrationError 502, plus file-security's
UnsupportedImageTypeError 415, InvalidImageError 422,
InfectedFileError 422, VirusScanUnavailableError 503). Each carries a stable `errorCode` and a
`messageKey` (errors.<feature>.<key>); the global filter (core/errors/app-exception.filter.ts)
maps any throw to the sanitized envelope `{ statusCode, errorCode, message, messageKey }`.
