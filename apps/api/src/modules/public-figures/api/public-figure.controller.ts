import { Controller, Get, Param, Query } from '@nestjs/common';

import type { LanguageCodeValue, PublicFigureEnrichment } from '@twinzy/shared';
import { LanguageCodeSchema, PublicFigureEntityIdSchema } from '@twinzy/shared';

import { ApiTags } from '../../../core/openapi';
import { createZodValidationPipe } from '../../../core/validation';
import { GetPublicFigureDetailsUseCase } from '../application/get-public-figure-details.use-case';

@ApiTags('public-figures')
@Controller('public-figures')
export class PublicFigureController {
  public constructor(private readonly getDetails: GetPublicFigureDetailsUseCase) {}

  @Get(':entityId')
  public details(
    @Param('entityId', createZodValidationPipe(PublicFigureEntityIdSchema)) entityId: string,
    @Query('languageCode', createZodValidationPipe(LanguageCodeSchema))
    languageCode: LanguageCodeValue,
  ): Promise<PublicFigureEnrichment> {
    return this.getDetails.execute(entityId, languageCode);
  }
}
