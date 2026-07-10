import { describe, expect, it } from 'vitest';

import { buildSharePagePath, ShareIdSchema } from '@twinzy/shared';

import { generateShareId } from '../lib/share-id.util';
import {
  computeShareExpiry,
  isShareExpired,
  shareRemainingSeconds,
} from '../lib/share-result-expiry.util';
import {
  collectStringValues,
  containsEmbeddedImageData,
  containsForbiddenShareWording,
  isUnshareableText,
} from '../lib/share-result-safety.util';
import { buildShareUrl } from '../lib/share-result-url.util';

describe('generateShareId', () => {
  it('mints a valid, unique v4 UUID each call', () => {
    const first = generateShareId();
    const second = generateShareId();

    expect(ShareIdSchema.safeParse(first).success).toBe(true);
    expect(first).not.toBe(second);
  });
});

describe('share expiry math', () => {
  const NOW = 1_000_000;

  it('computes the expiry window from the server clock and TTL', () => {
    const window = computeShareExpiry(NOW, 600);
    expect(window.createdAtMs).toBe(NOW);
    expect(window.expiresAtMs).toBe(NOW + 600_000);
  });

  it('reports expiry only at or past the expiry instant', () => {
    expect(isShareExpired(NOW + 600_000, NOW)).toBe(false);
    expect(isShareExpired(NOW + 600_000, NOW + 599_999)).toBe(false);
    expect(isShareExpired(NOW + 600_000, NOW + 600_000)).toBe(true);
    expect(isShareExpired(NOW + 600_000, NOW + 700_000)).toBe(true);
  });

  it('rounds remaining seconds up and never negative', () => {
    expect(shareRemainingSeconds(NOW + 600_000, NOW)).toBe(600);
    expect(shareRemainingSeconds(NOW + 400, NOW)).toBe(1);
    expect(shareRemainingSeconds(NOW, NOW)).toBe(0);
    expect(shareRemainingSeconds(NOW - 5000, NOW)).toBe(0);
  });
});

describe('buildShareUrl', () => {
  const ID = '3f1c8b2a-9d4e-4c7a-8b1f-2e6a7c9d0e5b';

  it('joins the configured origin with the /share/<id> path exactly once', () => {
    expect(buildShareUrl('https://twinzy.app', ID)).toBe(
      `https://twinzy.app${buildSharePagePath(ID)}`,
    );
  });

  it('normalizes a trailing slash on the base origin', () => {
    expect(buildShareUrl('https://twinzy.app/', ID)).toBe(
      `https://twinzy.app${buildSharePagePath(ID)}`,
    );
  });
});

describe('share safety scanning', () => {
  it('collects every string leaf from a nested structure', () => {
    const values = collectStringValues({
      a: 'one',
      b: { c: 'two', d: ['three', { e: 'four' }] },
      n: 42,
      z: null,
    });
    expect(values.toSorted((left, right) => left.localeCompare(right))).toEqual([
      'four',
      'one',
      'three',
      'two',
    ]);
  });

  it('flags forbidden wording case-insensitively', () => {
    expect(containsForbiddenShareWording('This uses FACE RECOGNITION on you')).toBe(true);
    expect(containsForbiddenShareWording('A playful style match')).toBe(false);
  });

  it('flags embedded image data (data: URLs and base64 blobs)', () => {
    expect(containsEmbeddedImageData('data:image/png;base64,AAAA')).toBe(true);
    expect(containsEmbeddedImageData('x;base64,QQ==')).toBe(true);
    expect(containsEmbeddedImageData(`iVBORw0KGgo${'A'.repeat(300)}`)).toBe(true);
    expect(containsEmbeddedImageData('A'.repeat(256))).toBe(true);
    expect(containsEmbeddedImageData('just words')).toBe(false);
  });

  it('treats forbidden-wording OR embedded-image as unshareable', () => {
    expect(isUnshareableText('data:image/jpeg;base64,ZZ')).toBe(true);
    expect(isUnshareableText('biometric comparison')).toBe(true);
    expect(isUnshareableText('wavy dark hair')).toBe(false);
  });
});
