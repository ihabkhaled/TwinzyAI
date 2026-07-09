import type { ShareResultResponse } from '@twinzy/shared';

import { type AppQueryResult, useAppQuery } from '@/packages/query';

import { buildShareResultQueryKey } from '../model/share.constants';
import { fetchSharedResult } from '../services/share.service';

/**
 * Reads one temporary share by its UUID. A share is immutable for its lifetime,
 * so it is never refetched (infinite staleTime, no focus refetch) and a 404 is
 * not retried — the page shows the expired/not-found state immediately.
 */
export const useShareResultQuery = (shareId: string): AppQueryResult<ShareResultResponse> =>
  useAppQuery({
    queryKey: buildShareResultQueryKey(shareId),
    queryFn: () => fetchSharedResult(shareId),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
