import type { GameStreamMessage } from '@twinzy/shared';

/**
 * True when a streamed frame belongs to THIS run. The server stamps every frame
 * with the tab + request ids; a frame that carries a mismatching id is a
 * foreign/stale run's event and is dropped so a prior run can never leak its
 * progress into a new one. A frame missing the ids (older server) is accepted
 * for backward compatibility.
 */
export const isMatchingStreamFrame = (
  message: GameStreamMessage,
  tabId: string,
  requestId: string,
): boolean => {
  if (message.requestId !== undefined && message.requestId !== requestId) {
    return false;
  }
  if (message.tabId !== undefined && message.tabId !== tabId) {
    return false;
  }
  return true;
};
