import { expect, test } from '@playwright/test';

import {
  buildJpegPayload,
  mockAnalyzeOversized,
  mockAnalyzeSafety,
  mockAnalyzeTimeout,
  playHappyPathUntilAnalyze,
  SUCCESS_STREAM,
  toEventStream,
} from './helpers';

test.describe('error states', () => {
  test('oversized file shows the backend validation error UX', async ({ page }) => {
    await mockAnalyzeOversized(page);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByText('That photo could not be uploaded')).toBeVisible();
  });

  test('model timeout shows a friendly retryable message', async ({ page }) => {
    await mockAnalyzeTimeout(page);
    await playHappyPathUntilAnalyze(page);

    await expect(
      page.getByText('The vibe engine is unavailable right now', { exact: false }),
    ).toBeVisible();
  });

  test('safety-filtered output shows the unsafe response UX', async ({ page }) => {
    await mockAnalyzeSafety(page);
    await playHappyPathUntilAnalyze(page);

    await expect(
      page.getByText('The vibe engine is unavailable right now', { exact: false }),
    ).toBeVisible();
  });

  test('network failure shows a friendly message and retry resets the flow', async ({ page }) => {
    await page.route('**/api/v1/game/analyze/stream', (route) => route.abort('failed'));
    await playHappyPathUntilAnalyze(page);

    await expect(page.getByTestId('error-state')).toBeVisible();
    await page.getByRole('button', { name: 'Try another photo' }).click();
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
  });

  test('recoverable API failure can be retried into a success', async ({ page }) => {
    let first = true;
    await page.route('**/api/v1/game/analyze/stream', async (route) => {
      if (first) {
        first = false;
        await route.fulfill({
          status: 200,
          contentType: 'text/event-stream',
          body: toEventStream([
            { event: 'accepted' },
            { event: 'error', errorCode: 'AI_PROVIDER_UNAVAILABLE', message: 'down' },
          ]),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: toEventStream(SUCCESS_STREAM()),
      });
    });
    await playHappyPathUntilAnalyze(page);

    await expect(
      page.getByText('The vibe engine is unavailable right now', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Try another photo' }).click();
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();
    await expect(page.getByText('Sample Star 1')).toBeVisible();
  });
});
