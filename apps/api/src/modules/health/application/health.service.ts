import { Injectable } from '@nestjs/common';

import type { HealthResponse } from '@twinzy/shared';

import { API_SERVICE_NAME, API_SERVICE_VERSION } from '../model/health.constants';

@Injectable()
export class HealthService {
  public getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: API_SERVICE_NAME,
      version: API_SERVICE_VERSION,
      uptimeSeconds: process.uptime(),
    };
  }
}
