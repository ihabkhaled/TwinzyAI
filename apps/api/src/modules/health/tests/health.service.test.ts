import { describe, expect, it } from 'vitest';

import { HealthResponseSchema } from '@twinzy/shared';

import { API_SERVICE_NAME } from '../constants/health.constants';
import { HealthService } from '../services/health.service';

describe('HealthService', () => {
  it('returns a payload matching the shared health schema', () => {
    const service = new HealthService();

    const health = service.getHealth();

    expect(HealthResponseSchema.safeParse(health).success).toBe(true);
    expect(health.service).toBe(API_SERVICE_NAME);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
