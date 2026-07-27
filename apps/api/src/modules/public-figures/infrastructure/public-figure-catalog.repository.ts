import { Injectable, Optional } from '@nestjs/common';

import type { PublicFigureProfile } from '@twinzy/shared';

import { VERIFIED_PUBLIC_FIGURE_CATALOG } from '../model/verified-public-figure-catalog.constants';

@Injectable()
export class PublicFigureCatalogRepository {
  public constructor(
    @Optional()
    private readonly profiles: readonly PublicFigureProfile[] = VERIFIED_PUBLIC_FIGURE_CATALOG,
  ) {}

  public list(): readonly PublicFigureProfile[] {
    const byEntityId = new Map<string, PublicFigureProfile>();
    for (const profile of this.profiles) {
      if (!byEntityId.has(profile.entityId)) {
        byEntityId.set(profile.entityId, profile);
      }
    }
    const profiles: PublicFigureProfile[] = [];
    byEntityId.forEach((profile) => {
      profiles.push(profile);
    });
    return profiles;
  }

  public findByEntityId(entityId: string): PublicFigureProfile | undefined {
    return this.list().find((profile) => profile.entityId === entityId);
  }
}
