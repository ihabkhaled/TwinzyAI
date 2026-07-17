import { describe, expect, it } from 'vitest';

import { DEFAULT_LANGUAGE_CODE, PaymentGateway } from '@twinzy/shared';

import { buildAnalyzeFormData } from '../gateway/game-form-data.builder';

import { buildImageFile } from './game-fixtures';

/**
 * The builder owns which payment fields land on the multipart body per gateway.
 * These tests pin that branching: a free run carries no payment fields, and each
 * gateway appends exactly its own binding (Paymob ids stringified from numbers).
 */
describe('buildAnalyzeFormData', () => {
  const file = buildImageFile();

  it('appends the image, consent, language, and result count for a free run', () => {
    const form = buildAnalyzeFormData(file, DEFAULT_LANGUAGE_CODE, 5);

    expect(form.get('image')).toBeInstanceOf(File);
    expect(form.get('consent')).toBe('true');
    expect(form.get('languageCode')).toBe(DEFAULT_LANGUAGE_CODE);
    expect(form.get('resultCount')).toBe('5');
    expect(form.has('paymentGateway')).toBe(false);
    expect(form.has('paypalOrderId')).toBe(false);
    expect(form.has('paymobOrderId')).toBe(false);
  });

  it('appends the PayPal gateway + order id for a PayPal-paid run', () => {
    const form = buildAnalyzeFormData(file, DEFAULT_LANGUAGE_CODE, 3, {
      paymentGateway: PaymentGateway.Paypal,
      paypalOrderId: 'ORDER123',
    });

    expect(form.get('paymentGateway')).toBe(PaymentGateway.Paypal);
    expect(form.get('paypalOrderId')).toBe('ORDER123');
    expect(form.has('paymobOrderId')).toBe(false);
  });

  it('appends the Paymob gateway + stringified order and transaction ids', () => {
    const form = buildAnalyzeFormData(file, DEFAULT_LANGUAGE_CODE, 3, {
      paymentGateway: PaymentGateway.Paymob,
      paymobOrderId: 568_000,
      paymobTransactionId: 987,
    });

    expect(form.get('paymentGateway')).toBe(PaymentGateway.Paymob);
    expect(form.get('paymobOrderId')).toBe('568000');
    expect(form.get('paymobTransactionId')).toBe('987');
    expect(form.has('paypalOrderId')).toBe(false);
  });

  it('omits the Paymob transaction id when it was not relayed', () => {
    const form = buildAnalyzeFormData(file, DEFAULT_LANGUAGE_CODE, 3, {
      paymentGateway: PaymentGateway.Paymob,
      paymobOrderId: 568_000,
    });

    expect(form.get('paymobOrderId')).toBe('568000');
    expect(form.has('paymobTransactionId')).toBe(false);
  });
});
