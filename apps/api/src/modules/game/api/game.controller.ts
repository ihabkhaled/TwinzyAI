import { Body, Controller, Post, Res, UseInterceptors, UsePipes } from '@nestjs/common';

import type {
  CancelAnalysisRequest,
  CancelAnalysisResponse,
  FinalGameResult,
  TranslateResultRequest,
} from '@twinzy/shared';
import { CancelAnalysisRequestSchema, TranslateResultRequestSchema } from '@twinzy/shared';

import { MultipartBody } from '../../../core/http/multipart-body.decorator';
import type { SseCapableReplyLike } from '../../../core/http/sse.types';
import { StreamMeta } from '../../../core/http/stream-meta.decorator';
import type { StreamRequestMeta } from '../../../core/http/stream-meta.types';
import { UploadedImage } from '../../../core/http/uploaded-image.decorator';
import { UploadedImageInterceptor } from '../../../core/http/uploaded-image.interceptor';
import { ApiTags } from '../../../core/openapi';
import { Throttle } from '../../../core/rate-limit';
import { createZodValidationPipe } from '../../../core/validation';
import type { UploadedImageFile } from '../../file-security';
import { AnalyzeGameUseCase } from '../application/analyze-game.use-case';
import { CancelAnalysisUseCase } from '../application/cancel-analysis.use-case';
import { TranslateResultUseCase } from '../application/translate-result.use-case';
import {
  ANALYZE_THROTTLE,
  CANCEL_THROTTLE,
  GAME_ROUTE_ANALYZE,
  GAME_ROUTE_ANALYZE_STREAM,
  GAME_ROUTE_CANCEL,
  GAME_ROUTE_ROOT,
  GAME_ROUTE_TRANSLATE_RESULT,
  TRANSLATE_THROTTLE,
} from '../model/game.constants';

import { GameStreamPresenter } from './game-stream.presenter';

@ApiTags('game')
@Controller(GAME_ROUTE_ROOT)
export class GameController {
  public constructor(
    private readonly analyzeGameUseCase: AnalyzeGameUseCase,
    private readonly translateResultUseCase: TranslateResultUseCase,
    private readonly cancelAnalysisUseCase: CancelAnalysisUseCase,
    private readonly gameStreamPresenter: GameStreamPresenter,
  ) {}

  @Post(GAME_ROUTE_ANALYZE)
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(UploadedImageInterceptor)
  public analyze(
    @UploadedImage() file: UploadedImageFile | undefined,
    @MultipartBody() body: unknown,
  ): Promise<FinalGameResult> {
    return this.analyzeGameUseCase.analyze(file, body);
  }

  @Post(GAME_ROUTE_ANALYZE_STREAM)
  @Throttle(ANALYZE_THROTTLE)
  @UseInterceptors(UploadedImageInterceptor)
  public analyzeStream(
    @UploadedImage() file: UploadedImageFile | undefined,
    @MultipartBody() body: unknown,
    @StreamMeta() meta: StreamRequestMeta,
    @Res() reply: SseCapableReplyLike,
  ): Promise<void> {
    return this.gameStreamPresenter.stream({ file, body, reply, ...meta });
  }

  @Post(GAME_ROUTE_CANCEL)
  @Throttle(CANCEL_THROTTLE)
  @UsePipes(createZodValidationPipe(CancelAnalysisRequestSchema))
  public cancelAnalysis(@Body() body: CancelAnalysisRequest): CancelAnalysisResponse {
    return this.cancelAnalysisUseCase.cancel(body);
  }

  @Post(GAME_ROUTE_TRANSLATE_RESULT)
  @Throttle(TRANSLATE_THROTTLE)
  @UsePipes(createZodValidationPipe(TranslateResultRequestSchema))
  public translateResult(@Body() body: TranslateResultRequest): Promise<FinalGameResult> {
    return this.translateResultUseCase.translate(body);
  }
}
