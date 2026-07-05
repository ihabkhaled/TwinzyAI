# Architecture

npm-workspaces monorepo:

    apps/web        Next.js 16 App Router (PWA, mobile-first)
    apps/api        NestJS 11 (game pipeline)
    packages/shared constants/types/enums/interfaces/schemas/utils (built CJS lib)
    packages/tsconfig, packages/eslint-config  config packages
    eslint/         split flat config + custom architecture plugin

Backend layers: Controller -> Manager -> Service -> Repository (adapters wrap external systems,
called by services). Frontend layers: Component -> Hook -> Service -> Gateway -> Backend.

Request flow for the game:

    UploadCard (TSX) -> useGameController -> game.service -> game.gateway -> POST /api/v1/game/analyze
    GameController -> GameManager -> FileSecurityService -> TraitExtractionService (image)
                   -> [image destroyed] -> CandidateGenerationService (text) -> CandidateJudgeService (text)
                   -> ResultAggregationService -> FinalGameResult JSON

Data both sides share (schemas, constants, enums) lives in packages/shared; neither app defines
its own copy. Nothing is persisted server-side.
