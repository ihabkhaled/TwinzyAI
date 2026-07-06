import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from '../app.module';
import { bindAppLogger } from '../core/logger/bind-app-logger';

import { createFastifyAdapter } from './fastify-adapter';

/**
 * Constructs the Nest application on the Fastify adapter and routes all Nest
 * framework logs through the logger module (bufferLogs holds early logs
 * until the logger is attached). Configuration happens in the configure-*
 * steps.
 */
export const createApp = async (): Promise<NestFastifyApplication> => {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, createFastifyAdapter(), {
    bufferLogs: true,
  });
  bindAppLogger(app);
  return app;
};
