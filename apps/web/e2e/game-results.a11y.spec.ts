import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

test.describe('results accessibility', () => {
  test('results state has no serious axe violations', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');
    await playHappyPathUntilAnalyze(page);
    await expect(page.getByText('Sample Star 1')).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });

  test('result accordion is keyboard operable', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await page.goto('/game');
    await playHappyPathUntilAnalyze(page);

    const firstCategory = page.getByRole('button', { name: 'Overall face' });
    await expect(firstCategory).toHaveAttribute('aria-expanded', 'false');
    await firstCategory.focus();
    await page.keyboard.press('Enter');
    await expect(firstCategory).toHaveAttribute('aria-expanded', 'true');
  });
});
