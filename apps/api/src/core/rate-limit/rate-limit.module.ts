import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppConfigService } from '../../config/app-config.service';

/**
 * Owns the rate-limiting vendor (@nestjs/throttler) and applies it as a
 * global guard from typed config. Swapping the vendor touches only this
 * folder; controllers import the Throttle decorator from here.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): ThrottlerModuleOptions => ({
        throttlers: [{ ttl: config.rateLimitTtlMs, limit: config.rateLimitMax }],
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class RateLimitModule {}
