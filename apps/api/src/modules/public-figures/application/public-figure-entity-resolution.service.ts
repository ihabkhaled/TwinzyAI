import { Injectable } from '@nestjs/common';

import type { PublicFigureProfile } from '@twinzy/shared';

import { PublicFigureCatalogRepository } from '../infrastructure/public-figure-catalog.repository';

@Injectable()
export class PublicFigureEntityResolutionService {
  public constructor(private readonly catalog: PublicFigureCatalogRepository) {}

  public resolve(value: string): PublicFigureProfile | undefined {
    const normalized = value.trim().toLocaleLowerCase('en');
    return this.catalog.list().find((profile) => {
      const names = [profile.entityId, profile.canonicalName, ...profile.aliases];
      return names.some((name) => name.toLocaleLowerCase('en') === normalized);
    });
  }
}
