import { expect, test } from '@playwright/test';

import { ANALYZE_ROUTE, buildJpegPayload, setInputFile } from './helpers';

test.describe('cancel during processing', () => {
  test('cancelling an in-flight run returns to setup with no error shown', async ({ page }) => {
    // Hold the analyze request in-flight so the processing screen (with its
    // cancel action) stays up; clicking cancel aborts the fetch client-side.
    await page.route(ANALYZE_ROUTE, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      try {
        await route.abort('failed');
      } catch {
        // The browser already aborted the request on cancel — nothing to clean up.
      }
    });

    await page.goto('/game');
    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    const cancel = page.getByTestId('cancel-processing');
    await expect(cancel).toBeVisible();
    await cancel.click();

    // A cancelled run is NOT a failure: the setup screen comes back and no
    // error surface is ever rendered.
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeVisible();
    await expect(page.getByTestId('error-state')).toHaveCount(0);
  });
});
