import { afterEach, describe, expect, it, vi } from 'vitest';

import * as browserPackage from '@/packages/browser';

import { writeCookie } from './cookie-storage';

afterEach(() => {
  document.cookie = 'theme=; max-age=0; path=/';
  vi.restoreAllMocks();
});

describe('writeCookie', () => {
  it('encodes values and writes bounded same-site cookies', () => {
    writeCookie('theme', 'dark mode', { maxAgeSeconds: 60, path: '/' });

    expect(document.cookie).toContain('theme=dark%20mode');
  });

  it('is a no-op without a browser document', () => {
    vi.spyOn(browserPackage, 'getSafeDocument').mockReturnValue(null);

    expect(() => {
      writeCookie('theme', 'dark');
    }).not.toThrow();
  });
});
