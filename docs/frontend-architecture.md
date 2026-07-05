# Frontend Architecture

App Router routes: / (landing), /game, /privacy, /terms, /help. Pages are pure composition.

features/game:
- ui/: LandingHero, GameIntroCard, PrivacyNotice, UploadConsentCard, UploadCard, ProcessingCard,
  TraitList, TraitItem, ResultList, ResultCard, ResultDisclaimer, ErrorState, RetryButton,
  ShareResultButton — all pure TSX.
- hooks/: useGameController (flow state machine), useImageUploadController (file pick/validate/
  preview), useGameResultController (share/retry).
- services/game.service.ts: orchestrates validation + gateway call + mapping.
- gateways/game.gateway.ts: HTTP only via lib/http wrapper; multipart POST to /api/v1/game/analyze.
- model/: constants, enums, types, interfaces, schemas, query keys.
- lib/: mappers (DTO -> view model), guards, validators (client-side UX checks).

lib/ wrappers: http (fetch wrapper), config (NEXT_PUBLIC env reader), storage, share
(Web Share API + clipboard fallback), react-query (client factory). i18n: typed dictionary.
