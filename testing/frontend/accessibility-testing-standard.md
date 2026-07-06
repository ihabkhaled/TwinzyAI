# Frontend Accessibility Testing Standard (`apps/web`)

Accessibility is verified by two automated spec kinds plus a manual checklist. Automated specs live
in `apps/web/src/tests/accessibility/*.a11y.ts` (Playwright, matched by the `*.a11y.ts` suffix in
`apps/web/playwright.config.ts`) and run with `npm run test:a11y` against the same mocked production
server as e2e ([e2e-testing-standard.md](e2e-testing-standard.md)).

## Axe gate

Every routed page in `ROUTE_PATHS` (`apps/web/src/shared/constants` — the marketing landing,
how-to-play, privacy, terms, the play flow, and settings) MUST have an axe scan spec using
`@axe-core/playwright`:

```ts
const results = await new AxeBuilder({ page }).analyze();
const blocking = results.violations.filter(
  (violation) => violation.impact === 'serious' || violation.impact === 'critical',
);
expect(blocking).toEqual([]);
```

- **Gate rule: zero `serious` and zero `critical` violations.** These impact levels are axe's
  classification for issues that make content unusable for some users (`critical`, e.g. images
  without alternatives, form fields without accessible names) or severely degrade the experience
  (`serious`, e.g. insufficient color contrast, focus not visible). They block merge.
- `moderate` and `minor` findings do not block, but MUST be triaged: fix them or record a reasoned
  exception in the feature's QA/accessibility artifact.
- Scans MUST run in both themes (default and `[data-theme='dark']` — contrast regressions are
  theme-specific) and SHOULD run in both directions for RTL-sensitive pages (locale `ar`,
  `dir="rtl"`), matching the matrix in [visual-testing-standard.md](visual-testing-standard.md).
- Rule exclusions in `AxeBuilder` (e.g. `.disableRules(...)`) are treated exactly like
  `eslint-disable`: forbidden without a documented, reviewed exception.

## Keyboard specs

Axe cannot prove interaction, so each interactive flow gets a keyboard-only spec:

- Tab order reaches every interactive element in visual order; nothing focusable is hidden and
  nothing visible is unreachable.
- The play flow's upload-consent form (consent checkbox → file input → submit) is completable with
  keyboard alone: `Tab` traversal, `Enter`/`Space` activate.
- Skip-to-content and landmark navigation work: landmark targets use `LANDMARK_IDS` from
  `apps/web/src/shared/accessibility` — assert focus actually moves, not just that the link exists.
- Focus is never trapped, and after async state changes (upload error alert, toast via
  `apps/web/src/packages/toast`) focus and announcement behavior is asserted (`role="alert"` /
  `aria-live` content is visible to the accessibility tree).

Keyboard specs use `page.keyboard.press('Tab')` plus `toBeFocused()` assertions — never synthetic
`focus()` calls that skip real traversal.

## Manual checklist (complements, never replaces automation)

Automation catches roughly a third of WCAG issues. Before release
([docs/sdlc/release-checklist.md](../../docs/sdlc/release-checklist.md)), a human verifies per
changed screen:

1. Screen-reader pass: headings, landmarks, and controls are announced meaningfully.
2. 200% browser zoom: no clipped content, no horizontal scroll on text content.
3. `prefers-reduced-motion` respected (facade: `prefersReducedMotion` in
   `apps/web/src/packages/browser`).
4. Visible focus indicator on every interactive element, in both themes.
5. RTL (`ar` locale): reading order, icon mirroring, and focus order remain coherent.

Decision history lives in
[memory/frontend/accessibility-decisions.md](../../memory/frontend/accessibility-decisions.md);
rulebook version in [rules/frontend/13-accessibility.md](../../rules/frontend/13-accessibility.md);
authoring depth is owned by the [accessibility-reviewer](../../agents/accessibility-reviewer.md).
