/**
 * The event types the streaming analyze endpoint emits over SSE.
 * `Heartbeat` carries no payload and exists only to keep the connection warm;
 * every other event marks a pipeline milestone or a terminal outcome.
 */
export const GameStreamEvent = {
  Accepted: 'accepted',
  Stage: 'stage',
  Result: 'result',
  Error: 'error',
  Heartbeat: 'heartbeat',
} as const;

export const GAME_STREAM_EVENT_VALUES = [
  GameStreamEvent.Accepted,
  GameStreamEvent.Stage,
  GameStreamEvent.Result,
  GameStreamEvent.Error,
  GameStreamEvent.Heartbeat,
] as const;

export type GameStreamEventValue = (typeof GAME_STREAM_EVENT_VALUES)[number];

/**
 * The ordered pipeline stages reported through `stage` events. The client maps
 * these to friendly progress copy; they carry no user data.
 */
export const GameStreamStage = {
  Validating: 'validating',
  ExtractingTraits: 'extracting-traits',
  GeneratingCandidates: 'generating-candidates',
  Judging: 'judging',
  Aggregating: 'aggregating',
} as const;

export const GAME_STREAM_STAGE_VALUES = [
  GameStreamStage.Validating,
  GameStreamStage.ExtractingTraits,
  GameStreamStage.GeneratingCandidates,
  GameStreamStage.Judging,
  GameStreamStage.Aggregating,
] as const;

export type GameStreamStageValue = (typeof GAME_STREAM_STAGE_VALUES)[number];
