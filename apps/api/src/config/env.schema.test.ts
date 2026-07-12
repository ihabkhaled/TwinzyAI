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

describe('validateEnv parallel AI pipeline', () => {
  it('defaults the parallel pipeline off with conservative lane settings', () => {
    const env = validateEnv({});
    expect(env.AI_PARALLEL_PIPELINE_ENABLED).toBe(false);
    expect(env.AI_GENERATION_LANES).toBe(2);
    expect(env.AI_GENERATION_CONCURRENCY).toBe(2);
    expect(env.AI_JUDGE_CONCURRENCY).toBe(1);
    expect(env.AI_MAX_CALLS_PER_ANALYSIS).toBe(5);
    expect(env.AI_PARALLEL_QUEUE_TIMEOUT_MS).toBe(30_000);
  });

  it('enables and coerces the parallel pipeline settings from strings', () => {
    const env = validateEnv({ AI_PARALLEL_PIPELINE_ENABLED: 'true', AI_GENERATION_LANES: '4' });
    expect(env.AI_PARALLEL_PIPELINE_ENABLED).toBe(true);
    expect(env.AI_GENERATION_LANES).toBe(4);
  });

  it('rejects a lane count above the ceiling', () => {
    expect(() => validateEnv({ AI_GENERATION_LANES: '7' })).toThrow(
      /Invalid environment configuration/u,
    );
  });

  it('rejects a per-analysis call budget below the minimum viable pipeline', () => {
    expect(() => validateEnv({ AI_MAX_CALLS_PER_ANALYSIS: '2' })).toThrow(
      /Invalid environment configuration/u,
    );
  });
});
