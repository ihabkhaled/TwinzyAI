import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isDevRuntime, publicEnv } from '@/packages/env';
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from '@/packages/i18n';
import {
  buildLocalizedPath,
  isMachinePath,
  isPublicPagePath,
  parseLocalizedPath,
} from '@/shared/helpers/locale-route.helper';
import { buildContentSecurityPolicy } from '@/shared/security/content-security-policy';
import { NONCE_HEADER_NAME, PATHNAME_HEADER_NAME } from '@/shared/security/security.constants';

const CSP_HEADER = 'content-security-policy';
const PERMANENT_REDIRECT_STATUS = 308;

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
  requestHeaders.set(PATHNAME_HEADER_NAME, request.nextUrl.pathname);
  requestHeaders.set(CSP_HEADER, contentSecurityPolicy);

  const localized = parseLocalizedPath(request.nextUrl.pathname);
  let response: NextResponse;

  if (isMachinePath(request.nextUrl.pathname)) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else if (isPublicPagePath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = buildLocalizedPath(DEFAULT_LOCALE, request.nextUrl.pathname);
    response = NextResponse.redirect(redirectUrl, PERMANENT_REDIRECT_STATUS);
  } else if (localized !== undefined && isPublicPagePath(localized.internalPath)) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = localized.internalPath;
    requestHeaders.set(
      'cookie',
      `${requestHeaders.get('cookie') ?? ''}; ${LOCALE_COOKIE_NAME}=${localized.locale}`,
    );
    response = NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
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
