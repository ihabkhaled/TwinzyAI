import { describe, expect, it } from 'vitest';

import {
  buildSharePagePath,
  CreateShareResultRequestSchema,
  CreateShareResultResponseSchema,
  SHARE_PAGE_PATH_PREFIX,
  SHARE_RESULT_DEFAULT_TTL_SECONDS,
  SHARE_RESULT_MAX_TTL_SECONDS,
  SHARE_RESULT_MIN_TTL_SECONDS,
  ShareIdSchema,
  ShareResultResponseSchema,
} from '../src';

import { buildFinalResultPayload } from './fixtures/advanced-fixtures';

const SAMPLE_UUID = '3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b';

describe('share-result constants', () => {
  it('keeps the default TTL at 10 minutes within the min/max window', () => {
    expect(SHARE_RESULT_DEFAULT_TTL_SECONDS).toBe(600);
    expect(SHARE_RESULT_MIN_TTL_SECONDS).toBe(60);
    expect(SHARE_RESULT_MAX_TTL_SECONDS).toBe(3600);
    expect(SHARE_RESULT_DEFAULT_TTL_SECONDS).toBeGreaterThanOrEqual(SHARE_RESULT_MIN_TTL_SECONDS);
    expect(SHARE_RESULT_DEFAULT_TTL_SECONDS).toBeLessThanOrEqual(SHARE_RESULT_MAX_TTL_SECONDS);
  });

  it('builds the public page path from the share id', () => {
    expect(buildSharePagePath(SAMPLE_UUID)).toBe(`${SHARE_PAGE_PATH_PREFIX}/${SAMPLE_UUID}`);
  });
});

describe('ShareIdSchema', () => {
  it('accepts a v4 UUID and rejects non-UUID ids', () => {
    expect(ShareIdSchema.safeParse(SAMPLE_UUID).success).toBe(true);
    expect(ShareIdSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(ShareIdSchema.safeParse('../../etc/passwd').success).toBe(false);
    expect(ShareIdSchema.safeParse('').success).toBe(false);
  });
});

describe('CreateShareResultRequestSchema', () => {
  it('accepts a full valid final result', () => {
    const parsed = CreateShareResultRequestSchema.safeParse({
      result: buildFinalResultPayload(),
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects unknown top-level keys (no image/file slot by construction)', () => {
    const parsed = CreateShareResultRequestSchema.safeParse({
      result: buildFinalResultPayload(),
      image: 'data:image/png;base64,AAAA',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects unknown keys smuggled into the result', () => {
    const parsed = CreateShareResultRequestSchema.safeParse({
      result: buildFinalResultPayload({ imageUrl: 'https://x/y.png' }),
    });
    expect(parsed.success).toBe(false);
  });
});

describe('CreateShareResultResponseSchema', () => {
  it('accepts well-formed create metadata', () => {
    const parsed = CreateShareResultResponseSchema.safeParse({
      shareId: SAMPLE_UUID,
      shareUrl: `https://twinzy.app${buildSharePagePath(SAMPLE_UUID)}`,
      createdAt: '2026-07-08T10:00:00.000Z',
      expiresAt: '2026-07-08T10:10:00.000Z',
      ttlSeconds: SHARE_RESULT_DEFAULT_TTL_SECONDS,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a non-URL share url', () => {
    const parsed = CreateShareResultResponseSchema.safeParse({
      shareId: SAMPLE_UUID,
      shareUrl: 'not a url',
      createdAt: '2026-07-08T10:00:00.000Z',
      expiresAt: '2026-07-08T10:10:00.000Z',
      ttlSeconds: 600,
    });
    expect(parsed.success).toBe(false);
  });
});

describe('ShareResultResponseSchema', () => {
  it('accepts an active record with remainingSeconds', () => {
    const parsed = ShareResultResponseSchema.safeParse({
      shareId: SAMPLE_UUID,
      languageCode: 'en',
      result: buildFinalResultPayload(),
      createdAt: '2026-07-08T10:00:00.000Z',
      expiresAt: '2026-07-08T10:10:00.000Z',
      remainingSeconds: 523,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a negative remainingSeconds', () => {
    const parsed = ShareResultResponseSchema.safeParse({
      shareId: SAMPLE_UUID,
      languageCode: 'en',
      result: buildFinalResultPayload(),
      createdAt: '2026-07-08T10:00:00.000Z',
      expiresAt: '2026-07-08T10:10:00.000Z',
      remainingSeconds: -1,
    });
    expect(parsed.success).toBe(false);
  });
});
