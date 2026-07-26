import type { AppMessages } from '@/packages/i18n';

import type { RssMessages } from './seo.types';

export interface LocaleXmlRouteContext {
  params: Promise<{ locale: string }>;
}

export type RssMessageShape = AppMessages & RssMessages;
