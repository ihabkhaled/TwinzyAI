> Superseded for apps/web by the frontend engineering track in [rules/frontend/](frontend/README.md). Retained for backend/monorepo cross-reference.

# 13 — Accessibility

> Related: [00-non-negotiable-rules.md](./00-non-negotiable-rules.md) (rule 50) · [02-frontend-components-tsx.md](./02-frontend-components-tsx.md) · [12-i18n.md](./12-i18n.md) (RTL) · [09-testing-coverage.md](./09-testing-coverage.md) (e2e) · [/skills/accessibility-review.md](../skills/accessibility-review.md)

- jsx-a11y rules are errors. Labels on all inputs (file input included), alt text, roles.
- Touch targets at least 44px; visible focus states; skip-to-content link; logical heading order.
- prefers-reduced-motion respected globally; color contrast AA in both themes.
- E2E includes an axe accessibility smoke test.
