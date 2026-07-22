import { AD_ELIGIBLE_PATHS } from '@/shared/constants/ad-routes.constants';

/**
 * Route-based ad control: true only for the editorial pages on the explicit
 * allowlist. Unknown, missing, or malformed paths are ad-ineligible, so every
 * failure mode fails CLOSED to the ad-free experience — the game, share,
 * payment, and error surfaces can never load the ad script.
 */
export const isAdEligiblePath = (pathname: string | null | undefined): boolean => {
  if (typeof pathname !== 'string' || pathname === '') {
    return false;
  }
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  return AD_ELIGIBLE_PATHS.includes(normalized);
};
