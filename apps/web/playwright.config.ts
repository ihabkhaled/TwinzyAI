import { defineConfig, devices } from '@playwright/test';

// Defaults to a dedicated port; set E2E_PORT=3000 to reuse an already-running
// `next dev` (the mocked backend is intercepted in the browser either way).
const E2E_PORT = Number(process.env['E2E_PORT'] ?? '3100');

const BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * E2E runs against the dev server with a MOCKED backend (page.route) —
 * real Gemini is never called. To run against a real backend instead:
 * start the api with valid GEMINI_* env, set E2E_REAL_BACKEND=true, and
 * remove the route mocks (documented in docs/docker-local-dev.md).
 *
 * Test suites are split by filename convention (all under ./e2e):
 *   - functional e2e:   *.spec.ts            (project "chromium")
 *   - accessibility:    *.a11y.spec.ts       (project "a11y",   `npm run test:a11y`)
 *   - visual regression:*.visual.spec.ts     (project "visual", `npm run test:visual`)
 * The a11y/visual projects are opt-in and pass when no matching spec exists yet
 * (root scripts pass --pass-with-no-tests), so they are ready for the incoming
 * accessibility/visual suites without blocking today's run.
 */

const A11Y_SPECS = /\.a11y\.spec\.ts$/;
const VISUAL_SPECS = /\.visual\.spec\.ts$/;

const IS_CI = process.env['CI'] === 'true' || process.env['CI'] === '1';

export default defineConfig({
  testDir: './e2e',
  // Local runs go wide for speed. CI runs SERIALLY (one worker): the tests share
  // a single dev server, and Next's on-demand compile serves a cookie-agnostic
  // cached render to concurrent requests, which races the theme/locale specs.
  // Serial execution is the reliable gate condition; retries absorb rare blips.
  fullyParallel: !IS_CI,
  // Only pin workers under CI; omit the key locally so Playwright picks its
  // default (exactOptionalPropertyTypes forbids assigning `undefined` here).
  ...(IS_CI && { workers: 1 }),
  retries: IS_CI ? 1 : 0,
  // CI also emits the html report so the gate's uploaded artifact has content.
  reporter: IS_CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev:e2e -- --port ${E2E_PORT}`,
    url: BASE_URL,
    // CI must always launch the server with the test-only public environment;
    // reusing a differently-configured server remounts the devtools launcher,
    // whose fixed button overflows a 320px viewport by 16px.
    reuseExistingServer: !IS_CI,
    // The documented e2e standard: the app runs as APP_ENV=test, which (among
    // other things) unmounts the ReactQueryDevtools floating launcher — its
    // logo overflows a 320px viewport by 16px and red-flagged the CI gate.
    // Same-origin mocked API calls avoid browser-specific CORS interception
    // differences; page.route still fulfills every backend request.
    env: {
      NEXT_PUBLIC_APP_ENV: 'test',
      NEXT_PUBLIC_API_BASE_URL: BASE_URL,
      NEXT_PUBLIC_PAYPAL_ME_USERNAME: 'twinzye2e',
      // Pin the paid-analysis paywall OFF for the whole e2e suite so the free
      // flow is exercised deterministically. Set explicitly (not just omitted)
      // because next.config's root-.env loader would otherwise inject the
      // developer's real client id; an already-set key always wins.
      NEXT_PUBLIC_PAYPAL_CLIENT_ID: '',
      NEXT_PUBLIC_PAYMOB_PUBLIC_KEY: '',
      NEXT_PUBLIC_ADSENSE_CLIENT_ID: '',
    },
    timeout: 180_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: [A11Y_SPECS, VISUAL_SPECS],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y',
      testMatch: A11Y_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: VISUAL_SPECS,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      testIgnore: [A11Y_SPECS, VISUAL_SPECS],
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-webkit',
      testIgnore: [A11Y_SPECS, VISUAL_SPECS],
      use: { ...devices['iPhone 13'] },
    },
  ],
});
