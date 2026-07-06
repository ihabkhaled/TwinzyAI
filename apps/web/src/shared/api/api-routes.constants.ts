/**
 * Canonical HTTP route surface the web app owns. The game gateway calls the
 * NestJS API directly through the http client's baseURL today; the gateway
 * prefix + builder are kept ready for a future Backend-for-Frontend proxy so
 * moving a call behind `/api/gateway/*` is a one-line change here.
 */
export const API_ROUTES = {
  health: '/api/health',
  gatewayPrefix: '/api/gateway',
} as const;

/**
 * Build a BFF gateway path for an upstream API path. Leading slashes on the
 * upstream path are stripped so the result is always exactly one normalized
 * `/api/gateway/<path>` with no doubled separators.
 */
export function buildGatewayPath(upstreamPath: string): string {
  const normalized = upstreamPath.replace(/^\/+/, '');

  return `${API_ROUTES.gatewayPrefix}/${normalized}`;
}
