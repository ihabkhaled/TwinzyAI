import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { APP_METADATA, APP_VIEWPORT } from '@/constants/app-metadata.constants';
import { t } from '@/i18n';

import { Providers } from './providers';

import '@/styles/globals.css';

export const metadata: Metadata = APP_METADATA;

export const viewport: Viewport = APP_VIEWPORT;

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps): ReactNode => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-text antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2"
      >
        {t('nav.skipToContent')}
      </a>
      <Providers>{children}</Providers>
    </body>
  </html>
);

export default RootLayout;
