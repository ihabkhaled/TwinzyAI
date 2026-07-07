/**
 * Reason markers set as the `reason` on a stream's AbortController so the
 * presenter can tell a deliberate client cancel, a socket disconnect, and a
 * watchdog/TTL timeout apart when it maps the termination to a terminal SSE
 * status. Namespaced strings keep them distinct from any provider abort reason.
 */
export const StreamAbortReason = {
  Cancel: 'twinzy:stream-cancel',
  Disconnect: 'twinzy:stream-disconnect',
  Timeout: 'twinzy:stream-timeout',
} as const;

export const STREAM_ABORT_REASON_VALUES = [
  StreamAbortReason.Cancel,
  StreamAbortReason.Disconnect,
  StreamAbortReason.Timeout,
] as const;

export type StreamAbortReasonValue = (typeof STREAM_ABORT_REASON_VALUES)[number];
