import { Module } from '@nestjs/common';

import { AppConfigModule } from './config/config.module';
import { CoreModule } from './core/core.module';
import { LoggerModule } from './core/logger/logger.module';
import { GameModule } from './modules/game';
import { HealthModule } from './modules/health';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { ShareResultsModule } from './modules/share-results';

/**
 * Root module. Order matters: the global config module is validated first,
 * then the global pino logger module, then cross-cutting CoreModule (exception
 * filter + rate limiting), then feature modules.
 */
@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    CoreModule,
    HealthModule,
    PrivacyModule,
    GameModule,
    ShareResultsModule,
  ],
})
export class AppModule {}
