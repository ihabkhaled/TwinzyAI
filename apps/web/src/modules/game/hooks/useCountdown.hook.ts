'use client';
// client-boundary-reason: drives a per-second interval timer and holds the live remaining-seconds state, both browser-only.

import { useEffect, useState } from 'react';

import { COUNTDOWN_TICK_MS } from '../model/share.constants';
import type { CountdownState } from '../model/share.types';

/**
 * Counts down from a server-provided remaining-seconds value, one tick per
 * second, and reports expiry when it reaches zero. One interval is created and
 * cleared on unmount (no leak); the functional updater clamps at zero, and
 * React bails out of a re-render once it stays at zero, so an expired timer
 * costs nothing. The seed comes from the authoritative server `expiresAt`
 * (never a client creation time), so a wrong local clock cannot game it.
 */
export const useCountdown = (initialRemainingSeconds: number): CountdownState => {
  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);

  useEffect(() => {
    setRemainingSeconds(initialRemainingSeconds);
  }, [initialRemainingSeconds]);

  useEffect(() => {
    const interval = setInterval((): void => {
      setRemainingSeconds((current) => (current <= 1 ? 0 : current - 1));
    }, COUNTDOWN_TICK_MS);
    return (): void => {
      clearInterval(interval);
    };
  }, []);

  return { remainingSeconds, isExpired: remainingSeconds <= 0 };
};
