import { Module } from '@nestjs/common';

import { HealthController } from './controllers/health.controller';
import { HealthManager } from './managers/health.manager';
import { HealthService } from './services/health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthManager, HealthService],
})
export class HealthModule {}
