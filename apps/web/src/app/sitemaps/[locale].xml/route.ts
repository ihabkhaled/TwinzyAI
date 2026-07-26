import type { NextRequest } from 'next/server';

import { publicEnv } from '@/packages/env';
import { isSupportedLanguageCode } from '@/packages/i18n';
import { buildLocaleSitemapXml } from '@/shared/helpers/seo-xml.helper';
import { createXmlResponse } from '@/shared/helpers/xml-response.helper';

import type { LocaleXmlRouteContext } from '../../../shared/components/types/route-handler.types';

export const GET = async (
  _request: NextRequest,
  context: LocaleXmlRouteContext,
): Promise<Response> => {
  const { locale } = await context.params;
  if (!isSupportedLanguageCode(locale)) {
    return new Response('Not found', { status: 404 });
  }
  return createXmlResponse(
    buildLocaleSitemapXml({
      baseUrl: publicEnv.siteBaseUrl,
      locale,
      lastModified: new Date(),
    }),
  );
};
