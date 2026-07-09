import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { LocaleSwitcher, ThemeToggle } from '@/modules/ui-preferences';
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
import { HomeLink } from '@/shared/components/layout/home-link.component';
import { SkipLink } from '@/shared/components/primitives/skip-link.component';
import { THEME_PALETTE } from '@/shared/constants/theme-palette.constants';
import { interFont } from '@/shared/fonts/app-fonts';
import { buildPageTitle } from '@/shared/helpers/page-title.helper';
import { readThemeAttribute } from '@/shared/helpers/read-theme-cookie.helper';

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

  return (
    <html
      lang={locale}
      dir={direction}
      data-theme={themeAttribute}
      className={interFont.variable}
      suppressHydrationWarning
    >
      <body className={bodyClassName}>
        <AppIntlProvider locale={locale} messages={messages}>
          <Providers>
            <SkipLink targetHref="#main-content" label={t('nav.skipToContent')} />
            <AppHeader brandLabel={t('app.name')}>
              <HomeLink label={t('nav.home')} />
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
