import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import { mockAnalyzeSuccess, mockTranslateSuccess, playHappyPathUntilAnalyze } from './helpers';

test.describe('result translation', () => {
  test('switching language translates the result without re-uploading', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockTranslateSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();

    await page.getByTestId(TEST_IDS.localeSwitch).selectOption('ar');
    await expect(
      page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1)).getByText('تطابق أسلوبي عام'),
    ).toBeVisible();
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();
  });

  test('Arabic translation preserves canonical names, ranks, and scores', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockTranslateSuccess(page);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);

    await page.getByTestId(TEST_IDS.localeSwitch).selectOption('ar');
    await expect(page.getByTestId(TEST_IDS.translationBanner)).toBeHidden();

    const firstCard = page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1));
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByText('Match #1')).toBeVisible();
    await expect(firstCard.getByText('90%')).toBeVisible();
  });
});
