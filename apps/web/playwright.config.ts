import { defineConfig, devices } from '@playwright/test';

const E2E_PORT = 3100;

const BASE_URL = `http://localhost:${E2E_PORT}`;

/**
 * E2E runs against the dev server with a MOCKED backend (page.route) —
 * real Gemini is never called. To run against a real backend instead:
 * start the api with valid GEMINI_* env, set E2E_REAL_BACKEND=true, and
 * remove the route mocks (documented in docs/docker-local-dev.md).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  timeout: 60_000,
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
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
