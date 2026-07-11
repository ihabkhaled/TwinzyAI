import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import { mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

/**
 * The voluntary PayPal donate link (env-driven handle `twinzye2e`, set in
 * playwright.config webServer env). It must be a plain, safe outbound link:
 * hardcoded https://paypal.me origin, new tab, no opener access — and it must
 * never gate the result, which renders fully without any interaction with it.
 */
test.describe('donations', () => {
  test('navbar shows the donate link on every page, safely', async ({ page }) => {
    await page.goto('/');
    const navDonate = page.getByTestId(TEST_IDS.navDonateLink);
    await expect(navDonate).toBeVisible();
    await expect(navDonate).toHaveAttribute('href', 'https://paypal.me/twinzye2e');
    await expect(navDonate).toHaveAttribute('target', '_blank');
    await expect(navDonate).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(navDonate).toHaveAttribute('aria-label', 'Donate');

    await page.goto('/game');
    await expect(page.getByTestId(TEST_IDS.navDonateLink)).toBeVisible();
  });

  test('result page shows a safe voluntary PayPal link that never gates the result', async ({
    page,
  }) => {
    await mockAnalyzeSuccess(page);
    await playHappyPathUntilAnalyze(page);

    // The result is fully visible BEFORE any donate interaction — free stays free.
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.disclaimer)).toBeVisible();

    const donate = page.getByTestId(TEST_IDS.donateLink);
    await expect(donate).toBeVisible();
    await expect(donate).toHaveAttribute('href', 'https://paypal.me/twinzye2e');
    await expect(donate).toHaveAttribute('target', '_blank');
    await expect(donate).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(donate).toHaveText('Support Twinzy on PayPal (voluntary)');
  });
});
