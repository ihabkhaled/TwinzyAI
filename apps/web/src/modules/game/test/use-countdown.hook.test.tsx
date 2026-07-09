import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCountdown } from '../hooks/useCountdown.hook';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts down one second per tick from the server-seeded value', () => {
    const { result } = renderHook(() => useCountdown(3));
    expect(result.current.remainingSeconds).toBe(3);
    expect(result.current.isExpired).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.remainingSeconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isExpired).toBe(true);
  });

  it('reports expiry immediately when seeded at zero', () => {
    const { result } = renderHook(() => useCountdown(0));
    expect(result.current.isExpired).toBe(true);
  });

  it('clears its interval on unmount (no dangling timer)', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useCountdown(5));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
