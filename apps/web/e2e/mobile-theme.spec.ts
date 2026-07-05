import { expect, test } from '@playwright/test';

import { mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

const MOBILE_VIEWPORTS = [
  { name: '320px', width: 320, height: 568 },
  { name: '375px', width: 375, height: 667 },
];

for (const viewport of MOBILE_VIEWPORTS) {
  test.describe(`mobile ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('full game flow works without horizontal scroll', async ({ page }) => {
      await mockAnalyzeSuccess(page);

      await page.goto('/');
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(scrollWidth).toBeLessThanOrEqual(1);

      const startLink = page.getByRole('link', { name: 'Start the game' });
      const box = await startLink.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

      await playHappyPathUntilAnalyze(page);
      await expect(page.getByText('Sample Star')).toBeVisible();

      const resultScrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(resultScrollWidth).toBeLessThanOrEqual(1);
    });
  });
}

test.describe('themes', () => {
  test('dark mode flow renders with dark background', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const background = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(background).toBe('rgb(19, 17, 28)');
  });

  test('light mode renders with light background', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');

    const background = await page.evaluate(
      () => getComputedStyle(document.documentElement).backgroundColor,
    );
    expect(background).toBe('rgb(248, 247, 252)');
  });
});
