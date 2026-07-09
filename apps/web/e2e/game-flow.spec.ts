import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import {
  buildJpegPayload,
  DISCLAIMER,
  mockAnalyzeFailure,
  mockAnalyzeSuccess,
  playHappyPathUntilAnalyze,
  setInputFile,
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

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await expect(analyzeButton).toBeDisabled();

    await page.getByRole('checkbox').check();
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();
    await expect(page.getByText('Style/vibe fit: 90%')).toBeVisible();
    await expect(page.getByText(DISCLAIMER)).toBeVisible();
    // V2: the compact summary chips + trait count render immediately…
    await expect(page.getByText('clear oval face')).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.traitCount)).toBeVisible();
    // …and the detailed traits reveal lazily through the accessible accordion.
    const firstCategory = page.getByRole('button', { name: 'Overall face' });
    await expect(page.getByText('observed overallFaceShape')).toBeHidden();
    await firstCategory.click();
    await expect(firstCategory).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('observed overallFaceShape')).toBeVisible();
  });

  test('invalid upload shows a friendly error and analyze stays disabled', async ({ page }) => {
    const tmpDir = path.resolve(__dirname, '../test-results');
    fs.mkdirSync(tmpDir, { recursive: true });
    const hugePath = path.join(tmpDir, 'twinzy-huge.jpg');
    fs.writeFileSync(hugePath, Buffer.alloc(6_000_000, 0xff));
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', hugePath);

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
