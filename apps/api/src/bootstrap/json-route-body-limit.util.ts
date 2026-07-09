import { JSON_ROUTE_BODY_LIMITS } from './bootstrap.constants';

/**
 * Resolve the tighter per-route body cap for a JSON endpoint from its
 * registered path, or `undefined` when the route keeps the global multipart
 * limit. Matching is suffix-based so it is independent of the global API
 * version/prefix the route is mounted under.
 */
export const jsonRouteBodyLimitFor = (routeUrl: string): number | undefined =>
  JSON_ROUTE_BODY_LIMITS.find((entry) => routeUrl.endsWith(entry.suffix))?.limitBytes;
