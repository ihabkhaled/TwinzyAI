'use client';
// client-boundary-reason: owns a window keydown listener lifecycle, which exists only in the browser.

import { useEffect } from 'react';

import { getSafeWindow } from '@/packages/browser';

/**
 * Invoke `onEscape` whenever the Escape key is pressed anywhere in the window
 * (via the SSR-safe facade). Single owner of the dismiss-on-Escape lifecycle
 * used by modal dialogs; the listener detaches on unmount or callback change.
 */
export const useEscapeKey = (onEscape: () => void): void => {
  useEffect(() => {
    const safeWindow = getSafeWindow();
    if (safeWindow === null) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };
    safeWindow.addEventListener('keydown', onKeyDown);
    return (): void => {
      safeWindow.removeEventListener('keydown', onKeyDown);
    };
  }, [onEscape]);
};
