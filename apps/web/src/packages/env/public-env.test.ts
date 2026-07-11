import { describe, expect, it } from 'vitest';

import { publicEnv, publicEnvSchema } from './public-env';

const ALLOWED_APP_ENVS = ['local', 'test', 'staging', 'production'];

describe('publicEnvSchema', () => {
  it('applies local defaults for an empty input', () => {
    expect(publicEnvSchema.parse({})).toStrictEqual({
      appEnv: 'local',
      apiBaseUrl: 'http://localhost:4000',
    });
  });

  it('accepts valid overrides', () => {
    expect(
      publicEnvSchema.parse({ appEnv: 'production', apiBaseUrl: 'https://api.twinzy.test' }),
    ).toStrictEqual({ appEnv: 'production', apiBaseUrl: 'https://api.twinzy.test' });
  });

  it('rejects an app env outside the allowed set', () => {
    expect(publicEnvSchema.safeParse({ appEnv: 'nope' }).success).toBe(false);
  });

  it('rejects a malformed api base url', () => {
    expect(publicEnvSchema.safeParse({ apiBaseUrl: 'not-a-url' }).success).toBe(false);
  });

  it('accepts a valid alphanumeric paypal.me handle', () => {
    expect(publicEnvSchema.parse({ paypalMeUsername: 'ihabkhaled94' }).paypalMeUsername).toBe(
      'ihabkhaled94',
    );
  });

  it('treats an unset or empty paypal.me handle as feature-off', () => {
    expect(publicEnvSchema.parse({}).paypalMeUsername).toBeUndefined();
    expect(publicEnvSchema.parse({ paypalMeUsername: '' }).paypalMeUsername).toBeUndefined();
  });

  it('fails fast on any handle that could alter the donate URL', () => {
    const hostileHandles = [
      'a/b',
      '../evil',
      'user?x=1',
      'user#frag',
      'user name',
      'user@evil.com',
      'a%2Fb',
      'паypal',
      'x'.repeat(51),
    ];
    for (const handle of hostileHandles) {
      expect(publicEnvSchema.safeParse({ paypalMeUsername: handle }).success).toBe(false);
    }
  });
});

describe('publicEnv', () => {
  it('is a validated public configuration object built from the environment', () => {
    expect(ALLOWED_APP_ENVS).toContain(publicEnv.appEnv);
    expect(typeof publicEnv.apiBaseUrl).toBe('string');
  });
});
