import { Module } from '@nestjs/common';

import { ResultAggregationService } from './application/result-aggregation.service';

@Module({
  providers: [ResultAggregationService],
  exports: [ResultAggregationService],
})
export class ResultAggregationModule {}
