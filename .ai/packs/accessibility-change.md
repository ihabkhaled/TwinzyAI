<!-- GENERATED FILE — do not edit by hand.
     Rebuild: npm run knowledge:build
     Sources: knowledge/context-budget-policy.yaml, knowledge/packs.yaml, knowledge/routing-map.yaml -->

# Context pack: A11y behavior and audits

Task type: `accessibility-change` · Lane: **standard** · Load after `.ai/BOOTSTRAP.md`.

## Invariants for this area

- Keyboard and focus behavior are mandatory for interactive flows.
- a11y assertions live in e2e/component tests (npm run test:a11y).
- RTL (Arabic) layouts must stay correct alongside a11y changes.

## Must-read docs

- rules/13-accessibility.md — > Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference. (~200 tokens)
- rules/frontend/13-accessibility.md — Target: WCAG 2.2 AA. Accessibility is verified by an automated axe gate plus the review checklist — (~905 tokens)

## Rules

- rules/13-accessibility.md — > Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference. (~200 tokens)

## Skills

- skills/accessibility-review.md
- skills/write-accessibility-tests.md

## Reviewers

- agents/accessibility-reviewer.md

## Validation before done

- `npm run test:a11y`
- `npm run test:e2e`

## Notes

Strict jsx-a11y is part of the lint gate; do not work around it with role/aria misuse — fix the semantics.
