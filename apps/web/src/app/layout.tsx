import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { LocaleSwitcher, ThemeToggle } from '@/modules/ui-preferences';
import { AdsenseScript } from '@/packages/adsense';
import {
  AppIntlProvider,
  DEFAULT_LOCALE,
  getLocaleDirection,
  getServerLocale,
  getServerMessages,
  getServerTranslations,
  isSupportedLanguageCode,
} from '@/packages/i18n';
import { AppToaster } from '@/packages/toast';
import { AppHeader } from '@/shared/components/layout/app-header.component';
import { DonateNavLink } from '@/shared/components/layout/donate-nav-link.component';
import { HomeLink } from '@/shared/components/layout/home-link.component';
import { SkipLink } from '@/shared/components/primitives/skip-link.component';
import { THEME_PALETTE } from '@/shared/constants/theme-palette.constants';
import { interFont } from '@/shared/fonts/app-fonts';
import { resolveDonateUrl } from '@/shared/helpers/donate-link.helper';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { readThemeAttribute } from '@/shared/helpers/read-theme-cookie.helper';
import { NONCE_HEADER_NAME } from '@/shared/security/security.constants';

import { bodyClassName } from './layout.variants';
import { Providers } from './providers';

import './styles.css';

interface RootLayoutProps {
  children: ReactNode;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations('app');

  return {
    title: buildPageTitle(t('tagline')),
    description: t('subtitle'),
    applicationName: t('name'),
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: t('name'),
      statusBarStyle: 'default',
    },
    icons: {
      icon: '/icons/icon.svg',
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_PALETTE.surfaceLight },
    { media: '(prefers-color-scheme: dark)', color: THEME_PALETTE.surfaceDark },
  ],
};

const RootLayout = async ({ children }: RootLayoutProps): Promise<ReactNode> => {
  const resolvedLocale = await getServerLocale();
  const locale = isSupportedLanguageCode(resolvedLocale) ? resolvedLocale : DEFAULT_LOCALE;
  const direction = getLocaleDirection(locale);
  const t = await getServerTranslations();
  const messages = await getServerMessages();
  const themeAttribute = await readThemeAttribute();
  const donateUrl = resolveDonateUrl();
  const requestHeaders = await headers();
  const nonce = requestHeaders.get(NONCE_HEADER_NAME) ?? undefined;

  return (
    <html
      lang={locale}
      dir={direction}
      data-theme={themeAttribute}
      className={interFont.variable}
      suppressHydrationWarning
    >
      <head>
        <AdsenseScript nonce={nonce} />
      </head>
      <body className={bodyClassName}>
        <AppIntlProvider locale={locale} messages={messages}>
          <Providers>
            <SkipLink targetHref="#main-content" label={t('nav.skipToContent')} />
            <AppHeader brandLabel={t('app.name')}>
              <HomeLink label={t('nav.home')} />
              {donateUrl === undefined ? null : (
                <DonateNavLink href={donateUrl} label={t('nav.donate')} />
              )}
              <LocaleSwitcher />
              <ThemeToggle />
            </AppHeader>
            <main id="main-content">{children}</main>
            <AppToaster />
          </Providers>
        </AppIntlProvider>
      </body>
    </html>
  );
};

export default RootLayout;
