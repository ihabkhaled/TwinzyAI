---
id: product-accessibility-expectations
title: Accessibility Expectations
type: product
authority: canonical
status: current
owner: repository owner
summary: "What the product commits to for accessibility: labeled inputs, 44px touch targets, visible focus, skip link, reduced motion, AA contrast in both themes, RTL, and axe e2e smoke tests."
keywords: [accessibility, a11y, axe, contrast, focus, touch-targets, reduced-motion, skip-link, wcag]
contextTier: 2
relatedCode: [apps/web/src/shared/components/primitives, apps/web/src/app/layout.tsx]
relatedTests: [apps/web/e2e/game-results.a11y.spec.ts, apps/web/e2e/pwa-a11y.spec.ts]
relatedDocs: [rules/13-accessibility.md, rules/frontend/13-accessibility.md, testing/frontend/accessibility-testing-standard.md]
readWhen: You are building or reviewing any UI and need the accessibility bar the product commits to.
---

# Accessibility Expectations

Rule owners: [rules/13-accessibility.md](../rules/13-accessibility.md) (baseline; superseded
for `apps/web` by the frontend track) and
[rules/frontend/13-accessibility.md](../rules/frontend/13-accessibility.md). Test standard:
[testing/frontend/accessibility-testing-standard.md](../testing/frontend/accessibility-testing-standard.md).
This file states the product commitments; the rule files own the how.

## What the product commits to

Per [rules/13-accessibility.md](../rules/13-accessibility.md):

- **jsx-a11y rules are errors** — labels on all inputs (the file input included), alt text,
  correct roles. The image wrapper makes `alt` a compile-time requirement
  ([apps/web/src/packages/image](../apps/web/src/packages/image)).
- **Touch targets at least 44px**, visible focus states, a skip-to-content link (rendered in
  the root layout, [apps/web/src/app/layout.tsx](../apps/web/src/app/layout.tsx)), logical
  heading order.
- **`prefers-reduced-motion` respected globally**; **color contrast AA in both themes**
  (light/dark theming owned by
  [apps/web/src/modules/ui-preferences](../apps/web/src/modules/ui-preferences/index.ts)).
- **RTL is part of accessibility**: start/end utilities, never left/right
  ([localization-expectations.md](localization-expectations.md)).
- **Mobile is the primary device class**: 320px-and-up layouts with no horizontal scroll
  ([docs/mobile-pwa-standards.md](../docs/mobile-pwa-standards.md)).

## How it is verified

- A dedicated Playwright **a11y project** runs `@axe-core/playwright` suites
  (`*.a11y.spec.ts`): [apps/web/e2e/game-results.a11y.spec.ts](../apps/web/e2e/game-results.a11y.spec.ts)
  and [apps/web/e2e/pwa-a11y.spec.ts](../apps/web/e2e/pwa-a11y.spec.ts).
- Interactive dialogs implement keyboard behavior explicitly — e.g. the share modal is
  `role=dialog` with Escape-close
  ([apps/web/src/modules/game/containers/share-modal.container.tsx](../apps/web/src/modules/game/containers/share-modal.container.tsx)).
- Grouped detailed traits use an accessible Accordion primitive
  (aria-expanded/aria-controls/keyboard) added for the V2 traits UI
  ([docs/features/advanced-global-traits-v2/01-business-analysis.md](../docs/features/advanced-global-traits-v2/01-business-analysis.md);
  primitive in [apps/web/src/packages/ui-primitives](../apps/web/src/packages/ui-primitives)).
- Real-device manual QA covers 320/375/414px in both themes
  ([docs/manual-qa-checklist.md](../docs/manual-qa-checklist.md)).

## Scope note

Not applicable — a formal WCAG conformance statement/audit level: no such artifact exists in
the repository; the enforced bar is the rule set + axe suites above. Accepted by the
repository owner via the rule files.
