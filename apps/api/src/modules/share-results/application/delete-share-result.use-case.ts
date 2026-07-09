import { Injectable } from '@nestjs/common';

import { ShareResultCacheService } from './share-result-cache.service';

/**
 * Delete flow: idempotently drop a share record before its TTL. Deleting an
 * unknown or already-expired id is a no-op (still 204) so the endpoint never
 * reveals whether an id existed.
 */
@Injectable()
export class DeleteShareResultUseCase {
  public constructor(private readonly cache: ShareResultCacheService) {}

  public delete(shareId: string): Promise<void> {
    return this.cache.remove(shareId);
  }
}
