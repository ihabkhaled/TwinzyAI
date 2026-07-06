import { Controller, Get } from '@nestjs/common';

import type { HealthResponse } from '@twinzy/shared';

import { ApiTags } from '../../../core/openapi';
import { HealthService } from '../application/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  public constructor(private readonly healthService: HealthService) {}

  @Get()
  public getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
