import { Controller, Post, UseInterceptors } from '@nestjs/common';

import type { FinalGameResult } from '@twinzy/shared';

import { MultipartBody } from '../../../core/http/multipart-body.decorator';
import { UploadedImage } from '../../../core/http/uploaded-image.decorator';
import { UploadedImageInterceptor } from '../../../core/http/uploaded-image.interceptor';
import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import type { UploadedImageFile } from '../../file-security';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { ANALYZE_THROTTLE } from '../model/game.constants';

@ApiTags('game')
@Controller('game')
export class GameController {
  public constructor(private readonly analyzeGameUseCase: AnalyzeGameUseCase) {}

  @Post('analyze')
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(UploadedImageInterceptor)
  public analyze(
    @UploadedImage() file: UploadedImageFile | undefined,
    @MultipartBody() body: unknown,
  ): Promise<FinalGameResult> {
    return this.analyzeGameUseCase.analyze(file, body);
  }
}
