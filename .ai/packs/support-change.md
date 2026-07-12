<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: Support docs, troubleshooting, FAQs, known issues

Task type: `support-change` · Lane: **fast** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Support docs state what the code does today, with error codes and i18n keys cited.
- Known issues carry an owner and a status, never open-ended.

## Must-read docs

- support/README.md — The support model for Twinzy and the index of all support enablement docs, FAQs, troubleshooting guides, and templates. (~1265 tokens)

## Rules

- rules/23-review-checklist.md — > The consolidated review gate. Every box is checked or justified `N/A` before a change merges. This is the gate, not the spec — each section links to its canonical rule file. A green build is **not** proof of correctness: lint green is ... (~1562 tokens)

## Code entrypoints

- `support/`

## Validation before done

- `npm run knowledge:validate`

## Notes

support/error-code-catalog.md maps user-visible errors; keep it in sync with shared error constants when codes change.
