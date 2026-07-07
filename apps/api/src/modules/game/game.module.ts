import { Module } from '@nestjs/common';

import { StreamingModule } from '../../core/streaming';
import { AiModule } from '../ai';
import { FileSecurityModule } from '../file-security';
import { PrivacyModule } from '../privacy';
import { ResultAggregationModule } from '../result-aggregation';

import { GameController } from './api/game.controller';
import { GameStreamPresenter } from './api/game-stream.presenter';
import { AnalyzeGameUseCase } from './application/analyze-game.use-case';
import { AnalyzeGameStreamUseCase } from './application/analyze-game-stream.use-case';
import { CancelAnalysisUseCase } from './application/cancel-analysis.use-case';
import { StyleMatchService } from './application/style-match.service';
import { TranslateResultUseCase } from './application/translate-result.use-case';

@Module({
  imports: [StreamingModule, AiModule, FileSecurityModule, ResultAggregationModule, PrivacyModule],
  controllers: [GameController],
  providers: [
    AnalyzeGameUseCase,
    AnalyzeGameStreamUseCase,
    TranslateResultUseCase,
    CancelAnalysisUseCase,
    StyleMatchService,
    GameStreamPresenter,
  ],
})
export class GameModule {}
