'use client';
// client-boundary-reason: logs the caught route error via useEffect, so route error.tsx files stay pure composition instead of embedding the effect.

import { useEffect } from 'react';

import { appLogger } from '@/packages/logger';

/**
 * Logs a route-segment error exactly once when the boundary mounts. Extracted
 * into a hook so the App Router `error.tsx` files stay pure JSX composition
 * (the tsx-pure-composition rule forbids inline effects in route TSX).
 */
export const useRouteErrorLogger = (error: Error & { digest?: string }): void => {
  useEffect(() => {
    appLogger.error('Route segment error boundary rendered', { digest: error.digest });
  }, [error]);
};
