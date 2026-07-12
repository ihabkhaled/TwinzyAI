<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: i18n catalogs, RTL, language behavior

Task type: `localization-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Every string ships in en AND ar together; no hardcoded copy in TSX.
- Message keys are named constants; RTL correctness is part of done.
- AI result language is enforced by the response-language guard, not trust.

## Must-read docs

- rules/12-i18n.md — > Two surfaces, one discipline: the **frontend** renders every user-facing string from the typed dictionary; the **backend** never returns human sentences as a contract — it returns stable `messageKey`s the frontend maps to localized cop... (~939 tokens)
- rules/frontend/14-i18n-rtl.md — Every user-visible string is translated, and every layout works mirrored. English (`en`) and Arabic (~904 tokens)

## Rules

- rules/12-i18n.md — > Two surfaces, one discipline: the **frontend** renders every user-facing string from the typed dictionary; the **backend** never returns human sentences as a contract — it returns stable `messageKey`s the frontend maps to localized cop... (~939 tokens)

## Skills

- skills/add-i18n-message-key.md

## Reviewers

- agents/i18n-rtl-reviewer.md

## Code entrypoints

- `apps/web/src/packages/i18n/`

## Validation before done

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`

## Notes

Catalogs live in apps/web/src/packages/i18n/messages/. Payment/consent copy is owner-sensitive — see product/user-facing-copy-principles.md.
