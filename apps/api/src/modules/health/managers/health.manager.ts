import { Injectable } from '@nestjs/common';

import type { HealthResponse } from '@twinzy/shared';

import { HealthService } from '../services/health.service';

@Injectable()
export class HealthManager {
  public constructor(private readonly healthService: HealthService) {}

  public getHealth(): HealthResponse {
    return this.healthService.getHealth();
  }
}
