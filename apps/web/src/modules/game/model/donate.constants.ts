/**
 * Voluntary-donation link constants. The base URL is hardcoded (scheme + host
 * are never configurable) so the only variable part of the outbound URL is the
 * strictly-validated alphanumeric handle from the public env. Donations are
 * strictly voluntary: the game itself stays free and nothing is ever gated on
 * payment (CLAUDE.md, Twinzy Product Constraints #1).
 */
export const PAYPAL_ME_BASE_URL = 'https://paypal.me';
