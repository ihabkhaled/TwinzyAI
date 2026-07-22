import { describe, expect, it } from 'vitest';

import { isAdEligiblePath } from './ad-eligibility.helper';

/**
 * Pins the route-based ad policy: ads may load ONLY on editorial content pages,
 * never on the game (upload/camera/consent/payment/processing/results), share
 * pages (AI-generated results), the payment popup, or unknown/error routes.
 */
describe('isAdEligiblePath', () => {
  it.each(['/', '/about', '/how-it-works', '/ai-safety', '/faq', '/help', '/privacy', '/terms'])(
    'allows the editorial page %s',
    (path) => {
      expect(isAdEligiblePath(path)).toBe(true);
    },
  );

  it('normalizes a trailing slash on an editorial page', () => {
    expect(isAdEligiblePath('/about/')).toBe(true);
  });

  it.each(['/game', '/game/'])('never allows the game surface (%s)', (path) => {
    expect(isAdEligiblePath(path)).toBe(false);
  });

  it.each(['/share/123e4567-e89b-42d3-a456-426614174000', '/share/x'])(
    'never allows shared AI results (%s)',
    (path) => {
      expect(isAdEligiblePath(path)).toBe(false);
    },
  );

  it.each(['/paymob/return', '/paymob/return?id=1'])(
    'never allows the payment flow (%s)',
    (path) => {
      expect(isAdEligiblePath(path)).toBe(false);
    },
  );

  it.each(['/nope', '/about/team', '/gamer'])('fails closed for unknown routes (%s)', (path) => {
    expect(isAdEligiblePath(path)).toBe(false);
  });

  it.each([null, undefined, ''])('fails closed for a missing pathname (%s)', (path) => {
    expect(isAdEligiblePath(path)).toBe(false);
  });
});
