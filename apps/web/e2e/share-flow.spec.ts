import { expect, test } from '@playwright/test';

import {
  mockAnalyzeSuccess,
  mockShareCreate,
  mockShareGetActive,
  mockShareGetExpired,
  playHappyPathUntilAnalyze,
  SHARE_ID,
} from './helpers';

test.describe('temporary shareable results (mocked backend)', () => {
  // The share page reads its result via a cross-origin JSON XHR (web:3000 →
  // api:4000). Playwright's route-mock of that preflighted XHR is reliable on
  // Blink but leaves the request pending under WebKit in reuse-mode, so this
  // suite runs on the Chromium engines (which cover the flow end-to-end); the
  // WebKit engine is exercised by the game-flow suite. The share logic itself
  // is fully covered by the unit + integration suites.
  test.skip(({ browserName }) => browserName === 'webkit', 'WebKit XHR route-mock is flaky here');

  test('create a share link from a result, then open it on the public page', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await mockShareCreate(page);
    await mockShareGetActive(page);

    await playHappyPathUntilAnalyze(page);
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();

    // Open the share modal from the result screen.
    await page.getByTestId('share-button').click();
    const modal = page.getByTestId('share-modal');
    await expect(modal).toBeVisible();

    // The temporary link + platform buttons are present; the link carries the id.
    await expect(page.getByTestId('share-link-input')).toHaveValue(
      `http://localhost/share/${SHARE_ID}`,
    );
    await expect(page.getByTestId('copy-link-button')).toBeVisible();
    await expect(page.getByTestId('share-platform-link-whatsapp')).toBeVisible();
    await expect(page.getByTestId('share-platform-link-telegram')).toBeVisible();

    // Opening the share URL shows the result, a live countdown, and a CTA.
    await page.goto(`/share/${SHARE_ID}`);
    await expect(page.getByTestId('share-page')).toBeVisible();
    await expect(page.getByTestId('share-countdown')).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toBeVisible();
    await expect(page.getByTestId('create-own-result')).toBeVisible();
    // The uploaded image is never shown on the share page. Element-level on
    // purpose: a photo would render as an <img>; accessible icon SVGs carry
    // role=img and are fine.
    await expect(page.locator('img')).toHaveCount(0);
  });

  test('a direct visit to an expired/unknown link shows the not-found state', async ({ page }) => {
    await mockShareGetExpired(page);

    await page.goto(`/share/${SHARE_ID}`);

    await expect(page.getByTestId('share-not-found')).toBeVisible();
    await expect(page.getByText('Sample Star 1', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('create-own-result')).toBeVisible();
  });

  test('the share page fits a 320px mobile viewport without horizontal scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await mockShareGetActive(page);

    await page.goto(`/share/${SHARE_ID}`);
    await expect(page.getByTestId('share-page')).toBeVisible();

    // Body must not be wider than the viewport (allowing 1px rounding).
    const bodyBox = await page.locator('body').boundingBox();
    expect(bodyBox?.width ?? 0).toBeLessThanOrEqual(321);
  });
});
