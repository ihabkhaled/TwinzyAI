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

## Temporary shareable results (TWZ-SHARE-001)

apps/api/src/modules/share-results (api/application/infrastructure/lib/model/tests) adds an
OPTIONAL, database-free way to share a finished result. The cache is a PORT — ShareResultCachePort
plus the SHARE_RESULT_CACHE DI token — with exactly one bounded in-memory TTL adapter today
(InMemoryShareResultCacheRepository): lazy expiry on read + a periodic sweeper + OnModuleDestroy
cleanup + a max-active-items cap (new creates are rejected at capacity) + a max-payload-bytes cap,
so memory can never grow unbounded. It is single-instance only: records live in this process's heap
and are gone on restart/redeploy (multi-replica needs sticky sessions). Redis/Valkey is the
DOCUMENTED production path — implement the same port as a Redis adapter and select it via
SHARE_RESULT_CACHE_DRIVER (which accepts only "memory" today); it is intentionally NOT built now
because the repo has no Redis infra and shipping an untested/dead client would violate the
no-dead-code + test-everything gates.

Endpoints (versioned, throttled, Zod-validated, AppError/messageKey envelope):

    POST   /api/v1/share-results             create  (throttle 20/min)
    GET    /api/v1/share-results/:shareId     read    (throttle 120/min)
    DELETE /api/v1/share-results/:shareId     delete  (throttle 20/min)

Create validates the FULL existing FinalGameResult (reusing the strict validated contract, so there
is no image/file slot by construction), re-runs the safety filter (forbidden wording + rejects any
data:/base64/embedded-image string), enforces the byte cap, mints a crypto randomUUID shareId,
computes expiresAt, caches ONLY the safe result JSON + ids/timings, and returns {shareId, shareUrl,
createdAt, expiresAt, ttlSeconds}. Read returns {shareId, languageCode, result, createdAt,
expiresAt, remainingSeconds} or a safe 404 (errorCode SHARE_NOT_FOUND) for a missing OR expired id —
an identical response, so there is no existence oracle. remainingSeconds is server-computed from the
authoritative expiresAt. New error codes: SHARE_NOT_FOUND (404), SHARE_PAYLOAD_TOO_LARGE (413),
SHARE_RESULT_UNSAFE (400), SHARE_CAPACITY_REACHED (429). Five zod-validated, fail-fast env vars drive
every cap/timing/URL (see docs/env-vars.md).

Frontend: the public route apps/web/src/app/share/[shareId]/page.tsx is an async server component
with STATIC metadata (robots {index:false, follow:false} + generic safe Open Graph — no per-user
data, no image, nothing fetched or stored at metadata time) that renders a client
SharePageContainer. The share create/modal/countdown/public-page code lives INSIDE
apps/web/src/modules/game (not a new modules/share) to reuse the result view and avoid a circular
module dependency; the route file only imports the container. The result screen's Share button opens
a ShareModal that creates the link (posting only the result, never the image) then offers
copy/native/platform sharing. A packages/browser Web Share facade (canUseWebShare/shareViaWebShare)
and a packages/axios getJson were added; all text is escaped (no dangerouslySetInnerHTML).
