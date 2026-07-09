import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import {
  buildJpegPayload,
  mockAnalyzeSuccess,
  playHappyPathUntilAnalyze,
  setInputFile,
} from './helpers';

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
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
    await expect(page).toHaveScreenshot('game-results.png');
  });

  test('upload with selected file', async ({ page }) => {
    await page.goto('/game');
    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
    await expect(page).toHaveScreenshot('game-upload-selected.png');
  });
});
