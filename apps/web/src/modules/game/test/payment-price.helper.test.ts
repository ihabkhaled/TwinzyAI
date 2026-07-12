import { describe, expect, it, vi } from 'vitest';

import { resolvePaymentPriceLabel } from '../helpers/payment-price.helper';

const envState = { value: '0.50', currency: 'USD' };

vi.mock('@/packages/env', () => ({
  publicEnv: {
    get paymentPriceValue(): string {
      return envState.value;
    },
    get paymentPriceCurrency(): string {
      return envState.currency;
    },
  },
}));

describe('resolvePaymentPriceLabel', () => {
  it('formats the env price + currency as a localized currency string', () => {
    envState.value = '0.50';
    envState.currency = 'USD';
    // en-US formatting of 0.50 USD is "$0.50"; assert the amount + a currency mark.
    const label = resolvePaymentPriceLabel();
    expect(label).toContain('0.50');
    expect(label).toMatch(/[$USD]/);
  });

  it('reflects a changed env price (the display is env-driven, not hardcoded)', () => {
    envState.value = '2.00';
    envState.currency = 'USD';
    expect(resolvePaymentPriceLabel()).toContain('2.00');
  });

  it('still renders the amount for an uncommon (but valid 3-letter) currency code', () => {
    envState.value = '1.00';
    envState.currency = 'ZZZ';
    // Intl uses the code itself as the symbol for unrecognized currencies.
    const label = resolvePaymentPriceLabel();
    expect(label).toContain('1.00');
    expect(label).toContain('ZZZ');
  });
});
