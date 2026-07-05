# Backend Architecture

Modules (apps/api/src/modules): health, game, ai, file-security, result-aggregation, privacy.
Each module: controllers/, managers/, services/, adapters/, dto/, schemas/, constants/, tests/,
index.ts (only the folders it needs).

- game: GameController (one route) -> GameManager (flow owner) -> services from other modules.
- ai: PromptLoaderService, TraitExtractionService, CandidateGenerationService,
  CandidateJudgeService, AiSafetyService, GeminiAdapter (only SDK touchpoint), prompts/*.md.
- file-security: FileValidationService, MagicByteValidationService,
  ImageDecodeValidationService, VirusScanService (+ ClamAvAdapter),
  TemporaryFileCleanupService, orchestrated by FileSecurityService.
- result-aggregation: merges traits + judged results into FinalGameResult, enforces the
  disclaimer and display caps.
- privacy: log-redaction helpers and the no-persistence guarantees.

Global: config/ (AppConfigService — only process.env reader), infrastructure/logger
(LoggerService), common/ (DomainException, AllExceptionsFilter, ErrorCode, rate limits).
