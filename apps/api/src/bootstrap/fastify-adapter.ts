import { randomUUID } from 'node:crypto';

import { FastifyAdapter } from '@nestjs/platform-fastify';

import { BODY_LIMIT_BYTES } from './bootstrap.constants';

/**
 * Builds the Fastify adapter: bounded body size, a per-request UUID for log
 * correlation (picked up by pino-http as req.id), and proxy trust that is OFF
 * by default and only enabled behind a TRUSTED reverse proxy (TRUST_PROXY=true).
 * Trusting X-Forwarded-* unconditionally would let a directly-exposed container
 * spoof client IPs and bypass the per-IP throttle + analysis caps.
 */
export const createFastifyAdapter = (): FastifyAdapter =>
  new FastifyAdapter({
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: process.env['TRUST_PROXY'] === 'true',
    genReqId: () => randomUUID(),
  });
