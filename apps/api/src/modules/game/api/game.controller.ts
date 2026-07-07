import { Controller, Headers, Post, Res, UseInterceptors } from '@nestjs/common';

import type { FinalGameResult } from '@twinzy/shared';

import { MultipartBody } from '../../../core/http/multipart-body.decorator';
import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import { UploadedImage } from '../../../core/http/uploaded-image.decorator';
import { UploadedImageInterceptor } from '../../../core/http/uploaded-image.interceptor';
import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import type { UploadedImageFile } from '../../file-security';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { ANALYZE_THROTTLE } from '../model/game.constants';

import { GameStreamPresenter } from './game-stream.presenter';

@ApiTags('game')
@Controller('game')
export class GameController {
  public constructor(
    private readonly analyzeGameUseCase: AnalyzeGameUseCase,
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
}
