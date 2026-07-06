import { UPLOAD_HARD_CAP_BYTES } from '../modules/game/model/game.constants';

export const LISTEN_HOST = '0.0.0.0';

/**
 * Transport-level body cap: the multipart hard cap plus a 1 MiB margin for
 * multipart framing, so the plugin's fileSize limit (and its friendly
 * FILE_TOO_LARGE envelope) triggers before the raw transport limit does.
 */
export const BODY_LIMIT_MARGIN_BYTES = 1_048_576;

export const BODY_LIMIT_BYTES = UPLOAD_HARD_CAP_BYTES + BODY_LIMIT_MARGIN_BYTES;

export const DEFAULT_API_VERSION = '1';

export const CORS_ALLOWED_METHODS = ['GET', 'POST'] as const;

export const CORS_MAX_AGE_SECONDS = 3600;

export const BOOTSTRAP_LOG_CONTEXT = 'Bootstrap';

export const SWAGGER_PATH = 'docs';
export const SWAGGER_TITLE = 'Twinzy API';
export const SWAGGER_DESCRIPTION =
  'HTTP API for the Twinzy style/vibe game (free, anonymous, no persistence).';
export const SWAGGER_VERSION = '1.0.0';
