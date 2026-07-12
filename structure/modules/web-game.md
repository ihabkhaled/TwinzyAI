---
id: structure-module-web-game
title: Module — web game (Core Game Feature)
type: structure
authority: canonical
status: current
owner: repository owner
summary: The frontend game module — setup with upload/camera/consent, the env-gated payment step, SSE-streamed analysis with live progress, results, translation, and sharing.
keywords: [web, game, container, hooks, gateway, sse, upload, payment, share, view-model]
contextTier: 2
relatedCode: [apps/web/src/modules/game]
relatedTests: [apps/web/src/modules/game/test, apps/web/e2e]
relatedDocs: [docs/frontend-architecture.md, structure/flows/analyze-flow.md, structure/layer-map.md]
readWhen: You are changing any game UI, hook, service, gateway, or game copy on the web side.
---

# Module — `apps/web/src/modules/game`

**Responsibility.** The core game feature: landing, upload/camera/consent setup, the
env-gated PayPal payment step, SSE-streamed analyze with live progress, result view,
text-only locale re-translation, temporary share links, and the public share page.

## Public surface (`index.ts` — deep imports into internals are forbidden)

`PrivacyNotice`, `GameContainer`, `LandingContainer`, `SharePageContainer`.

## Layer anatomy (Component → Hook → Service → Gateway, [layer-map.md](../layer-map.md))

| Layer | Contents |
| --- | --- |
| `containers/` | 13 client orchestrators incl. `game.container.tsx` (switches on `GamePhase` Setup/Payment/Processing/Success/Error), `payment-step.container.tsx`, `share-page.container.tsx`, `share-modal.container.tsx`, `donate-link.container.tsx`; each with a sibling `*.variants.ts` |
| `components/` | 16 pure-JSX `*.component.tsx` (camera-capture, upload-card, result-card, countdown-timer, …), size-capped by `eslint/frontend/component-size.config.mjs` |
| `hooks/` | 14 hooks; `useGame.hook.ts` is the single orchestrator composing `useImageUpload`, `useCameraCapture`, `useResultCount`, `useAnalyzeRunControl`, `usePaymentFlow`, `useRunRecovery`, `useStreamProgress`, `useResultTranslation`, `useShareCreate`/`useShareResult`, `useSharePage` + `useCountdown`, `usePayPalButtons` |
| `services/` | React-free orchestration: `game.service.ts` (client file validation → gateway), `share.service.ts` |
| `gateway/` | HTTP only, responses zod-validated against `@twinzy/shared`: `game.gateway.ts`, `game-stream.gateway.ts` (the SSE protocol client), `game-translate.gateway.ts`, `payment.gateway.ts`, `share.gateway.ts`, `game-form-data.builder.ts` |
| `model/` | Constants (`GAME_ERROR_KEY_BY_CODE`, `TRANSIENT_ERROR_CODES`, stage label keys), `game.enums.ts` (`GamePhase`), view-model types incl. payment + share |
| `helpers/`, `mappers/`, `queries/`, `schemas/` | Display/error/validation helpers, `game.mapper.ts`, TanStack Query bindings, shared-schema re-exports |

## Key runtime facts

- **SSE**: transport is the app's only streaming fetch
  (`apps/web/src/packages/axios/stream-request.ts`, no client timeout, abort closes the
  socket); protocol in `gateway/game-stream.gateway.ts` — zod-validated frames filtered by the
  per-tab sessionStorage uuid `twinzy.tabId` + per-run requestId
  (`helpers/stream-identity.helper.ts`).
- **Image handling**: in-memory `File` + object-URL preview only; never written to any browser
  storage (`hooks/useImageUpload.hook.ts`).
- **Payment**: `usePaymentFlow` runs free when `isPayPalConfigured()` is false; full sequence
  in [flows/payment-flow.md](../flows/payment-flow.md).
- **Translation**: locale switch re-translates text-only via the translate gateway; manual
  retry, never auto-retry (`hooks/useResultTranslation`).
- **i18n**: every user-facing string via `apps/web/src/packages/i18n` (en + ar, RTL).

## Invariants

- TSX stays pure composition; state/effects in hooks; logic in helpers/mappers; HTTP only
  through the gateway + `packages/axios` wrapper (enforced — [layer-map.md](../layer-map.md)).
- No raw vendor imports; no deep imports across modules.
- Error codes map to copy through `GAME_ERROR_KEY_BY_CODE`; unknown codes fall back safely
  (`helpers/game-error.helper.ts`).

## Tests

`apps/web/src/modules/game/test/` — 29 vitest files (components, containers, gateways,
helpers, hooks, service, mapper, env tests, shared fixtures) under the `web-unit` project.
E2E: `apps/web/e2e/` (game flow, cancel, errors, streaming, translate, privacy, share,
paywall-off, a11y, visual) against a mocked backend.

## Common changes and risks

- **New UI state/copy**: container/hook change + both i18n catalogs + test ids from the
  canonical registry (`apps/web/src/shared/constants/test-ids.constants.ts`).
- **Contract changes**: shared schema first, then gateway + fixtures
  ([shared.md](shared.md)).
- **Risk**: breaking tab/request correlation breaks multi-tab isolation; breaking the
  paywall-off path breaks the free-by-default guarantee.
