import { expect, test } from '@playwright/test';

import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import { buildJpegPayload, mockAnalyzeSuccess, setInputFile } from './helpers';

test.describe('streaming progress', () => {
  test('analyze streams the final result successfully', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByTestId('result-card-1')).toBeVisible();
  });

  test('navigating away during streaming does not crash the app', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();
    await expect(page.getByTestId('result-card-1')).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your public vibe match' })).toBeVisible();
  });
});
