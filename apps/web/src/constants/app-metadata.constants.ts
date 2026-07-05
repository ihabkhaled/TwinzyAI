import type { Metadata, Viewport } from 'next';

import { APP_NAME } from '@twinzy/shared';

import { en } from '@/i18n/en';

export const APP_METADATA: Metadata = {
  title: `${APP_NAME} — ${en['app.tagline']}`,
  description: en['app.subtitle'],
  applicationName: APP_NAME,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/icons/icon.svg',
  },
};

export const APP_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f7fc' },
    { media: '(prefers-color-scheme: dark)', color: '#13111c' },
  ],
};
