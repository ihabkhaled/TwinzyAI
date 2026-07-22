import { ROUTE_PATHS } from './route-paths.constants';

/**
 * The ONLY routes where the ad loader may be injected: content-rich editorial
 * pages. This is a strict allowlist, so everything else — the game itself, the
 * payment popup return, ephemeral share pages, not-found, and any future
 * utility screen — ships ad-free by default without needing to be listed.
 *
 * Deliberately excluded and never to be added:
 * - `/game` (upload, camera, consent, payment, processing, and AI results),
 * - `/share/*` (AI-generated results),
 * - `/paymob/*` (payment flow).
 * Ads must never render beside AI-generated results or payment UI.
 */
export const AD_ELIGIBLE_PATHS: readonly string[] = [
  ROUTE_PATHS.home,
  ROUTE_PATHS.about,
  ROUTE_PATHS.howItWorks,
  ROUTE_PATHS.aiSafety,
  ROUTE_PATHS.faq,
  ROUTE_PATHS.help,
  ROUTE_PATHS.privacy,
  ROUTE_PATHS.terms,
];
