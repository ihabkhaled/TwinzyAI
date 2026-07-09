import { expect, test } from '@playwright/test';

import { DEFAULT_RESULT_COUNT } from '@twinzy/shared';

import { buildJpegPayload, mockAnalyzeSuccess } from './helpers';

test.describe('streaming progress', () => {
  test('all pipeline stages are announced during the stream', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByText('Checking your photo')).toBeVisible();
    await expect(page.getByText('Reading visible traits')).toBeVisible();
    await expect(page.getByText('Finding public style/vibe matches')).toBeVisible();
    await expect(page.getByText('Scoring and double-checking')).toBeVisible();
    await expect(page.getByText('Preparing your result')).toBeVisible();
    await expect(page.getByText('Sample Star 1')).toBeVisible();
  });

  test('trait summary and candidate names render as intermediate payloads', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByText('clear oval face')).toBeVisible();
    await expect(page.getByText('Sample Star 1')).toBeVisible();
  });

  test('navigating away during streaming does not crash the app', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();
    await expect(page.getByText('validating')).toBeVisible();

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your public vibe match' })).toBeVisible();
  });
});
