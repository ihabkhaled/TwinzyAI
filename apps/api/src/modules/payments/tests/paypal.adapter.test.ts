import { afterEach, describe, expect, it, vi } from 'vitest';

import { ErrorCode } from '../../../core/errors';
import { buildAppLoggerStub, buildConfigStub } from '../../../tests/fixtures/stubs';
import { PaypalAdapter } from '../adapters/paypal.adapter';

const PAYWALL_CONFIG = {
  isPaywallEnabled: true,
  paypalClientId: 'test-client',
  paypalClientSecret: 'test-secret',
} as const;

const buildAdapter = (): PaypalAdapter =>
  new PaypalAdapter(buildConfigStub(PAYWALL_CONFIG), buildAppLoggerStub().logger);

const tokenResponse = (): Response =>
  Response.json({ access_token: 'token-1', expires_in: 3600 }, { status: 200 });

const captureBody = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: 'ORDER123',
  status: 'COMPLETED',
  purchase_units: [
    {
      payments: {
        captures: [
          {
            id: 'CAP123',
            status: 'COMPLETED',
            amount: { currency_code: 'USD', value: '0.50' },
            custom_id: 'req-1',
            ...overrides,
          },
        ],
      },
    },
  ],
});

/** fetch mock answering the OAuth call first, then the given API responses. */
const stubPaypalFetch = (...apiResponses: Response[]): ReturnType<typeof vi.fn> => {
  const queue = [...apiResponses];
  const answer = (url: string): Response => {
    if (url.includes('/v1/oauth2/token')) {
      return tokenResponse();
    }
    return queue.shift() ?? Response.json({}, { status: 500 });
  };
  const fetchMock = vi.fn((url: string) => Promise.resolve(answer(url)));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

const isTokenCall = (call: unknown[]): boolean => (call[0] as string).includes('/v1/oauth2/token');

/** Find the fetch call whose URL ends with `suffix` (the tuple [url, init]). */
const callEndingWith = (
  fetchMock: ReturnType<typeof vi.fn>,
  suffix: string,
): [string, RequestInit] | undefined =>
  fetchMock.mock.calls.find((call) => (call[0] as string).endsWith(suffix)) as
    [string, RequestInit] | undefined;

describe('PaypalAdapter.createOrder', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a CAPTURE order with the server-owned price and the request binding', async () => {
    const fetchMock = stubPaypalFetch(
      Response.json({ id: 'ORDER123', status: 'CREATED' }, { status: 201 }),
    );

    const orderId = await buildAdapter().createOrder('req-1');

    expect(orderId).toBe('ORDER123');
    const orderCall = callEndingWith(fetchMock, '/v2/checkout/orders');
    expect(orderCall).toBeDefined();
    expect(orderCall?.[0]).toBe('https://api-m.sandbox.paypal.com/v2/checkout/orders');
    const body = JSON.parse(orderCall?.[1].body as string) as {
      intent: string;
      purchase_units: { amount: { currency_code: string; value: string }; custom_id: string }[];
    };
    expect(body.intent).toBe('CAPTURE');
    expect(body.purchase_units[0]?.amount).toStrictEqual({ currency_code: 'USD', value: '0.50' });
    expect(body.purchase_units[0]?.custom_id).toBe('req-1');
  });

  it('maps provider failures to PAYMENT_PROVIDER_UNAVAILABLE without leaking bodies', async () => {
    stubPaypalFetch(Response.json({ message: 'boom' }, { status: 500 }));

    await expect(buildAdapter().createOrder('req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentProviderUnavailable,
    });
  });
});

describe('PaypalAdapter.captureOrder', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the capture record when status, amount, currency, and binding all match', async () => {
    stubPaypalFetch(Response.json(captureBody(), { status: 201 }));

    const record = await buildAdapter().captureOrder('ORDER123', 'req-1');

    expect(record).toStrictEqual({ orderId: 'ORDER123', captureId: 'CAP123' });
  });

  it('sends an idempotency key so a retried capture cannot double-charge', async () => {
    const fetchMock = stubPaypalFetch(Response.json(captureBody(), { status: 201 }));

    await buildAdapter().captureOrder('ORDER123', 'req-1');

    const captureCall = callEndingWith(fetchMock, '/capture');
    const headers = captureCall?.[1].headers as Record<string, string>;
    expect(headers['paypal-request-id']).toBe('ORDER123');
  });

  it.each([
    ['a tampered amount', { amount: { currency_code: 'USD', value: '0.01' } }],
    ['a wrong currency', { amount: { currency_code: 'EUR', value: '0.50' } }],
    ['a foreign request binding', { custom_id: 'someone-elses-request' }],
    ['a non-terminal capture status', { status: 'PENDING' }],
  ])('rejects %s as PAYMENT_ORDER_INVALID', async (_label, overrides) => {
    stubPaypalFetch(Response.json(captureBody(overrides), { status: 201 }));

    await expect(buildAdapter().captureOrder('ORDER123', 'req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
  });

  it('rejects an unapproved order as PAYMENT_ORDER_INVALID (no money moved)', async () => {
    stubPaypalFetch(Response.json({ details: [{ issue: 'ORDER_NOT_APPROVED' }] }, { status: 422 }));

    await expect(buildAdapter().captureOrder('ORDER123', 'req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
  });

  it('rejects a REPLAYED order id (already captured once) — one payment, one run', async () => {
    stubPaypalFetch(
      Response.json({ details: [{ issue: 'ORDER_ALREADY_CAPTURED' }] }, { status: 422 }),
    );

    await expect(buildAdapter().captureOrder('ORDER123', 'req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
  });

  it('rejects an unknown order id as PAYMENT_ORDER_INVALID', async () => {
    stubPaypalFetch(Response.json({}, { status: 404 }));

    await expect(buildAdapter().captureOrder('NOPE12345', 'req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentOrderInvalid,
    });
  });
});

describe('PaypalAdapter.refundCapture', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the refund for the capture id', async () => {
    const fetchMock = stubPaypalFetch(
      Response.json({ id: 'REFUND1', status: 'COMPLETED' }, { status: 201 }),
    );

    await buildAdapter().refundCapture('CAP123');

    expect(callEndingWith(fetchMock, '/v2/payments/captures/CAP123/refund')).toBeDefined();
  });

  it('surfaces a failed refund as PAYMENT_PROVIDER_UNAVAILABLE for the caller to log', async () => {
    stubPaypalFetch(Response.json({}, { status: 500 }));

    await expect(buildAdapter().refundCapture('CAP123')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentProviderUnavailable,
    });
  });
});

describe('PaypalAdapter OAuth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('authenticates with basic credentials and caches the token across calls', async () => {
    const fetchMock = stubPaypalFetch(
      Response.json({ id: 'O1', status: 'CREATED' }, { status: 201 }),
      Response.json({ id: 'O2', status: 'CREATED' }, { status: 201 }),
    );
    const adapter = buildAdapter();

    await adapter.createOrder('req-1');
    await adapter.createOrder('req-2');

    const tokenCalls = fetchMock.mock.calls.filter((call) => isTokenCall(call));
    expect(tokenCalls).toHaveLength(1);
    const headers = (tokenCalls[0] as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers['authorization']).toBe(
      `Basic ${Buffer.from('test-client:test-secret').toString('base64')}`,
    );
  });

  it('maps an OAuth rejection (bad credentials) to PAYMENT_PROVIDER_UNAVAILABLE', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(Response.json({}, { status: 401 }))),
    );

    await expect(buildAdapter().createOrder('req-1')).rejects.toMatchObject({
      errorCode: ErrorCode.PaymentProviderUnavailable,
    });
  });
});
