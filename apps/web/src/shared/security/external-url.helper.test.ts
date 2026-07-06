import { describe, expect, it } from 'vitest';

import { isSafeExternalUrl } from './external-url.helper';

describe('isSafeExternalUrl', () => {
  it('accepts fully-qualified https URLs', () => {
    expect(isSafeExternalUrl('https://twinzy.example/help')).toBe(true);
  });

  it('accepts mailto URLs', () => {
    expect(isSafeExternalUrl('mailto:support@twinzy.example')).toBe(true);
  });

  it('rejects plain http', () => {
    expect(isSafeExternalUrl('http://twinzy.example')).toBe(false);
  });

  it('rejects javascript: scheme', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects data: scheme', () => {
    expect(isSafeExternalUrl('data:text/html,<script>')).toBe(false);
  });

  it('rejects relative URLs', () => {
    expect(isSafeExternalUrl('/game')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isSafeExternalUrl('')).toBe(false);
  });
});
