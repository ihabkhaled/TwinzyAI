import { Module } from '@nestjs/common';

import { ResultAggregationService } from './services/result-aggregation.service';

@Module({
  providers: [ResultAggregationService],
  exports: [ResultAggregationService],
})
export class ResultAggregationModule {}
