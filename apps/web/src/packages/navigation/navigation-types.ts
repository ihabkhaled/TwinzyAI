import type { Route } from 'next';

/** Stable, memoized navigation surface exposed by {@link useAppNavigation}. */
export interface AppNavigation {
  pathname: string;
  push: (href: Route) => void;
  replace: (href: Route) => void;
  back: () => void;
  refresh: () => void;
}
