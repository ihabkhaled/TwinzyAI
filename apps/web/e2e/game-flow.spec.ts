import { expect, test } from '@playwright/test';

import {
  buildJpegPayload,
  DISCLAIMER,
  mockAnalyzeFailure,
  mockAnalyzeSuccess,
  playHappyPathUntilAnalyze,
} from './helpers';

test.describe('game flow (mocked backend)', () => {
  test('happy path: land, consent, upload, analyze, results with disclaimer', async ({ page }) => {
    await mockAnalyzeSuccess(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find your public vibe match' })).toBeVisible();
    await page.getByRole('link', { name: 'Start the game' }).click();

    await expect(page.getByText('We do not store your photo', { exact: false })).toBeVisible();

    const analyzeButton = page.getByRole('button', { name: 'Analyze my vibe' });
    await expect(analyzeButton).toBeDisabled();

    await page.locator('#game-photo-input').setInputFiles(buildJpegPayload());
    await expect(analyzeButton).toBeDisabled();

    await page.getByRole('checkbox').check();
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    await expect(page.getByTestId('result-card-1')).toBeVisible();
    await expect(page.getByText('Style/vibe fit: 90%')).toBeVisible();
    await expect(page.getByText(DISCLAIMER)).toBeVisible();
    // V2: the compact summary chips + trait count render immediately…
    await expect(page.getByText('clear oval face')).toBeVisible();
    await expect(page.getByTestId('trait-count')).toBeVisible();
    // …and the detailed traits reveal lazily through the accessible accordion.
    const firstCategory = page.getByRole('button', { name: 'Overall face' });
    await expect(page.getByText('observed overallFaceShape')).toBeHidden();
    await firstCategory.click();
    await expect(firstCategory).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('observed overallFaceShape')).toBeVisible();
  });

  test('invalid upload shows a friendly error and analyze stays disabled', async ({ page }) => {
    await page.goto('/game');

    await page.locator('#game-photo-input').setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('MZ-not-an-image'),
    });

    await expect(
      page.getByText('That photo could not be uploaded. Please try a different one.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
  });

  test('API failure shows a friendly message and retry resets the flow', async ({ page }) => {
    await mockAnalyzeFailure(page);
    await playHappyPathUntilAnalyze(page);

    await expect(
      page.getByText('The vibe engine is unavailable right now', { exact: false }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Try another photo' }).click();

    // Back to setup: file cleared, so analyze is disabled again.
    await expect(page.getByRole('button', { name: 'Analyze my vibe' })).toBeDisabled();
    await expect(page.locator('#game-photo-input')).toHaveValue('');
  });
});
