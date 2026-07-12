import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnalyzeRunControl } from '../hooks/useAnalyzeRunControl.hook';
import type { AnalyzeRunInput } from '../model/game.types';

const FILE = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

/**
 * The processing-phase Cancel button calls cancelRun, which must abort the
 * in-flight run's AbortSignal — the signal wired to the streaming fetch, so
 * aborting it stops the request and the backend sees the disconnect. This holds
 * regardless of HOW the run started: a free run (onAnalyze → beginRun) or a
 * paid run (payment onApprove → beginRun with the order binding).
 */
describe('useAnalyzeRunControl cancel', () => {
  it('aborts the in-flight run signal when cancelRun fires (free run)', () => {
    const start = vi.fn<(input: AnalyzeRunInput) => void>();
    const { result } = renderHook(() => useAnalyzeRunControl(start));

    act(() => {
      result.current.beginRun(FILE, 5);
    });
    const startedSignal = start.mock.calls[0]?.[0].signal;
    expect(startedSignal?.aborted).toBe(false);

    act(() => {
      result.current.cancelRun();
    });
    expect(startedSignal?.aborted).toBe(true);
  });

  it('aborts the in-flight run signal for a PAID run (started from payment approval)', () => {
    const start = vi.fn<(input: AnalyzeRunInput) => void>();
    const { result } = renderHook(() => useAnalyzeRunControl(start));

    // Exactly what usePaymentFlow.onApprove does: same request id + order id.
    act(() => {
      result.current.beginRun(FILE, 5, {
        requestId: '3b241101-e2bb-4255-8caf-4136c566a962',
        paypalOrderId: 'ORDER123',
      });
    });
    const input = start.mock.calls[0]?.[0];
    expect(input?.requestId).toBe('3b241101-e2bb-4255-8caf-4136c566a962');
    expect(input?.paypalOrderId).toBe('ORDER123');
    expect(input?.signal.aborted).toBe(false);

    act(() => {
      result.current.cancelRun();
    });
    expect(input?.signal.aborted).toBe(true);
  });

  it('aborts the previous run when a new run begins (never two live runs)', () => {
    const start = vi.fn<(input: AnalyzeRunInput) => void>();
    const { result } = renderHook(() => useAnalyzeRunControl(start));

    act(() => {
      result.current.beginRun(FILE, 5);
    });
    const firstSignal = start.mock.calls[0]?.[0].signal;

    act(() => {
      result.current.beginRun(FILE, 5);
    });
    expect(firstSignal?.aborted).toBe(true);
    expect(start.mock.calls[1]?.[0].signal.aborted).toBe(false);
  });

  it('aborts the run on unmount (route change / tab close)', () => {
    const start = vi.fn<(input: AnalyzeRunInput) => void>();
    const { result, unmount } = renderHook(() => useAnalyzeRunControl(start));

    act(() => {
      result.current.beginRun(FILE, 5);
    });
    const startedSignal = start.mock.calls[0]?.[0].signal;

    unmount();
    expect(startedSignal?.aborted).toBe(true);
  });
});
