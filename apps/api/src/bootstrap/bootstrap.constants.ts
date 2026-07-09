import { UPLOAD_HARD_CAP_BYTES } from '../modules/game/model/game.constants';

export const LISTEN_HOST = '0.0.0.0';

/**
 * Transport-level body cap: the multipart hard cap plus a 1 MiB margin for
 * multipart framing, so the plugin's fileSize limit (and its friendly
 * FILE_TOO_LARGE envelope) triggers before the raw transport limit does.
 */
export const BODY_LIMIT_MARGIN_BYTES = 1_048_576;

export const BODY_LIMIT_BYTES = UPLOAD_HARD_CAP_BYTES + BODY_LIMIT_MARGIN_BYTES;

/**
 * Per-route request-body caps for the JSON endpoints, keyed by route-path
 * suffix. The global {@link BODY_LIMIT_BYTES} is sized for the multipart image
 * upload (~11 MiB); these far-tighter caps are applied as Fastify's native
 * per-route `bodyLimit` (via the `onRoute` hook in `configureSecurity`), so an
 * oversized JSON body is rejected with the same native 413 long before it can
 * be buffered or parsed — defence in depth on top of the strict zod schemas.
 * The cancel body is three uuids; the translate-result body carries a full game
 * result, so it gets the larger cap.
 */
export const JSON_ROUTE_BODY_LIMITS: readonly {
  readonly suffix: string;
  readonly limitBytes: number;
}[] = [
  { suffix: '/game/cancel', limitBytes: 8192 },
  { suffix: '/game/translate-result', limitBytes: 262_144 },
];

export const DEFAULT_API_VERSION = '1';

export const CORS_ALLOWED_METHODS = ['GET', 'POST'] as const;

export const CORS_MAX_AGE_SECONDS = 3600;

export const BOOTSTRAP_LOG_CONTEXT = 'Bootstrap';

export const SWAGGER_PATH = 'docs';
export const SWAGGER_TITLE = 'Twinzy API';
export const SWAGGER_DESCRIPTION =
  'HTTP API for the Twinzy style/vibe game (free, anonymous, no persistence).';
export const SWAGGER_VERSION = '1.0.0';
