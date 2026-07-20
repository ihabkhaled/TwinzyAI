import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isDevRuntime, publicEnv } from '@/packages/env';
import { buildContentSecurityPolicy } from '@/shared/security/content-security-policy';
import { NONCE_HEADER_NAME } from '@/shared/security/security.constants';

const CSP_HEADER = 'content-security-policy';

/**
 * Next.js request proxy (formerly middleware). Generates a nonce, attaches the
 * CSP to both the forwarded request headers (so Server Components can read the
 * nonce) and the outgoing response.
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = buildContentSecurityPolicy({
    nonce,
    isDevRuntime,
    apiBaseUrl: publicEnv.apiBaseUrl,
    paypalClientId: publicEnv.paypalClientId,
    adsenseClientId: publicEnv.adsenseClientId,
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER_NAME, nonce);
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
