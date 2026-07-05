import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';

import { API_GLOBAL_PREFIX } from '@twinzy/shared';

import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { LoggerService } from './infrastructure/logger/logger.service';

import 'reflect-metadata';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);
  const logger = app.get(LoggerService);

  app.use(helmet());
  app.enableCors({
    origin: [...config.corsAllowedOrigins],
    methods: ['GET', 'POST'],
    maxAge: 3600,
  });
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableShutdownHooks();

  await app.listen(config.apiPort);
  logger.log('Bootstrap', `API listening on port ${config.apiPort} (${config.nodeEnv})`);
};

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`Fatal bootstrap error: ${message}\n`);
  process.exitCode = 1;
});
