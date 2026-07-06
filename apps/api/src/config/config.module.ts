import path from 'node:path';

import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { AppConfigService } from './app-config.service';
import { validateEnv } from './env.schema';

/**
 * Env-file lookup order (first match wins, process.env always wins over
 * files): the app folder first, then the repo root, so both
 * `npm run dev:api` (cwd = apps/api) and Docker (cwd = /app) work.
 */
const ENV_FILE_PATHS: readonly string[] = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
];

/**
 * Owns the configuration vendor (@nestjs/config). Consumers inject the typed
 * AppConfigService; nothing outside src/config imports the vendor directly,
 * and nothing outside src/config + src/bootstrap reads process.env.
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: [...ENV_FILE_PATHS],
      validate: validateEnv,
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
