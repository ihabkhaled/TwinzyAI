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

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev:e2e`,
    url: BASE_URL,
    reuseExistingServer: true,
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
  ],
});
