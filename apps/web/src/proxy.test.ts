import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';

describe('proxy security headers', () => {
  it('omits the HTML CSP from machine-readable XML', () => {
    const response = proxy(new NextRequest('https://twinzy.example/sitemap.xml'));

    expect(response.headers.get('content-security-policy')).toBeNull();
  });

  it('keeps the HTML CSP on public pages', () => {
    const response = proxy(new NextRequest('https://twinzy.example/about'));

    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });
});
