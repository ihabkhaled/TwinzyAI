import type { NextRequest } from 'next/server';

import { publicEnv } from '@/packages/env';
import { isSupportedLanguageCode } from '@/packages/i18n';
import { loadMessagesForLocale } from '@/packages/i18n/request';
import type {
  LocaleXmlRouteContext,
  RssMessageShape,
} from '@/shared/components/types/route-handler.types';
import { buildRssXml } from '@/shared/helpers/seo-xml.helper';
import { createXmlResponse } from '@/shared/helpers/xml-response.helper';

export const GET = async (
  _request: NextRequest,
  context: LocaleXmlRouteContext,
): Promise<Response> => {
  const { locale } = await context.params;
  if (!isSupportedLanguageCode(locale)) {
    return new Response('Not found', { status: 404 });
  }
  const messages = await loadMessagesForLocale(locale);
  return createXmlResponse(
    buildRssXml({
      baseUrl: publicEnv.siteBaseUrl,
      locale,
      messages: messages as RssMessageShape,
      publishedAt: new Date(),
    }),
  );
};
