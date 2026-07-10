import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import {
  mockAnalyzeSuccess,
  mockShareCreate,
  mockShareGetActive,
  mockShareGetExpired,
  playHappyPathUntilAnalyze,
  SHARE_ID,
} from './helpers';
import { measureHorizontalOverflow } from './viewport.helper';

test.describe('temporary shareable results (mocked backend)', () => {
  test('create a share link from a result, then open it on the public page', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockShareCreate(page);
    await mockShareGetActive(page);

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();

    // Open the share modal from the result screen.
    await page.getByTestId(TEST_IDS.shareButton).click();
    const modal = page.getByTestId(TEST_IDS.shareModal);
    await expect(modal).toBeVisible();

    // The temporary link + platform buttons are present; the link carries the id.
    await expect(page.getByTestId(TEST_IDS.shareLinkInput)).toHaveValue(
      `http://localhost/share/${SHARE_ID}`,
    );
    await expect(page.getByTestId(TEST_IDS.copyLinkButton)).toBeVisible();
    await expect(
      page.getByTestId(buildIndexedTestId(TEST_IDS.sharePlatformLink, 'whatsapp')),
    ).toBeVisible();
    await expect(
      page.getByTestId(buildIndexedTestId(TEST_IDS.sharePlatformLink, 'telegram')),
    ).toBeVisible();

    // Opening the share URL shows the result, a live countdown, and a CTA.
    await page.goto(`/share/${SHARE_ID}`);
    await expect(page.getByTestId(TEST_IDS.sharePage)).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.shareCountdown)).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.createOwnResult)).toBeVisible();
    // The uploaded image is never shown on the share page. Element-level on
    // purpose: a photo would render as an <img>; accessible icon SVGs carry
    // role=img and are fine.
    await expect(page.locator('img')).toHaveCount(0);
  });

  test('a direct visit to an expired/unknown link shows the not-found state', async ({ page }) => {
    await mockShareGetExpired(page);

    await page.goto(`/share/${SHARE_ID}`);

    await expect(page.getByTestId(TEST_IDS.shareNotFound)).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId(TEST_IDS.createOwnResult)).toBeVisible();
  });

  test('the share page fits a 320px mobile viewport without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await mockShareGetActive(page);

    await page.goto(`/share/${SHARE_ID}`);
    await expect(page.getByTestId(TEST_IDS.sharePage)).toBeVisible();

    expect(await measureHorizontalOverflow(page)).toBeLessThanOrEqual(1);
  });
});
