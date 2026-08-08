import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { config, proxy } from './proxy';

describe('proxy security headers', () => {
  it('omits the HTML CSP from machine-readable XML', () => {
    const response = proxy(new NextRequest('https://twinzy.example/sitemap.xml'));

    expect(response.headers.get('content-security-policy')).toBeNull();
  });

  it('keeps the HTML CSP on public pages', () => {
    const response = proxy(new NextRequest('https://twinzy.example/about'));

    expect(response.headers.get('content-security-policy')).toContain("default-src 'self'");
  });

  it('serves the root directly in English even when a stale locale cookie exists', () => {
    const response = proxy(
      new NextRequest('https://twinzy.example/', { headers: { cookie: 'NEXT_LOCALE=ar' } }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('x-middleware-request-cookie')).toContain('NEXT_LOCALE=en');
  });

  it('excludes crawler-owned root files from the proxy matcher', () => {
    const source = config.matcher[0]?.source ?? '';

    expect(source).toContain('ads[.]txt');
    expect(source).toContain('robots[.]txt');
    expect(source).toContain('sitemap[.]xml');
  });
});
