import { describe, expect, it, vi } from 'vitest';

import { PaymentGateway } from '@twinzy/shared';

import { ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import type { PaymobAdapter } from '../adapters/paymob.adapter';
import type { PaypalAdapter } from '../adapters/paypal.adapter';
import { PaymentGateService } from '../application/payment-gate.service';
import { resolvePaymentGateway, resolvePaymentOrderId } from '../lib/payment-order.util';
import type { PaymentCaptureRecord, PaymobCaptureRecord } from '../model/payment.types';

const CAPTURE: PaymentCaptureRecord = {
  gateway: PaymentGateway.Paypal,
  orderId: 'ORDER123',
  captureId: 'CAP123',
};

const PAYMOB_CAPTURE: PaymobCaptureRecord = {
  gateway: PaymentGateway.Paymob,
  transactionId: 987,
  amountCents: 4900,
};

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

const buildPaymobFake = (): {
  adapter: PaymobAdapter;
  verifyPayment: ReturnType<typeof vi.fn>;
  refund: ReturnType<typeof vi.fn>;
  createIntention: ReturnType<typeof vi.fn>;
} => {
  const verifyPayment = vi.fn(() => Promise.resolve(PAYMOB_CAPTURE));
  const refund = vi.fn(() => Promise.resolve());
  const createIntention = vi.fn(() =>
    Promise.resolve({ clientSecret: 'cs_123', amountCents: 4900, currency: 'EGP' }),
  );
  return {
    adapter: { verifyPayment, refund, createIntention } as unknown as PaymobAdapter,
    verifyPayment,
    refund,
    createIntention,
  };
};

const buildGate = (
  paywallOn: boolean,
  paymobOn = false,
): {
  gate: PaymentGateService;
  paypal: ReturnType<typeof buildPaypalFake>;
  paymob: ReturnType<typeof buildPaymobFake>;
} => {
  const paypal = buildPaypalFake();
  const paymob = buildPaymobFake();
  const gate = new PaymentGateService(
    buildConfigStub({
      isPaywallEnabled: paywallOn || paymobOn,
      isPaypalEnabled: paywallOn,
      isPaymobEnabled: paymobOn,
      paymob: {
        secretKey: 's',
        publicKey: 'egy_pk_test_x',
        apiKey: 'a',
        hmacSecret: 'h',
        cardIntegrationId: '12345',
        currency: 'EGP',
      },
    }),
    paypal.adapter,
    paymob.adapter,
    buildAppLoggerStub().logger,
  );
  return { gate, paypal, paymob };
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

describe('PaymentGateService with Paymob ON', () => {
  it('verifies a Paymob run against the request id, never PayPal', async () => {
    const { gate, paypal, paymob } = buildGate(false, true);

    const record = await gate.captureForAnalysis({ paymentGateway: 'paymob' }, 'req-1');

    expect(record).toStrictEqual(PAYMOB_CAPTURE);
    expect(paymob.verifyPayment).toHaveBeenCalledWith('req-1');
    expect(paypal.captureOrder).not.toHaveBeenCalled();
  });

  it('cannot verify Paymob without a request id (402 PAYMENT_REQUIRED)', async () => {
    const { gate, paymob } = buildGate(false, true);

    await expect(gate.captureForAnalysis({ paymentGateway: 'paymob' })).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentRequired,
    });
    expect(paymob.verifyPayment).not.toHaveBeenCalled();
  });

  it('refunds an undelivered Paymob run on Paymob, not PayPal', async () => {
    const { gate, paypal, paymob } = buildGate(false, true);

    await gate.refundOnFailure(PAYMOB_CAPTURE, new Error('AI_TIMEOUT'));

    expect(paymob.refund).toHaveBeenCalledWith(PAYMOB_CAPTURE);
    expect(paypal.refundCapture).not.toHaveBeenCalled();
  });

  it('builds an intention response with the public key and the USD base price', async () => {
    const { gate, paymob } = buildGate(false, true);

    const response = await gate.createPaymobIntention('req-1');

    expect(paymob.createIntention).toHaveBeenCalledWith('req-1');
    expect(response).toMatchObject({
      clientSecret: 'cs_123',
      publicKey: 'egy_pk_test_x',
      amountCents: 4900,
      currency: 'EGP',
      usdBaseValue: '0.50',
      usdBaseCurrency: 'USD',
    });
  });

  it('refuses to build an intention while Paymob is off', async () => {
    const { gate, paymob } = buildGate(true, false);

    await expect(gate.createPaymobIntention('req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
    expect(paymob.createIntention).not.toHaveBeenCalled();
  });

  it('rejects a Paymob claim when only PayPal is configured', async () => {
    const { gate, paymob } = buildGate(true, false);

    await expect(
      gate.captureForAnalysis({ paymentGateway: 'paymob' }, 'req-1'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PaymentOrderInvalid });
    expect(paymob.verifyPayment).not.toHaveBeenCalled();
  });

  it('rejects a PayPal claim when only Paymob is configured', async () => {
    const { gate, paypal } = buildGate(false, true);

    await expect(
      gate.captureForAnalysis({ paypalOrderId: 'ORDER123' }, 'req-1'),
    ).rejects.toMatchObject({ errorCode: ErrorCode.PaymentOrderInvalid });
    expect(paypal.captureOrder).not.toHaveBeenCalled();
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

describe('resolvePaymentGateway', () => {
  it('defaults to PayPal when the field is absent or the body is not a record', () => {
    expect(resolvePaymentGateway({})).toBe(PaymentGateway.Paypal);
    expect(resolvePaymentGateway('nope')).toBe(PaymentGateway.Paypal);
  });

  it('reads an explicit gateway', () => {
    expect(resolvePaymentGateway({ paymentGateway: 'paymob' })).toBe(PaymentGateway.Paymob);
    expect(resolvePaymentGateway({ paymentGateway: 'paypal' })).toBe(PaymentGateway.Paypal);
  });

  it('falls back to PayPal for an unknown gateway value', () => {
    expect(resolvePaymentGateway({ paymentGateway: 'bitcoin' })).toBe(PaymentGateway.Paypal);
  });
});
