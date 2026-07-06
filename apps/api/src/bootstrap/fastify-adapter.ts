import { randomUUID } from 'node:crypto';

import { FastifyAdapter } from '@nestjs/platform-fastify';

import { BODY_LIMIT_BYTES } from './bootstrap.constants';

/**
 * Builds the Fastify adapter: bounded body size, proxy-aware, and a
 * per-request UUID used for log correlation (picked up by pino-http as
 * req.id).
 */
export const createFastifyAdapter = (): FastifyAdapter =>
  new FastifyAdapter({
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: true,
    genReqId: () => randomUUID(),
  });
