import { Module } from '@nestjs/common';

import { AiModule } from '../ai';
import { FileSecurityModule } from '../file-security';
import { PrivacyModule } from '../privacy';
import { ResultAggregationModule } from '../result-aggregation';

import { GameController } from './api/game.controller';
import { AnalyzeGameUseCase } from './application/analyze-game.use-case';
import { StyleMatchService } from './application/style-match.service';

@Module({
  imports: [AiModule, FileSecurityModule, ResultAggregationModule, PrivacyModule],
  controllers: [GameController],
  providers: [AnalyzeGameUseCase, StyleMatchService],
})
export class GameModule {}
