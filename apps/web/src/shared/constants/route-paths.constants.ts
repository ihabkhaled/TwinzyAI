import type { Route } from 'next';

/**
 * Every first-class route in the Twinzy app, typed as `Route` so callers get
 * Next.js typed-routes checking. The `as Route` casts become fully checked once
 * `experimental.typedRoutes` is enabled by the app-shell wave; until then
 * `Route` resolves to a branded string, so these remain correct either way.
 */
export const ROUTE_PATHS = {
  home: '/' as Route,
  game: '/game' as Route,
  help: '/help' as Route,
  privacy: '/privacy' as Route,
  terms: '/terms' as Route,
} as const;

export type AppRoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];
