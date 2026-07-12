---
id: support-provider-outage-messaging
title: Provider Outage Messaging — What Players See When AI Is Down or Rate-Limited
type: support
authority: canonical
status: current
owner: repository owner
summary: The exact copy keys and strings players see during AI provider outages, rate limiting, and overload, and how support should communicate during each.
keywords: [support, outage, provider, rate-limit, messaging, copy, ai-unavailable, server-busy, retry]
contextTier: 2
relatedCode:
  [
    apps/api/src/modules/ai/model/gemini.constants.ts,
    apps/api/src/modules/game/model/game.messages.ts,
    apps/web/src/packages/i18n/messages/en.json,
  ]
relatedTests: [apps/web/e2e/game-error-states.spec.ts]
relatedDocs: [runbooks/provider-outage.md, runbooks/provider-rate-limiting.md, support/communication-templates.md]
readWhen: An AI provider incident is active and you need to know or quote exactly what players are seeing.
---

# Provider Outage Messaging

During AI trouble the web app shows its own i18n copy keyed off the backend `errorCode` — players never see raw provider errors. Mapping owner: [user-visible-error-guide.md](./user-visible-error-guide.md).

## Exact player-facing copy per condition

| Condition | Backend errorCode | Web i18n key | English copy the player sees | UI affordance |
| --- | --- | --- | --- | --- |
| Provider down / 5xx / auth trouble | `AI_PROVIDER_UNAVAILABLE` (502) | `errors.aiUnavailable` | "The vibe engine is unavailable right now. Please try again in a moment." | "Try again with the same photo" (transient) |
| Provider call timed out | `AI_TIMEOUT` (502) | `errors.aiUnavailable` | same as above | same |
| Provider returned unparseable output | `AI_RESPONSE_INVALID` (502) | `errors.aiUnavailable` | same as above | same (but this is a model-behavior defect — see [../runbooks/ai-schema-failures.md](../runbooks/ai-schema-failures.md)) |
| Provider output failed the safety filter | `AI_RESPONSE_UNSAFE` (502) | `errors.aiUnavailable` | same as above | same |
| Provider quota / provider-side rate limit | `AI_RATE_LIMITED` (429) | `errors.rateLimited` | "Too many tries in a short time. Please wait a moment." | transient retry |
| Our own API throttle (30/min global, 10/min analyze) | `RATE_LIMITED` (429) | `errors.rateLimited` | same as above | transient retry |
| Server at concurrency capacity | `SERVER_BUSY` (in-band SSE rejection) | `errors.serverBusy` | "The vibe engine is busy right now. Please try again in a moment." | transient retry |
| Analysis watchdog fired (stuck run stopped) | terminal frame as `AI_TIMEOUT` | `errors.aiUnavailable` | "The vibe engine is unavailable right now. Please try again in a moment." | transient retry |
| Translation failed mid-locale-switch | (translate call failure) | `errors.translationFailed` | "We could not translate the result. Still showing the previous language." | "Retry translation" button |

Backend envelope copy (what appears in logs/API responses, not in the UI) lives in `apps/api/src/modules/ai/model/gemini.constants.ts` (e.g. "The vibe engine is busy right now (usage limit reached)…") and `apps/api/src/modules/game/model/game.messages.ts`.

## Support posture during an incident

- **Nothing is lost.** Twinzy persists nothing — a failed analyze is a retry, never data loss (`runbooks/ai-provider-outage.md` Mitigation).
- The correct player guidance is exactly what the copy says: try again in a moment. The UI's "Try again with the same photo" preserves their photo selection for transient errors.
- The error may include "Step that failed: {stage}." — during provider outages the failing stage is usually "Reading visible traits", "Finding public style/vibe matches...", or "Scoring and double-checking the matches..." (`game.stage.*`).
- Ready-to-send wording: [communication-templates.md](./communication-templates.md). Engineering procedure: [../runbooks/provider-outage.md](../runbooks/provider-outage.md) and [../runbooks/provider-rate-limiting.md](../runbooks/provider-rate-limiting.md).
- Open a known-issue entry for long-lived incidents ([known-issues.md](./known-issues.md)).
