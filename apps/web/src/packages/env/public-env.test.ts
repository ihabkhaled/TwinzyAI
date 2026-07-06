import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('publicEnv', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to local defaults when the public env vars are unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', undefined);
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', undefined);

    const { publicEnv } = await import('./public-env');

    expect(publicEnv).toStrictEqual({ appEnv: 'local', apiBaseUrl: 'http://localhost:4000' });
  });

  it('reads overrides from the environment', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.twinzy.test');

    const { publicEnv } = await import('./public-env');

    expect(publicEnv.appEnv).toBe('production');
    expect(publicEnv.apiBaseUrl).toBe('https://api.twinzy.test');
  });

  it('throws when the app env is not an allowed value', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'staging-oops');

    await expect(import('./public-env')).rejects.toThrow();
  });

  it('throws when the api base url is not a valid url', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'not-a-url');

    await expect(import('./public-env')).rejects.toThrow();
  });
});
