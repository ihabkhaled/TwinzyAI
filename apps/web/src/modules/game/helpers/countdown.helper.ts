import { COUNTDOWN_PAD_WIDTH, SECONDS_PER_MINUTE } from '../model/share.constants';

const padTwo = (value: number): string => value.toString().padStart(COUNTDOWN_PAD_WIDTH, '0');

/**
 * Formats a remaining-seconds count as `mm:ss`, clamped at zero so a lagging
 * tick never shows a negative time.
 */
export const formatCountdown = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE);
  const seconds = safeSeconds % SECONDS_PER_MINUTE;
  return `${padTwo(minutes)}:${padTwo(seconds)}`;
};
