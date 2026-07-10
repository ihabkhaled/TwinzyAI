import type { Page } from '@playwright/test';

/** Document-level horizontal overflow in CSS pixels. */
export const measureHorizontalOverflow = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
