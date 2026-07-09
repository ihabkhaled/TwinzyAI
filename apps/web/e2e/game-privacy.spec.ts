import { expect, test } from '@playwright/test';

import { buildJpegPayload, mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

test.describe('privacy', () => {
  test('refresh does not resurface the uploaded image or result', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByTestId('result-card-1')).toBeVisible();

    await page.reload();
    await expect(page.getByTestId('result-card-1')).toBeHidden();
    await expect(page.locator('#game-photo-input')).toHaveValue('');
  });

  test('retry clears the image and previous results', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByTestId('result-card-1')).toBeVisible();

    await page.getByRole('button', { name: 'Try another photo' }).click();
    await expect(page.getByTestId('result-card-1')).toBeHidden();
    await expect(page.locator('#game-photo-input')).toHaveValue('');
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
  });

  test('disclaimer is always visible near results', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByTestId('disclaimer')).toBeVisible();
  });
});
