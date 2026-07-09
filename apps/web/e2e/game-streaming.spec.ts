import { expect, test } from '@playwright/test';

import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import { buildJpegPayload, mockAnalyzeSuccess } from './helpers';

test.describe('streaming progress', () => {
  test('processing card is shown while the pipeline runs and ends with the result', async ({
    page,
  }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByTestId('processing')).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
  });

  test('intermediate trait summary and candidate names render as they stream', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByText('clear oval face')).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
  });

  test('navigating away during streaming does not crash the app', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();
    await expect(page.getByTestId('processing')).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your public vibe match' })).toBeVisible();
  });
});
