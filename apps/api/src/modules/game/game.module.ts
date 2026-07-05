import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { FileSecurityModule } from '../file-security/file-security.module';
import { ResultAggregationModule } from '../result-aggregation/result-aggregation.module';

import { GameController } from './controllers/game.controller';
import { GameManager } from './managers/game.manager';

@Module({
  imports: [AiModule, FileSecurityModule, ResultAggregationModule],
  controllers: [GameController],
  providers: [GameManager],
})
export class GameModule {}
