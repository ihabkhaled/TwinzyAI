import { describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { PaypalAdapter } from '../adapters/paypal.adapter';
import { PaymentGateService } from '../application/payment-gate.service';
import { resolvePaymentOrderId } from '../lib/payment-order.util';
import type { PaymentCaptureRecord } from '../model/payment.types';

const CAPTURE: PaymentCaptureRecord = { orderId: 'ORDER123', captureId: 'CAP123' };

const buildPaypalFake = (): {
  adapter: PaypalAdapter;
  captureOrder: ReturnType<typeof vi.fn>;
  refundCapture: ReturnType<typeof vi.fn>;
  createOrder: ReturnType<typeof vi.fn>;
} => {
  const createOrder = vi.fn(() => Promise.resolve('ORDER123'));
  const captureOrder = vi.fn(() => Promise.resolve(CAPTURE));
  const refundCapture = vi.fn(() => Promise.resolve());
  return {
    adapter: { createOrder, captureOrder, refundCapture } as unknown as PaypalAdapter,
    captureOrder,
    refundCapture,
    createOrder,
  };
};

const buildGate = (
  paywallOn: boolean,
): { gate: PaymentGateService; paypal: ReturnType<typeof buildPaypalFake> } => {
  const paypal = buildPaypalFake();
  const gate = new PaymentGateService(
    buildConfigStub({ isPaywallEnabled: paywallOn }),
    paypal.adapter,
    buildAppLoggerStub().logger,
  );
  return { gate, paypal };
};

describe('PaymentGateService with the paywall OFF (free game)', () => {
  it('captures nothing and never talks to PayPal', async () => {
    const { gate, paypal } = buildGate(false);

    await expect(gate.captureForAnalysis({}, 'req-1')).resolves.toBeUndefined();
    expect(paypal.captureOrder).not.toHaveBeenCalled();
  });

  it('refundOnFailure is a no-op without a capture', async () => {
    const { gate, paypal } = buildGate(false);

    await gate.refundOnFailure(undefined, new Error('boom'));

    expect(paypal.refundCapture).not.toHaveBeenCalled();
  });

  it('refuses to create orders (the endpoint has no purpose while free)', async () => {
    const { gate, paypal } = buildGate(false);

    await expect(gate.createOrderForRequest('req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
    expect(paypal.createOrder).not.toHaveBeenCalled();
  });
});

describe('PaymentGateService with the paywall ON', () => {
  it('requires an order id: a request without one is a 402 PAYMENT_REQUIRED', async () => {
    const { gate, paypal } = buildGate(true);

    await expect(gate.captureForAnalysis({}, 'req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentRequired,
      status: 402,
    });
    expect(paypal.captureOrder).not.toHaveBeenCalled();
  });

  it('rejects a malformed order id BEFORE it can reach the provider', async () => {
    const { gate, paypal } = buildGate(true);

    await expect(
      gate.captureForAnalysis({ paypalOrderId: '../evil?x=1' }, 'req-1'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PaymentOrderInvalid });
    expect(paypal.captureOrder).not.toHaveBeenCalled();
  });

  it('captures the order bound to this request id', async () => {
    const { gate, paypal } = buildGate(true);

    const record = await gate.captureForAnalysis({ paypalOrderId: 'ORDER123' }, 'req-1');

    expect(record).toStrictEqual(CAPTURE);
    expect(paypal.captureOrder).toHaveBeenCalledWith('ORDER123', 'req-1');
  });

  it('refunds a captured but undelivered run', async () => {
    const { gate, paypal } = buildGate(true);

    await gate.refundOnFailure(CAPTURE, new Error('AI_TIMEOUT'));

    expect(paypal.refundCapture).toHaveBeenCalledWith('CAP123');
  });

  it('a refund failure is swallowed (logged) and never masks the original error', async () => {
    const { gate, paypal } = buildGate(true);
    paypal.refundCapture.mockRejectedValueOnce(new Error('paypal down'));

    await expect(gate.refundOnFailure(CAPTURE, new Error('boom'))).resolves.toBeUndefined();
  });

  it('creates orders through the adapter', async () => {
    const { gate, paypal } = buildGate(true);

    await expect(gate.createOrderForRequest('req-1')).resolves.toBe('ORDER123');
    expect(paypal.createOrder).toHaveBeenCalledWith('req-1');
  });
});

describe('resolvePaymentOrderId', () => {
  it('is undefined when the field is absent (no payment attempted)', () => {
    expect(resolvePaymentOrderId({})).toBeUndefined();
    expect(resolvePaymentOrderId('not-a-record')).toBeUndefined();
  });

  it('is null for present-but-hostile values (rejected before the adapter)', () => {
    for (const hostile of ['', 'lower-case!', 'a/b', 'x'.repeat(65), 42, {}]) {
      expect(resolvePaymentOrderId({ paypalOrderId: hostile })).toBeNull();
    }
  });

  it('passes a well-formed PayPal order id through', () => {
    expect(resolvePaymentOrderId({ paypalOrderId: '5O190127TN364715T' })).toBe('5O190127TN364715T');
  });
});
