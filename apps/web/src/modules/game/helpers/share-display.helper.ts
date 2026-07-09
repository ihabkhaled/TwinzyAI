import type { ShareResultResponse } from '@twinzy/shared';

import { SharePagePhase, type SharePagePhaseValue } from '../model/share.enums';

/**
 * Resolves the public share page's phase from the query + live countdown.
 * A load error is treated as not-found (privacy: a direct visit never reveals
 * whether an id once existed); a zero countdown flips an active view to expired
 * so the result is hidden the instant the timer ends.
 */
export const resolveSharePhase = (
  isLoading: boolean,
  isError: boolean,
  data: ShareResultResponse | undefined,
  isExpired: boolean,
): SharePagePhaseValue => {
  if (isLoading) {
    return SharePagePhase.Loading;
  }
  if (isError || data === undefined) {
    return SharePagePhase.NotFound;
  }
  if (isExpired) {
    return SharePagePhase.Expired;
  }
  return SharePagePhase.Active;
};
