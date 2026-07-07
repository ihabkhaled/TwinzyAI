import { Body, Controller, Headers, Post, Res, UseInterceptors, UsePipes } from '@nestjs/common';

import type { FinalGameResult, TranslateResultRequest } from '@twinzy/shared';
import { TranslateResultRequestSchema } from '@twinzy/shared';

import { MultipartBody } from '../../../core/http/multipart-body.decorator';
import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import { UploadedImage } from '../../../core/http/uploaded-image.decorator';
import { UploadedImageInterceptor } from '../../../core/http/uploaded-image.interceptor';
import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import { createZodValidationPipe } from '../../../core/validation';
import type { UploadedImageFile } from '../../file-security';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { TranslateResultUseCase } from '../application/translate-result.use-case';
import { ANALYZE_THROTTLE, TRANSLATE_THROTTLE } from '../model/game.constants';

import { GameStreamPresenter } from './game-stream.presenter';

@ApiTags('game')
@Controller('game')
export class GameController {
  public constructor(
    private readonly analyzeGameUseCase: AnalyzeGameUseCase,
    private readonly translateResultUseCase: TranslateResultUseCase,
    private readonly gameStreamPresenter: GameStreamPresenter,
  ) {}

  @Post('analyze')
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(UploadedImageInterceptor)
  public analyze(
    @UploadedImage() file: UploadedImageFile | undefined,
    @MultipartBody() body: unknown,
  ): Promise<FinalGameResult> {
    return this.analyzeGameUseCase.analyze(file, body);
  }

  @Post('analyze/stream')
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(UploadedImageInterceptor)
  public analyzeStream(
    @UploadedImage() file: UploadedImageFile | undefined,
    @MultipartBody() body: unknown,
    @Headers('origin') origin: string | undefined,
    @Res() reply: SseCapableReplyLike,
  ): Promise<void> {
    return this.gameStreamPresenter.stream(file, body, origin, reply);
  }

  @Post('translate-result')
  @Throttle(TRANSLATE_THROTTLE)
  @UsePipes(createZodValidationPipe(TranslateResultRequestSchema))
  public translateResult(@Body() body: TranslateResultRequest): Promise<FinalGameResult> {
    return this.translateResultUseCase.translate(body);
  }
}
