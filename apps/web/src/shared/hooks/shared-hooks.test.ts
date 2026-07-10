import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import * as browserPackage from '@/packages/browser';
import { appLogger } from '@/packages/logger';

import { useEscapeKey } from './useEscapeKey.hook';
import { useRouteErrorLogger } from './useRouteErrorLogger.hook';

vi.mock('@/packages/logger', () => ({
  appLogger: { error: vi.fn() },
}));

describe('useEscapeKey', () => {
  it('calls the active callback only for Escape and removes it on unmount', () => {
    const onEscape = vi.fn();
    const { unmount } = renderHook(() => {
      useEscapeKey(onEscape);
    });

    act(() => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(onEscape).toHaveBeenCalledTimes(1);

    unmount();
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not register a listener without a browser window', () => {
    vi.spyOn(browserPackage, 'getSafeWindow').mockReturnValue(null);

    expect(() =>
      renderHook(() => {
        useEscapeKey(vi.fn());
      }),
    ).not.toThrow();
  });
});

describe('useRouteErrorLogger', () => {
  it('logs the safe route-error digest', () => {
    renderHook(() => {
      useRouteErrorLogger(Object.assign(new Error('failed'), { digest: 'digest' }));
    });

    expect(appLogger.error).toHaveBeenCalledWith('Route segment error boundary rendered', {
      digest: 'digest',
    });
  });
});
