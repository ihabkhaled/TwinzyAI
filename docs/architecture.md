# Architecture

npm-workspaces monorepo:

    apps/web        Next.js 16 App Router (PWA, mobile-first)
    apps/api        NestJS 11 (game pipeline)
    packages/shared constants/types/enums/interfaces/schemas/utils (built CJS lib)
    packages/tsconfig, packages/eslint-config  config packages
    eslint/         split flat config + custom architecture plugin

Backend layers: Controller -> Manager -> Service -> Repository (adapters wrap external systems,
called by services). Frontend layers: Component -> Hook -> Service -> Gateway -> Backend.

Request flow for the game (languageCode en|ar rides the whole request: frontend active locale
-> multipart analyze field -> DTO, normalized to en when invalid -> every prompt -> schema-enforced
echo in every AI response, so all dynamic output is localized):

    UploadCard (TSX) -> useGame -> game.service -> game.gateway / game-stream.gateway
                     -> POST /api/v1/game/analyze (or /analyze/stream for SSE progress)
    GameController -> AnalyzeGameUseCase -> FileSecurityService -> TraitExtractionService (image)
                   -> [image destroyed in finally] -> StyleMatchService (text only):
                      CandidateGenerationService -> CandidateJudgeService -> ResultAggregationService
                   -> FinalGameResult JSON (up to MAX_FINAL_RESULTS=5 final style/vibe results)

Trait extraction returns advanced grouped visible traits: 221 named non-identifying fields across
16 nested categories (target 100+ filled when image quality allows; unclear fields stay honestly
"unclear", localized) plus uncertaintyNotes, compactTraitSummary (20-35 strongest signals) and
traitCount. The taxonomy has a single shared source, packages/shared/src/constants/trait-category.constants.ts;
the prompt JSON template is generated from it and a unit test keeps prompt and schema from drifting.
Candidate generation draws on a global public-figure pool and the judge pass rescores strictly
before aggregation.

Streaming (/analyze/stream) emits SSE stages validating -> scanning -> extracting-traits ->
generating-candidates -> judging -> aggregating; the traits event carries {traitCount,
compactTraitSummary} and the candidates event carries surviving names only.

Language switch never re-uploads or re-analyzes the image. POST /api/v1/game/translate-result
(GameController -> TranslateResultUseCase -> ResultTranslationService, text-only, no file slot)
localizes an existing result with a translation-only prompt, then the server overwrites every
canonical field (names, ranks, scores, verdicts, confidence, categories, traitCount, promptVersion)
from the original, enforces the server-side localized disclaimer, and safety-filters all
translated text.

Data both sides share (schemas, constants, enums) lives in packages/shared; neither app defines
its own copy. Nothing is persisted server-side.
