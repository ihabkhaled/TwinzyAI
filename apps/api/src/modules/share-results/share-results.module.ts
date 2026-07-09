import { Module } from '@nestjs/common';

import { ShareResultsController } from './api/share-results.controller';
import { CreateShareResultUseCase } from './application/create-share-result.use-case';
import { DeleteShareResultUseCase } from './application/delete-share-result.use-case';
import { GetShareResultUseCase } from './application/get-share-result.use-case';
import { ShareResultCacheService } from './application/share-result-cache.service';
import { ShareResultSafetyService } from './application/share-result-safety.service';
import { InMemoryShareResultCacheRepository } from './infrastructure/in-memory-share-result-cache.repository';
import { SHARE_RESULT_CACHE } from './model/share-result.port';

/**
 * Temporary shareable results. The cache port is bound to the in-memory TTL
 * driver — the only built driver today (Redis/Valkey is the documented
 * production extension of the same port). No database, no image storage.
 */
@Module({
  controllers: [ShareResultsController],
  providers: [
    CreateShareResultUseCase,
    GetShareResultUseCase,
    DeleteShareResultUseCase,
    ShareResultCacheService,
    ShareResultSafetyService,
    { provide: SHARE_RESULT_CACHE, useClass: InMemoryShareResultCacheRepository },
  ],
})
export class ShareResultsModule {}
