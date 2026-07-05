import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_TTL_MS } from './common/constants/rate-limit.constant';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigModule } from './config/app-config.module';
import { LoggerModule } from './infrastructure/logger/logger.module';
import { GameModule } from './modules/game/game.module';
import { HealthModule } from './modules/health/health.module';
import { PrivacyModule } from './modules/privacy/privacy.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ThrottlerModule.forRoot([{ ttl: RATE_LIMIT_TTL_MS, limit: RATE_LIMIT_MAX_REQUESTS }]),
    HealthModule,
    PrivacyModule,
    GameModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
