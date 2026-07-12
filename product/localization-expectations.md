---
id: product-localization-expectations
title: Localization Expectations (en + ar, RTL)
type: product
authority: canonical
status: current
owner: repository owner
summary: "Twinzy ships fully bilingual (English + Arabic with RTL); every user-facing string routes through i18n, AI content is localized server-side, and locale switch re-translates text-only."
keywords: [localization, i18n, arabic, rtl, locale, translation, bilingual, copy]
contextTier: 2
relatedCode: [apps/web/src/packages/i18n/messages/en.json, apps/web/src/packages/i18n/messages/ar.json, apps/web/src/packages/i18n/request.ts, packages/shared/src/schemas/language.schema.ts]
relatedTests: [apps/web/e2e/game-translate.spec.ts, apps/web/e2e/mobile-theme.spec.ts]
relatedDocs: [rules/12-i18n.md, rules/frontend/14-i18n-rtl.md, docs/eslint/no-raw-i18n-text.md]
readWhen: You are adding or changing any user-facing text, locale behavior, or RTL layout.
---

# Localization Expectations (en + ar, RTL)

Rule owners: [rules/12-i18n.md](../rules/12-i18n.md) (two-surface discipline) and
[rules/frontend/14-i18n-rtl.md](../rules/frontend/14-i18n-rtl.md) (frontend track). This file
states what the **product** commits to.

## Commitments

1. **Two first-class languages: English and Arabic; Arabic is RTL.** Catalogs live at
   [apps/web/src/packages/i18n/messages/en.json](../apps/web/src/packages/i18n/messages/en.json)
   and [ar.json](../apps/web/src/packages/i18n/messages/ar.json); the RTL set is
   `{ar}` ([apps/web/src/packages/i18n/locale.constants.ts](../apps/web/src/packages/i18n/locale.constants.ts)),
   and `dir` is mirrored onto `<html>` by the ui-preferences effects
   ([apps/web/src/modules/ui-preferences](../apps/web/src/modules/ui-preferences/index.ts)).
2. **Every user-facing string routes through i18n** — raw strings in TSX are lint errors
   (`frontend-architecture/no-raw-i18n-text`,
   [docs/eslint/no-raw-i18n-text.md](../docs/eslint/no-raw-i18n-text.md)). Recorded exception:
   the hardcoded English fallback copy used only when the i18n runtime itself has crashed
   (EXC-0003, [docs/exceptions/README.md](../docs/exceptions/README.md)).
3. **The backend never localizes and never returns sentences as contracts** — it returns
   stable `messageKey`s the frontend maps to localized copy
   ([rules/12-i18n.md](../rules/12-i18n.md) Part B). A new key ships with its dictionary entry
   in the same change.
4. **AI-generated content is localized server-side**: the active `languageCode` (`en`/`ar`,
   [packages/shared/src/schemas/language.schema.ts](../packages/shared/src/schemas/language.schema.ts))
   rides along every AI step and must be echoed back by the model
   ([docs/ai-safety.md](../docs/ai-safety.md)). The disclaimer and no-match fallback are fixed
   localized server texts ([game-rules.md](game-rules.md)).
5. **Locale switch translates the existing result in place, text-only** — the photo is never
   re-sent ([apps/web/src/modules/game/hooks/useResultTranslation.hook.ts](../apps/web/src/modules/game/hooks/useResultTranslation.hook.ts);
   e2e [apps/web/e2e/game-translate.spec.ts](../apps/web/e2e/game-translate.spec.ts)).
6. **Locale selection is a cookie, not a route** — `NEXT_LOCALE`, no locale prefix in URLs
   ([apps/web/src/packages/i18n/request.ts](../apps/web/src/packages/i18n/request.ts)).
7. **Safety applies in both languages**: the forbidden phrase/topic lists carry English and
   Arabic entries
   ([packages/shared/src/constants/safety.constants.ts](../packages/shared/src/constants/safety.constants.ts)).
8. **Copy parity is a release matter**: user-facing behavior changes must land in both
   catalogs in the same stream — the open paywall copy revision is explicitly required "in
   both languages"
   ([docs/features/paypal-donations-and-paid-results/22-go-no-go.md](../docs/features/paypal-donations-and-paid-results/22-go-no-go.md)).

## RTL specifics

Use start/end utilities, never left/right ([rules/12-i18n.md](../rules/12-i18n.md) Part A);
mobile QA covers both themes and RTL rendering
([docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md)).
