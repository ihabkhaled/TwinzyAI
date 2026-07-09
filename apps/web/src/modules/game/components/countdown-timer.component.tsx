import type { ReactElement } from 'react';

import { TEST_IDS } from '@/shared/constants/test-ids.constants';

import type { CountdownTimerProps } from '../model/share-component.types';

import { countdownTimerClass } from './countdown-timer.variants';

/**
 * Accessible countdown line. `role="timer"` exposes it as a timer to assistive
 * tech; it is deliberately NOT a per-second live region (announcing every tick
 * is noisy for screen readers — the value is read on navigation). The full
 * localized "disappears in mm:ss" string is prepared upstream.
 */
export function CountdownTimer({ label, testId }: Readonly<CountdownTimerProps>): ReactElement {
  return (
    <p role="timer" className={countdownTimerClass} data-testid={testId ?? TEST_IDS.shareCountdown}>
      {label}
    </p>
  );
}
