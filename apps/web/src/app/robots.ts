import type { MetadataRoute } from 'next';

import { publicEnv } from '@/packages/env';
import { buildRobotsConfig } from '@/shared/helpers/robots.helper';

/** `/robots.txt` — crawl everything except share/payment surfaces. */
const robots = (): MetadataRoute.Robots => buildRobotsConfig(publicEnv.siteBaseUrl);

export default robots;
