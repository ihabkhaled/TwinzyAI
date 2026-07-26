import type { MetadataRoute } from 'next';

import { publicEnv } from '@/packages/env';
import { buildSitemapEntries } from '@/shared/helpers/sitemap.helper';

/** `/sitemap.xml` — every first-class route in every supported language. */
const sitemap = (): MetadataRoute.Sitemap => buildSitemapEntries(publicEnv.siteBaseUrl, new Date());

export default sitemap;
