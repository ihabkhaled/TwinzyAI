import { readFileSync } from 'node:fs';

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

/**
 * Next only reads `.env` files from `apps/web/`, but this monorepo keeps ONE
 * root `.env` for both sides. Copy the PUBLIC (`NEXT_PUBLIC_*`) keys from the
 * root file into the process before Next inlines them. Already-set variables
 * always win, so CI, e2e (playwright webServer env), and deployment platforms
 * override the file. Server-side secrets are deliberately never copied.
 */
const loadRootPublicEnv = (): void => {
  let raw: string;
  try {
    raw = readFileSync('../../.env', 'utf8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = /^(NEXT_PUBLIC_[A-Z0-9_]+)=(.*)$/.exec(line.trim());
    const key = match?.[1];
    if (key !== undefined && process.env[key] === undefined) {
      process.env[key] = match?.[2] ?? '';
    }
  }
};

/** Built via a function so the root-env load runs before any process.env read. */
const buildNextConfig = (): NextConfig => {
  loadRootPublicEnv();

  return {
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
};

export default withNextIntl(buildNextConfig());
