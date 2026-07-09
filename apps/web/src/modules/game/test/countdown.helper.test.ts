import { describe, expect, it } from 'vitest';

import { formatCountdown } from '../helpers/countdown.helper';
import { resolveSharePhase } from '../helpers/share-display.helper';
import { SharePagePhase } from '../model/share.enums';

describe('formatCountdown', () => {
  it('formats remaining seconds as zero-padded mm:ss', () => {
    expect(formatCountdown(600)).toBe('10:00');
    expect(formatCountdown(582)).toBe('09:42');
    expect(formatCountdown(9)).toBe('00:09');
    expect(formatCountdown(0)).toBe('00:00');
  });

  it('clamps a negative time to 00:00', () => {
    expect(formatCountdown(-5)).toBe('00:00');
  });
});

describe('resolveSharePhase', () => {
  const active = {
    shareId: 'x',
    languageCode: 'en',
    result: {},
    createdAt: 'x',
    expiresAt: 'x',
    remainingSeconds: 1,
  } as never;

  it('is loading while the query is loading', () => {
    expect(resolveSharePhase(true, false, undefined, false)).toBe(SharePagePhase.Loading);
  });

  it('is not-found on error or missing data (privacy: same as expired)', () => {
    expect(resolveSharePhase(false, true, undefined, false)).toBe(SharePagePhase.NotFound);
    expect(resolveSharePhase(false, false, undefined, false)).toBe(SharePagePhase.NotFound);
  });

  it('is expired once the countdown reaches zero, even with data present', () => {
    expect(resolveSharePhase(false, false, active, true)).toBe(SharePagePhase.Expired);
  });

  it('is active with data and time remaining', () => {
    expect(resolveSharePhase(false, false, active, false)).toBe(SharePagePhase.Active);
  });
});
