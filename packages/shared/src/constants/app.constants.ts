export const APP_NAME = 'Twinzy';

export const MODEL_PROVIDER = 'Google Gemini';

export const API_GLOBAL_PREFIX = 'api';

export const API_VERSION = 'v1';

export const GAME_ANALYZE_PATH = '/api/v1/game/analyze';

/**
 * Streaming variant of the analyze route. Responds with text/event-stream and
 * keeps the connection alive with heartbeats + progress events, so the long
 * multi-step Gemini pipeline never hits an idle/response timeout.
 */
export const GAME_ANALYZE_STREAM_PATH = '/api/v1/game/analyze/stream';

export const HEALTH_PATH = '/api/v1/health';

export const RESULT_DISCLAIMER =
  'This is a playful style/vibe result based on written visible traits only. It is not face recognition, identity matching, or biometric comparison.';

export const NO_MATCH_FALLBACK_MESSAGE =
  'We could not find a confident style/vibe match this time. Try another photo with clearer lighting.';
