/**
 * Paths pino-http redacts from every log line. Extend this list whenever a
 * new sensitive header or body field is introduced.
 */
export const REDACT_PATHS: readonly string[] = [
  // Proxies inject credentials, signatures, cookies, and client addresses.
  // Inbound header values are not needed for application diagnostics.
  'req.headers',
  'req.remoteAddress',
  'req.remotePort',
  // URLs can carry bearer-like temporary share ids and query values.
  'req.url',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'res.headers["set-cookie"]',
];

export const REDACT_CENSOR = '[Redacted]';

/** Named path-to-regexp wildcard required by Nest 11 middleware routing. */
export const LOGGER_ALL_ROUTES_PATH = '{*path}';

/** Pretty, human-readable logs in local development only. Production stays JSON. */
export const DEV_LOG_TRANSPORT = {
  target: 'pino-pretty',
  options: {
    singleLine: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
  },
};
