'use client';
// client-boundary-reason: wraps next/navigation router hooks that read client-side routing context.
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

import type { AppNavigation } from './navigation-types';

/** Memoized, typed access to the App Router: current path and imperative actions. */
export const useAppNavigation = (): AppNavigation => {
  const router = useRouter();
  const pathname = usePathname();

  return useMemo<AppNavigation>(
    () => ({
      pathname,
      push: (href): void => {
        router.push(href);
      },
      replace: (href): void => {
        router.replace(href);
      },
      back: (): void => {
        router.back();
      },
      refresh: (): void => {
        router.refresh();
      },
    }),
    [pathname, router],
  );
};
