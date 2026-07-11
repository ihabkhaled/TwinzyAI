import { expect, test } from '@playwright/test';

import { TEST_IDS } from '../src/shared/constants/test-ids.constants';
import { buildIndexedTestId } from '../src/shared/testing/test-id.helper';

import { mockAnalyzeSuccess, playHappyPathUntilAnalyze } from './helpers';

/**
 * The paid-analysis paywall is gated by the PUBLIC PayPal client id, which is
 * baked at build time. The default e2e webServer runs with NO client id, so the
 * paywall is OFF and the free game must be completely unaffected: the payment
 * step never appears and the happy path reaches the result directly.
 *
 * The paywall-ON UI (payment step + PayPal buttons + createOrder/onApprove) is
 * covered deterministically by unit tests (usePaymentFlow, PaymentStep) since
 * the real Buttons SDK cannot load headlessly; the server capture/refund
 * security is covered by the API integration + unit tests and the live PayPal
 * sandbox verification (docs/features/paypal-donations-and-paid-results/).
 */
test.describe('paywall off by default (free game unaffected)', () => {
  test('no payment step appears and the result shows directly', async ({ page }) => {
    await mockAnalyzeSuccess(page);
    await playHappyPathUntilAnalyze(page);

    await expect(page.getByTestId(buildIndexedTestId(TEST_IDS.resultCard, 1))).toBeVisible();
    await expect(page.getByTestId(TEST_IDS.paymentStep)).toHaveCount(0);
    await expect(page.getByTestId(TEST_IDS.paypalButtons)).toHaveCount(0);
  });
});
