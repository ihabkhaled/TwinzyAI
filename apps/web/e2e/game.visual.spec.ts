import { expect, test } from '@playwright/test';

import { buildJpegPayload, mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

test.describe('visual regression', () => {
  test('landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('landing.png');
  });

  test('game setup', async ({ page }) => {
    await page.goto('/game');
    await expect(page).toHaveScreenshot('game-setup.png');
  });

  test('game results', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');
    await playHappyPathUntilAnalyze(page);
    await expect(page.getByText('Sample Star 1')).toBeVisible();
    await expect(page).toHaveScreenshot('game-results.png');
  });

  test('upload with selected file', async ({ page }) => {
    await page.goto('/game');
    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
    await expect(page).toHaveScreenshot('game-upload-selected.png');
  });
});
