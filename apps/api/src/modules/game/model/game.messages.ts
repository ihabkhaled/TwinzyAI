/**
 * Operator/user-facing copy for stream lifecycle terminations. Kept in model/
 * like every sibling module's message copy; the frame-building logic stays in
 * lib/game-stream.ts.
 */
export const SERVER_BUSY_MESSAGE =
  'The vibe engine is busy right now. Please try again in a moment.';
export const DUPLICATE_REQUEST_MESSAGE = 'This analysis is already running.';
export const ANALYSIS_CANCELLED_MESSAGE = 'Analysis cancelled.';
export const ANALYSIS_TIMEOUT_MESSAGE =
  'The analysis took too long and was stopped. Please try again.';
