import type { MetadataRoute } from 'next';

import { publicEnv } from '@/packages/env';
import { buildSitemapEntries } from '@/shared/helpers/sitemap.helper';

/** `/sitemap.xml` — every first-class route, absolute against the site origin. */
const sitemap = (): MetadataRoute.Sitemap => buildSitemapEntries(publicEnv.siteBaseUrl, new Date());

export default sitemap;
