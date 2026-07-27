import { describe, expect, it } from 'vitest';

import { UPLOAD_TRANSPORT_HARD_CAP_BYTES } from '@twinzy/shared';

import { validateEnv } from './env.schema';

describe('validateEnv boolean configuration', () => {
  it('requires complete SMTP configuration when contact email is enabled', () => {
    expect(() => validateEnv({ CONTACT_EMAIL_ENABLED: 'true' })).toThrow(
      /complete SMTP configuration/u,
    );
    expect(
      validateEnv({
        CONTACT_EMAIL_ENABLED: 'true',
        CONTACT_EMAIL_FROM: 'from@example.com',
        CONTACT_EMAIL_TO: 'to@example.com',
        CONTACT_SMTP_HOST: 'smtp.example.com',
        CONTACT_SMTP_USER: 'user',
        CONTACT_SMTP_PASS: 'secret',
      }).CONTACT_EMAIL_ENABLED,
    ).toBe(true);
  });
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

describe('validateEnv advanced public-figure matching', () => {
  it('defaults every advanced path off and bounds external metadata settings', () => {
    const env = validateEnv({});

    expect(env.AI_ADVANCED_MATCHING_ENABLED).toBe(false);
    expect(env.AI_PUBLIC_FIGURE_CATALOG_ENABLED).toBe(false);
    expect(env.AI_ENSEMBLE_ENABLED).toBe(false);
    expect(env.AI_CROSS_CRITIQUE_ENABLED).toBe(false);
    expect(env.AI_SECOND_RETRIEVAL_PASS_ENABLED).toBe(false);
    expect(env.PUBLIC_FIGURE_ENRICHMENT_ENABLED).toBe(false);
    expect(env.AI_ENSEMBLE_MIN_SUCCESSFUL_PARTICIPANTS).toBe(2);
    expect(env.PUBLIC_FIGURE_CACHE_TTL_SECONDS).toBe(86_400);
    expect(env.PUBLIC_FIGURE_CACHE_MAX_ITEMS).toBe(1000);
  });

  it('parses configured participant lists and rejects an invalid minimum', () => {
    const env = validateEnv({
      AI_ENSEMBLE_ENABLED: 'true',
      AI_ENSEMBLE_GENERATION_PARTICIPANTS:
        'gemini:configured-gemini,openai:configured-gpt,deepseek:configured-deepseek',
      AI_ENSEMBLE_MIN_SUCCESSFUL_PARTICIPANTS: '3',
    });

    expect(env.AI_ENSEMBLE_ENABLED).toBe(true);
    expect(env.AI_ENSEMBLE_MIN_SUCCESSFUL_PARTICIPANTS).toBe(3);
    expect(() => validateEnv({ AI_ENSEMBLE_MIN_SUCCESSFUL_PARTICIPANTS: '0' })).toThrow(
      /Invalid environment configuration/u,
    );
  });
});
