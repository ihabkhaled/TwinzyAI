import { expect, test } from '@playwright/test';

import { mockAnalyzeSuccess, mockTranslateSuccess, playHappyPathUntilAnalyze } from './helpers';

test.describe('result translation', () => {
  test('switching language translates the result without re-uploading', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockTranslateSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();

    await page.getByTestId('locale-switch').click();
    await expect(page.getByTestId('translation-banner')).toBeVisible();
    await expect(page.getByText('تطابق أسلوبي عام')).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
  });

  test('Arabic translation preserves canonical names, ranks, and scores', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockTranslateSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);

    await page.getByTestId('locale-switch').click();
    await expect(page.getByTestId('translation-banner')).toBeHidden();

    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
    await expect(page.getByText('#1')).toBeVisible();
    await expect(page.getByText('90%')).toBeVisible();
  });
});
