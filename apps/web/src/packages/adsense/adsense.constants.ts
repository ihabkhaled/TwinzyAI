/**
 * Google AdSense loader endpoint. The publisher id is appended as the `client`
 * query param; the tag must sit in the document head because AdSense verifies
 * site ownership by reading it out of the initial HTML.
 */
export const ADSENSE_SCRIPT_BASE_URL =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';

/**
 * Origins the AdSense stack needs once ads are switched on: the loader + the
 * further scripts it pulls, the ad iframes, the creatives/pixels, and its
 * measurement calls. Added to the CSP ONLY when a publisher id is configured,
 * so the ad-free build keeps its minimal policy.
 */
export const ADSENSE_CSP_ORIGINS = [
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.googleadservices.com',
  'https://*.doubleclick.net',
  'https://*.google.com',
  'https://*.gstatic.com',
] as const;
