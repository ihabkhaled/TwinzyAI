import { Global, Module, RequestMethod } from '@nestjs/common';
import type { Params } from 'nestjs-pino';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

import { AppConfigService } from '../../config/app-config.service';

import { AppLogger } from './app-logger.service';
import { buildPinoHttpOptions } from './http-logging.options';
import { LOGGER_ALL_ROUTES_PATH } from './logger.constants';

/**
 * Owns the logging vendor (nestjs-pino / pino / pino-http). Everything
 * outside this folder logs through AppLogger — swap the vendor here and
 * nothing else changes.
 */
@Global()
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Params => ({
        pinoHttp: buildPinoHttpOptions(config),
        forRoutes: [{ path: LOGGER_ALL_ROUTES_PATH, method: RequestMethod.ALL }],
      }),
    }),
  ],
  providers: [AppLogger],
  exports: [PinoLoggerModule, AppLogger],
})
export class LoggerModule {}
