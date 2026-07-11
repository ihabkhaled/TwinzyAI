import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePaymentFlow } from '../hooks/usePaymentFlow.hook';

const configuredState = { on: false };

vi.mock('@/packages/paypal', () => ({
  isPayPalConfigured: (): boolean => configuredState.on,
}));

const createOrderMock = vi.fn((_requestId: string) => Promise.resolve({ orderId: 'ORDER-1' }));
vi.mock('../gateway/payment.gateway', () => ({
  createPaymentOrderRequest: (requestId: string): Promise<{ orderId: string }> =>
    createOrderMock(requestId),
}));

const FILE = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

describe('usePaymentFlow with the paywall OFF (free game)', () => {
  it('starts the analyze run directly, never entering the payment phase', () => {
    configuredState.on = false;
    const beginRun = vi.fn();
    const { result } = renderHook(() => usePaymentFlow({ beginRun }));

    act(() => {
      result.current.beginPaidRun(FILE, 5);
    });

    expect(beginRun).toHaveBeenCalledWith(FILE, 5);
    expect(result.current.isPaying).toBe(false);
    expect(result.current.isPaywallEnabled).toBe(false);
  });
});

describe('usePaymentFlow with the paywall ON', () => {
  it('enters the payment phase and creates an order bound to a minted request id', async () => {
    configuredState.on = true;
    createOrderMock.mockClear();
    const beginRun = vi.fn();
    const { result } = renderHook(() => usePaymentFlow({ beginRun }));

    act(() => {
      result.current.beginPaidRun(FILE, 5);
    });
    expect(result.current.isPaying).toBe(true);
    expect(beginRun).not.toHaveBeenCalled();

    const orderId = await result.current.createOrder();
    expect(orderId).toBe('ORDER-1');
    expect(createOrderMock).toHaveBeenCalledTimes(1);
    expect(typeof createOrderMock.mock.calls[0]?.[0]).toBe('string');
  });

  it('on approval, starts the analyze run with the SAME request id + approved order', async () => {
    configuredState.on = true;
    const beginRun = vi.fn();
    const { result } = renderHook(() => usePaymentFlow({ beginRun }));

    act(() => {
      result.current.beginPaidRun(FILE, 7);
    });
    await result.current.createOrder();
    const boundRequestId = createOrderMock.mock.calls.at(-1)?.[0];

    act(() => {
      result.current.onApprove('ORDER-1');
    });

    await waitFor(() => {
      expect(result.current.isPaying).toBe(false);
    });
    expect(beginRun).toHaveBeenCalledWith(FILE, 7, {
      requestId: boundRequestId,
      paypalOrderId: 'ORDER-1',
    });
  });

  it('records a recoverable error and cancel returns to setup', () => {
    configuredState.on = true;
    const beginRun = vi.fn();
    const { result } = renderHook(() => usePaymentFlow({ beginRun }));

    act(() => {
      result.current.beginPaidRun(FILE, 5);
      result.current.onError();
    });
    expect(result.current.errorKey).toBeDefined();

    act(() => {
      result.current.cancelPayment();
    });
    expect(result.current.isPaying).toBe(false);
  });
});
