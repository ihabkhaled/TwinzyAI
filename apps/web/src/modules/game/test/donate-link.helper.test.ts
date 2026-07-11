import { describe, expect, it, vi } from 'vitest';

import type * as EnvModule from '@/packages/env';

import { buildPayPalDonateUrl, resolveDonateUrl } from '../helpers/donate-link.helper';

const envState: { paypalMeUsername: string | undefined } = { paypalMeUsername: undefined };

vi.mock('@/packages/env', async (importOriginal) => {
  const actual = await importOriginal<typeof EnvModule>();
  return {
    ...actual,
    publicEnv: {
      appEnv: 'test',
      apiBaseUrl: 'http://localhost:4000',
      get paypalMeUsername(): string | undefined {
        return envState.paypalMeUsername;
      },
    },
  };
});

describe('buildPayPalDonateUrl', () => {
  it('builds the hardcoded-origin URL for a valid alphanumeric handle', () => {
    expect(buildPayPalDonateUrl('ihabkhaled94')).toBe('https://paypal.me/ihabkhaled94');
  });

  it('throws for any handle that could alter the outbound URL', () => {
    const hostileHandles = [
      '',
      'a/b',
      '../up',
      'a?x=1',
      'a#frag',
      'a b',
      'a@evil.com',
      'a%2Fb',
      'x'.repeat(51),
    ];
    for (const handle of hostileHandles) {
      expect(() => buildPayPalDonateUrl(handle)).toThrow(/Invalid PayPal\.me handle/);
    }
  });
});

describe('resolveDonateUrl', () => {
  it('is undefined (link hidden) when no handle is configured', () => {
    envState.paypalMeUsername = undefined;

    expect(resolveDonateUrl()).toBeUndefined();
  });

  it('returns the donate URL when a handle is configured', () => {
    envState.paypalMeUsername = 'twinzytest';

    expect(resolveDonateUrl()).toBe('https://paypal.me/twinzytest');
  });
});
