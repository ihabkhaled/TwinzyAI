import { buildSharePagePath } from '@twinzy/shared';

/**
 * Builds the absolute public share URL from the server-configured web origin
 * and a generated share id. Both inputs are trusted (config + minted UUID) —
 * no user input enters the URL, so it can never be attacker-shaped or an open
 * redirect. A trailing slash on the base is normalized so the path is joined
 * exactly once.
 */
export const buildShareUrl = (baseUrl: string, shareId: string): string => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBase}${buildSharePagePath(shareId)}`;
};
