import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/packages/i18n/request.ts');

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  typedRoutes: true,
  // E2E runs (NEXT_PUBLIC_APP_ENV=test) disable the dev overlay indicator:
  // its <nextjs-portal> sits bottom-left and intercepts taps on mobile
  // viewports (it swallowed the share-button click in the e2e gate).
  ...(process.env.NEXT_PUBLIC_APP_ENV === 'test' && { devIndicators: false }),
  headers: () => Promise.resolve([{ source: '/(.*)', headers: SECURITY_HEADERS }]),
};

export default withNextIntl(nextConfig);
