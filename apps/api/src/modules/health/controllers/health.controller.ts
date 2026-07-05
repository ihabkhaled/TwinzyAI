import { Controller, Get } from '@nestjs/common';

import type { HealthResponse } from '@twinzy/shared';

import { HealthManager } from '../managers/health.manager';

@Controller('health')
export class HealthController {
  public constructor(private readonly healthManager: HealthManager) {}

  @Get()
  public getHealth(): HealthResponse {
    return this.healthManager.getHealth();
  }
}
