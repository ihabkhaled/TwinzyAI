import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UsePipes,
} from '@nestjs/common';

import type {
  CreateShareResultRequest,
  CreateShareResultResponse,
  ShareResultResponse,
} from '@twinzy/shared';
import { CreateShareResultRequestSchema, ShareIdSchema } from '@twinzy/shared';

import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import { createZodValidationPipe } from '../../../core/validation';
import { CreateShareResultUseCase } from '../application/create-share-result.use-case';
import { DeleteShareResultUseCase } from '../application/delete-share-result.use-case';
import { GetShareResultUseCase } from '../application/get-share-result.use-case';
import {
  CREATE_SHARE_THROTTLE,
  DELETE_SHARE_THROTTLE,
  READ_SHARE_THROTTLE,
} from '../model/share-result.constants';

/**
 * Thin transport for temporary shareable results. Every method parses its input
 * (strict body / UUID param) and delegates to exactly one use-case — no logic,
 * no image slot on any route.
 */
@ApiTags('share-results')
@Controller('share-results')
export class ShareResultsController {
  public constructor(
    private readonly createShareResultUseCase: CreateShareResultUseCase,
    private readonly getShareResultUseCase: GetShareResultUseCase,
    private readonly deleteShareResultUseCase: DeleteShareResultUseCase,
  ) {}

  @Post()
  @Throttle(CREATE_SHARE_THROTTLE)
  @UsePipes(createZodValidationPipe(CreateShareResultRequestSchema))
  public create(@Body() body: CreateShareResultRequest): Promise<CreateShareResultResponse> {
    return this.createShareResultUseCase.create(body);
  }

  @Get(':shareId')
  @Throttle(READ_SHARE_THROTTLE)
  public get(
    @Param('shareId', createZodValidationPipe(ShareIdSchema)) shareId: string,
  ): Promise<ShareResultResponse> {
    return this.getShareResultUseCase.get(shareId);
  }

  @Delete(':shareId')
  @Throttle(DELETE_SHARE_THROTTLE)
  @HttpCode(HttpStatus.NO_CONTENT)
  public remove(
    @Param('shareId', createZodValidationPipe(ShareIdSchema)) shareId: string,
  ): Promise<void> {
    return this.deleteShareResultUseCase.delete(shareId);
  }
}
