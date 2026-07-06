import type { Level } from 'pino';
import type { Options } from 'pino-http';

import type { AppConfigService } from '../../config/app-config.service';
import { CLIENT_ERROR_MIN_STATUS, SERVER_ERROR_MIN_STATUS } from '../http/http-status.constants';

import { DEV_LOG_TRANSPORT, REDACT_CENSOR, REDACT_PATHS } from './logger.constants';

const levelForStatus = (statusCode: number): Level => {
  if (statusCode >= SERVER_ERROR_MIN_STATUS) {
    return 'error';
  }
  if (statusCode >= CLIENT_ERROR_MIN_STATUS) {
    return 'warn';
  }
  return 'info';
};

/**
 * Every request/response is logged by pino-http; error responses (4xx/5xx)
 * are escalated to warn/error so failures are never silent. Sensitive
 * headers and body fields are redacted on every line.
 */
export const buildPinoHttpOptions = (config: AppConfigService): Options => {
  const options: Options = {
    level: config.logLevel,
    autoLogging: true,
    redact: { paths: [...REDACT_PATHS], censor: REDACT_CENSOR },
    customLogLevel: (_request, response, error) =>
      error === undefined ? levelForStatus(response.statusCode) : 'error',
  };

  if (config.isDevelopment) {
    return { ...options, transport: DEV_LOG_TRANSPORT };
  }

  return options;
};
