---
id: support-localization-troubleshooting
title: Localization Troubleshooting — Language, RTL, and Translation Issues
type: support
authority: canonical
status: current
owner: repository owner
summary: Diagnosing wrong-language UI, Arabic/RTL layout questions, and result-translation failures.
keywords: [support, i18n, localization, arabic, rtl, translation, locale, cookie, next-intl]
contextTier: 2
relatedCode:
  [
    apps/web/src/packages/i18n/request.ts,
    apps/web/src/modules/game/hooks/useGame.hook.ts,
    apps/api/src/modules/ai/application/result-translation.service.ts,
  ]
relatedTests: [apps/web/e2e/game-translate.spec.ts]
relatedDocs: [support/user-visible-error-guide.md, docs/ai-safety.md]
readWhen: A player sees the wrong language, broken RTL, or a failed result translation.
---

# Localization Troubleshooting

## How localization works (facts)

- Two languages: **English and Arabic**; Arabic renders right-to-left. Locale is cookie-based (`NEXT_LOCALE`), no locale URL routing (`apps/web/src/packages/i18n/request.ts`); the header switcher writes the cookie and refreshes (`apps/web/src/modules/ui-preferences/`).
- Static UI copy comes from `apps/web/src/packages/i18n/messages/{en,ar}.json`. AI result content is localized **server-side**: the active language rides along as the multipart `languageCode` field, and the AI is required to answer in it (language echo enforced — `docs/ai-safety.md`).
- Switching language on an already-finished result calls the text-only translate endpoint (`POST /api/v1/game/translate-result`); the backend re-imposes every canonical field (names, ranks, scores, disclaimer) after translation (`apps/api/src/modules/ai/application/result-translation.service.ts`). The photo is never involved.

## Symptom → cause → answer

| Symptom | Likely cause | Answer / action |
| --- | --- | --- |
| UI appears in the wrong language | `NEXT_LOCALE` cookie state (cleared cookies, private window) | Use the header language switcher; the choice persists via cookie. |
| Result text stays in the old language after switching, with "We could not translate the result. Still showing the previous language." | Translate call failed (provider blip or timeout — the call is allowed up to 60 s, `AI_TRANSLATE_REQUEST_TIMEOUT_MS` in `apps/web/src/modules/game/model/game.constants.ts`) | Designed degradation: nothing is lost; the player presses "Retry translation" (`game.retryTranslation`). Sustained failures = provider incident → [../runbooks/provider-outage.md](../runbooks/provider-outage.md). |
| Translation overlay stuck on "Translating your result…" | Slow but live translation (real translations run 13–25 s per the timeout rationale in `game.constants.ts`) | Ask the player to wait up to a minute before judging it failed. |
| Arabic layout looks mirrored/odd in one component | RTL rendering issue — `dir` is set on `<html>` from the locale (`apps/web/src/app/layout.tsx`) | Genuine layout defects are bugs: collect a screenshot + browser info ([evidence-collection.md](./evidence-collection.md)) and file a defect. |
| Error page in English while the app is Arabic | Root-shell crash fallback — English-only by recorded exception EXC-0003 (`docs/exceptions/README.md`) | Expected for that one boundary; the crash itself is the thing to report. |
| Disclaimer language doesn't match the result language | Should never happen — the disclaimer is server-selected per language (`RESULT_DISCLAIMER_BY_LANGUAGE`, enforced in `apps/api/src/modules/result-aggregation/`) | Treat as a defect; escalate with the share/result evidence. |

## What support must never do

Never hand-translate or paraphrase result content for a player — all user-facing copy changes go through the i18n catalogs and review; safety-relevant wording is release-gated (see [known-issues.md](./known-issues.md) for the pending paywall copy revision).
