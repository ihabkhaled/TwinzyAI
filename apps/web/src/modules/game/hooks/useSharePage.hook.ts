'use client';
// client-boundary-reason: reads the share result by UUID from the query cache and drives the live countdown, both client-only.

import type { FinalGameResult } from '@twinzy/shared';

import { resolveSharePhase } from '../helpers/share-display.helper';
import { SharePagePhase } from '../model/share.enums';
import type { SharePageController } from '../model/share.types';
import { useShareResultQuery } from '../queries/share.queries';

import { useCountdown } from './useCountdown.hook';

/**
 * Orchestrates the public share page: fetches the result by its UUID, seeds the
 * countdown from the authoritative server `remainingSeconds`, and derives the
 * phase. Once the countdown hits zero the result is dropped from the returned
 * value, so an expired page can never keep showing a stale result.
 */
export const useSharePage = (shareId: string): SharePageController => {
  const query = useShareResultQuery(shareId);
  const { remainingSeconds, isExpired } = useCountdown(query.data?.remainingSeconds ?? 0);

  const phase = resolveSharePhase(query.isLoading, query.isError, query.data, isExpired);
  const result: FinalGameResult | undefined =
    phase === SharePagePhase.Active ? query.data?.result : undefined;

  return { phase, result, remainingSeconds };
};
