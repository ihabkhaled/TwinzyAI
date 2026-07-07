/**
 * The lifecycle status carried on every streaming-analyze SSE frame. It sits
 * above the per-event granularity (`GameStreamEvent`): the client can drive one
 * simple terminal-state machine no matter which event delivered the update, and
 * multiple concurrent tabs/requests can reason about their own run's outcome.
 *
 * `Queued` and `Active` are non-terminal; `Completed`, `Failed`, `Cancelled`,
 * and `Rejected` are terminal (see `isTerminalStreamStatus`). `Rejected` is the
 * overload/back-pressure outcome (the server refused or dropped the run);
 * `Cancelled` is a deliberate client or disconnect abort.
 */
export const StreamStatus = {
  Queued: 'queued',
  Active: 'active',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  Rejected: 'rejected',
} as const;

export const STREAM_STATUS_VALUES = [
  StreamStatus.Queued,
  StreamStatus.Active,
  StreamStatus.Completed,
  StreamStatus.Failed,
  StreamStatus.Cancelled,
  StreamStatus.Rejected,
] as const;

export type StreamStatusValue = (typeof STREAM_STATUS_VALUES)[number];

/** The subset of statuses after which no further frames may arrive. */
export const TERMINAL_STREAM_STATUS_VALUES = [
  StreamStatus.Completed,
  StreamStatus.Failed,
  StreamStatus.Cancelled,
  StreamStatus.Rejected,
] as const;

const TERMINAL_STREAM_STATUS_SET: ReadonlySet<StreamStatusValue> = new Set(
  TERMINAL_STREAM_STATUS_VALUES,
);

/** True once a stream has reached a status that admits no further frames. */
export const isTerminalStreamStatus = (status: StreamStatusValue): boolean =>
  TERMINAL_STREAM_STATUS_SET.has(status);
