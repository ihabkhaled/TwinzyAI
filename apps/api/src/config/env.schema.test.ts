import { describe, expect, it } from 'vitest';

import { UPLOAD_TRANSPORT_HARD_CAP_BYTES } from '@twinzy/shared';

import { validateEnv } from './env.schema';

describe('validateEnv boolean configuration', () => {
  it('parses explicit true and false values', () => {
    expect(validateEnv({ ENABLE_CLAMAV: 'true' }).ENABLE_CLAMAV).toBe(true);
    expect(validateEnv({ TRUST_PROXY: 'false' }).TRUST_PROXY).toBe(false);
  });

  it('rejects misspelled booleans instead of silently disabling controls', () => {
    expect(() => validateEnv({ ENABLE_CLAMAV: 'treu' })).toThrow(
      /Invalid environment configuration/u,
    );
    expect(() => validateEnv({ TRUST_PROXY: 'yes' })).toThrow(/Invalid environment configuration/u);
  });

  it('rejects an application image limit above the transport ceiling', () => {
    expect(() =>
      validateEnv({ MAX_IMAGE_SIZE_BYTES: String(UPLOAD_TRANSPORT_HARD_CAP_BYTES + 1) }),
    ).toThrow(/Invalid environment configuration/u);
  });

  it('rejects a stream registry TTL shorter than the analysis watchdog', () => {
    expect(() => validateEnv({ ANALYSIS_TIMEOUT_MS: '120000', STREAM_TTL_MS: '60000' })).toThrow(
      /STREAM_TTL_MS must be greater/u,
    );
  });
});
