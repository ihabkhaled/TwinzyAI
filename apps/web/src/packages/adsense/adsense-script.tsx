import type { ReactElement } from 'react';

import { publicEnv } from '@/packages/env';

import { ADSENSE_SCRIPT_BASE_URL } from './adsense.constants';
import type { AdsenseScriptProps } from './adsense.types';

/**
 * The single place the Google AdSense loader is injected — nothing else in the
 * app talks to AdSense, so removing ads (or swapping providers) touches only
 * this package. Renders nothing when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is unset,
 * so local, test, and preview builds ship no third-party ad script at all.
 *
 * The tag carries the request nonce because the CSP is nonce + `strict-dynamic`:
 * host allowlisting alone cannot authorize it, and the scripts AdSense loads
 * afterwards inherit trust from this one.
 */
export function AdsenseScript({ nonce }: AdsenseScriptProps): ReactElement | null {
  const clientId = publicEnv.adsenseClientId;
  if (clientId === undefined) {
    return null;
  }
  const query = new URLSearchParams({ client: clientId });

  return (
    <script
      async
      nonce={nonce}
      src={`${ADSENSE_SCRIPT_BASE_URL}?${query.toString()}`}
      crossOrigin="anonymous"
    />
  );
}
