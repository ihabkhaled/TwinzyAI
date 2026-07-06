import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AppExceptionFilter } from './errors/app-exception.filter';
import { UploadedImageInterceptor } from './http/uploaded-image.interceptor';
import { RateLimitModule } from './rate-limit/rate-limit.module';

/**
 * Cross-cutting wiring: the global exception filter, the rate-limit module
 * (which applies its own global guard), and the shared upload interceptor.
 */
@Module({
  imports: [RateLimitModule],
  providers: [{ provide: APP_FILTER, useClass: AppExceptionFilter }, UploadedImageInterceptor],
  exports: [UploadedImageInterceptor],
})
export class CoreModule {}
