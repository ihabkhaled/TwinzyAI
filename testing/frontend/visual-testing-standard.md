# Frontend Visual Testing Standard (`apps/web`)

Visual tests catch rendering regressions that functional assertions cannot express: layout shifts,
token drift, RTL mirroring bugs, dark-theme contrast breaks. Specs live in
`apps/web/src/tests/visual/*.visual.ts` (suffix-matched by `apps/web/playwright.config.ts`) and run
with `npm run test:visual` against the mocked production server.

## What gets a screenshot

- Every routed page in `ROUTE_PATHS` gets a full-page baseline in its **ready** state (fixtures
  loaded — the gateway serves deterministic module mocks such as
  `apps/web/src/modules/<feature>/api/*.mock.ts`, so screenshots are stable by construction).
- The `/workbench` route is the design-system gate: it showcases every primitive in
  `apps/web/src/shared/components/primitives/`, so one screenshot set there covers `Button`,
  `Input`, `Card`, `Alert`, `Skeleton`, and friends without per-primitive specs. This is the visual
  arm of the "living workbench over Storybook" decision recorded under
  [architecture/adrs/](../../architecture/adrs/README.md).
- Distinct UI states that users actually reach (e.g. the upload-error state, the "no safe match"
  result) MAY get targeted element screenshots when a functional assertion cannot capture the
  regression risk.

## The capture matrix

Each screenshot spec MUST cover:

1. **Three viewports**, set via `page.setViewportSize` inside the spec (the config's single
   `chromium` project stays viewport-agnostic):
   - mobile `375×812`
   - tablet `768×1024`
   - desktop `1440×900`
2. **Both directions**: LTR (`en`) and RTL (`ar`). Direction is driven the way the app drives it —
   set the `NEXT_LOCALE` cookie (`LOCALE_COOKIE_NAME` from `apps/web/src/packages/i18n`) before
   navigation so `dir="rtl"` and the Arabic catalog render for real. RTL screenshots are where
   mirroring bugs live; skipping them is not permitted.
3. **Both themes**: default and dark (`[data-theme='dark']` per `apps/web/src/app/styles.css`
   tokens), toggled through the same mechanism as the ui-preferences store (root attribute), not by
   injecting ad-hoc CSS.

Name snapshots so the matrix is legible: `play-desktop-ar-dark.png` etc. Playwright appends the
platform suffix automatically.

## Diff tolerance

`apps/web/playwright.config.ts` sets the global gate:

```ts
expect: {
  toHaveScreenshot: {
    maxDiffPixelRatio: 0.02,
  },
},
```

At most 2% of pixels may differ. Do NOT raise this per-spec to silence a flaky screenshot — fix the
nondeterminism (animations, relative timestamps) instead. Relative-time output and animations MUST
be neutralized (fixed fixture dates handle the former; disable animations via reduced-motion
emulation for the latter). Twinzy never renders the uploaded photo from storage, so no screenshot
depends on user image content — baselines stay deterministic.

## Baseline management

- Baselines are committed to the repo next to the spec (Playwright's `*-snapshots/` directories).
  They are **per-platform**: Playwright suffixes snapshot names with browser and OS (e.g.
  `-chromium-linux.png`, `-chromium-win32.png`), and font rendering differs across OSes.
- **CI (Linux) baselines are the source of truth** because CI is the blocking gate. Generate or
  refresh them on the CI platform (or a matching Linux container), not from a Windows/macOS machine —
  cross-platform "updates" produce baselines CI can never match.

## Update flow

1. Make the intentional UI change.
2. Run `npm run test:visual` and inspect the HTML report diffs — confirm every diff is the change
   you intended and nothing else.
3. Regenerate: `npm run test:visual -- --update-snapshots` on the CI platform.
4. Commit the updated baselines **in the same PR as the UI change**, and call out the visual diff in
   the PR description so reviewers judge the screenshots, not just the code.

A baseline update commit with no corresponding source change is a red flag and MUST be rejected in
review. Regression depth is owned by the
[react-performance-reviewer](../../agents/react-performance-reviewer.md) and
[accessibility-reviewer](../../agents/accessibility-reviewer.md) for the states they cover.
