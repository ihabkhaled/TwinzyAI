import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('PWA smoke', () => {
  test('manifest is linked and installable-shaped', async ({ page, request }) => {
    await page.goto('/');

    const manifestLink = page.locator('link[rel="manifest"]').first();
    await expect(manifestLink).toHaveAttribute('href', /webmanifest/);

    const manifestHref = await manifestLink.getAttribute('href');
    const response = await request.get(String(manifestHref));
    expect(response.ok()).toBe(true);

    const manifest = (await response.json()) as Record<string, unknown>;
    expect(manifest['short_name']).toBe('Twinzy');
    expect(manifest['display']).toBe('standalone');
    expect(Array.isArray(manifest['icons'])).toBe(true);
  });

  test('viewport and theme-color meta are present', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
      'content',
      /width=device-width/,
    );
    expect(await page.locator('meta[name="theme-color"]').count()).toBeGreaterThan(0);
  });
});

test.describe('accessibility smoke', () => {
  test('landing page has no serious axe violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });

  test('game page has no serious axe violations', async ({ page }) => {
    await page.goto('/game');

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });
});
