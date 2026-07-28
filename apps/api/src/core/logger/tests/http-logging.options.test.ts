import type { IncomingMessage, ServerResponse } from 'node:http';

import pino from 'pino';
import { describe, expect, it } from 'vitest';

import { buildConfigStub } from '../../../tests/fixtures/stubs';
import { buildPinoHttpOptions } from '../http-logging.options';
import { DEV_LOG_TRANSPORT } from '../logger.constants';

const resolveLevel = (
  options: ReturnType<typeof buildPinoHttpOptions>,
  statusCode: number,
  error?: Error,
): string => {
  const customLogLevel = options.customLogLevel;
  if (typeof customLogLevel !== 'function') {
    throw new TypeError('customLogLevel must be a function');
  }
  const request = {} as IncomingMessage;
  const response = { statusCode } as ServerResponse;
  return customLogLevel(request, response, error);
};

describe('buildPinoHttpOptions', () => {
  it('redacts sensitive paths and uses the configured log level', () => {
    const options = buildPinoHttpOptions(buildConfigStub({ logLevel: 'debug' }));

    expect(options.level).toBe('debug');
    expect(options.redact).toBeDefined();
    expect(options.transport).toBeUndefined();
  });

  it('redacts the complete inbound header object, including Vercel security metadata', () => {
    const options = buildPinoHttpOptions(buildConfigStub());
    if (options.redact === undefined) {
      throw new TypeError('redact options must be configured');
    }
    const lines: string[] = [];
    const destination = {
      write(chunk: string): void {
        lines.push(chunk);
      },
    };
    const logger = pino({ redact: options.redact }, destination);

    logger.info({
      req: {
        headers: {
          authorization: 'Bearer auth-secret',
          'x-vercel-oidc-token': 'oidc-secret',
          'x-vercel-proxy-signature': 'proxy-secret',
          'x-forwarded-for': '203.0.113.42',
        },
        remoteAddress: '198.51.100.24',
        remotePort: 43_210,
        query: { _vercel_share: 'share-secret' },
      },
    });

    const output = lines.join('');
    expect(output).toContain('"headers":"[Redacted]"');
    expect(output).not.toContain('auth-secret');
    expect(output).not.toContain('oidc-secret');
    expect(output).not.toContain('proxy-secret');
    expect(output).not.toContain('203.0.113.42');
    expect(output).not.toContain('198.51.100.24');
    expect(output).not.toContain('43210');
    expect(output).not.toContain('share-secret');
  });

  it('attaches the pretty transport only in development', () => {
    const options = buildPinoHttpOptions(buildConfigStub({ isDevelopment: true }));

    expect(options.transport).toEqual(DEV_LOG_TRANSPORT);
  });

  it('escalates 5xx to error, 4xx to warn, and keeps 2xx at info', () => {
    const options = buildPinoHttpOptions(buildConfigStub());

    expect(resolveLevel(options, 500)).toBe('error');
    expect(resolveLevel(options, 404)).toBe('warn');
    expect(resolveLevel(options, 200)).toBe('info');
  });

  it('always logs at error level when the response carries an error', () => {
    const options = buildPinoHttpOptions(buildConfigStub());

    expect(resolveLevel(options, 200, new Error('boom'))).toBe('error');
  });
});
