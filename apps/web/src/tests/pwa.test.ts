import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { isRecord } from '@twinzy/shared';

const manifestPath = path.resolve(import.meta.dirname, '../../public/manifest.webmanifest');

describe('PWA manifest', () => {
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, 'utf8'));

  it('is valid JSON with the required installability fields', () => {
    expect(isRecord(manifest)).toBe(true);
    const record = manifest as Record<string, unknown>;

    expect(record['name']).toBeTruthy();
    expect(record['short_name']).toBe('Twinzy');
    expect(record['start_url']).toBe('/');
    expect(record['display']).toBe('standalone');
    expect(Array.isArray(record['icons'])).toBe(true);
    expect((record['icons'] as unknown[]).length).toBeGreaterThan(0);
  });

  it('contains no identity/biometric wording', () => {
    const text = JSON.stringify(manifest).toLowerCase();
    expect(text).toContain('no face recognition');
    expect(text).not.toContain('identity match');
    expect(text).not.toContain('lookalike');
  });
});
