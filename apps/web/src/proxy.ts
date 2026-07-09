import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isDevRuntime, publicEnv } from '@/packages/env';

const NONCE_HEADER = 'x-nonce';
const CSP_HEADER = 'content-security-policy';

/**
 * Build the per-request Content-Security-Policy. A fresh nonce authorizes only
 * this response's inline scripts; `strict-dynamic` lets Next's runtime load its
 * chunks from that trusted root. `connect-src` must allow the NestJS API origin
 * so the game gateway can reach it. `'unsafe-eval'` is allowed only under the
 * `next dev` RUNTIME (React Refresh / eval'd chunks) — keyed on NODE_ENV, not
 * appEnv, so e2e (dev server with appEnv=test) works and every BUILT
 * environment stays eval-free.
 */
const buildContentSecurityPolicy = (nonce: string): string => {
  const scriptSrc = isDevRuntime
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `connect-src 'self' ${publicEnv.apiBaseUrl}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
};

/**
 * Next.js request proxy (formerly middleware). Generates a nonce, attaches the
 * CSP to both the forwarded request headers (so Server Components can read the
 * nonce) and the outgoing response.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set(CSP_HEADER, contentSecurityPolicy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(CSP_HEADER, contentSecurityPolicy);

  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
