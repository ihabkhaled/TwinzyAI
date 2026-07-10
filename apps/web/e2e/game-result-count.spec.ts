import { expect, test } from '@playwright/test';

import { DEFAULT_RESULT_COUNT, MAX_RESULT_COUNT, MIN_RESULT_COUNT } from '@twinzy/shared';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import {
  ANALYZE_ROUTE,
  buildJpegPayload,
  mockAnalyzeSuccess,
  playHappyPathUntilAnalyze,
  setInputFile,
  setResultCount,
  SUCCESS_STREAM,
  toEventStream,
} from './helpers';

test.describe('result-count selection', () => {
  test('result-count dropdown defaults to 10 and shows 1, 5, 10 options', async ({ page }) => {
    await page.goto('/game');

    const select = page.getByTestId(TEST_IDS.resultCountSelect);
    await expect(select).toHaveValue(String(DEFAULT_RESULT_COUNT));

    for (const value of [MIN_RESULT_COUNT, 5, MAX_RESULT_COUNT]) {
      await expect(select.locator(`option[value="${value}"]`)).toHaveCount(1);
    }
  });

  test('selecting 1 result sends resultCount=1 and renders one result', async ({ page }) => {
    await mockAnalyzeSuccess(page, MIN_RESULT_COUNT);
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await setResultCount(page, MIN_RESULT_COUNT);
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 2))).toBeHidden();
  });

  test('selecting 5 results renders exactly five ranked cards', async ({ page }) => {
    await mockAnalyzeSuccess(page, 5);
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await setResultCount(page, 5);
    await page.getByRole('button', { name: 'Analyze my vibe' }).click();

    for (let rank = 1; rank <= 5; rank += 1) {
      await expect(page.getByTestId(`result-card-${rank}`)).toBeVisible();
    }
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 6))).toBeHidden();
  });

  test('default 10 results render the full requested count', async ({ page }) => {
    await mockAnalyzeSuccess(page, DEFAULT_RESULT_COUNT);
    await page.goto('/game');

    await playHappyPathUntilAnalyze(page);

    for (let rank = 1; rank <= DEFAULT_RESULT_COUNT; rank += 1) {
      await expect(page.getByTestId(`result-card-${rank}`)).toBeVisible();
    }
  });

  test('analyze request body includes the selected result count', async ({ page }) => {
    await page.goto('/game');

    await setInputFile(page, '#game-photo-input', buildJpegPayload());
    await page.getByRole('checkbox').check();
    await setResultCount(page, 5);

    let capturedResultCount: number | undefined;
    await page.route(ANALYZE_ROUTE, async (route) => {
      const rawPostData = route.request().postData() ?? '';
      const match = /name="resultCount"\r?\n\r?\n(\d+)/.exec(rawPostData);
      capturedResultCount = match === null ? undefined : Number(match[1]);
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: toEventStream(SUCCESS_STREAM(5)),
      });
    });

    await page.getByRole('button', { name: 'Analyze my vibe' }).click();
    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();

    expect(capturedResultCount).toBe(5);
  });
});
