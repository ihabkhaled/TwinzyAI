import { describe, expect, it } from 'vitest';

import { HealthResponseSchema } from '@twinzy/shared';

import { HealthService } from '../application/health.service';
import { API_SERVICE_NAME } from '../model/health.constants';

describe('HealthService', () => {
  it('returns a payload matching the shared health schema', () => {
    const service = new HealthService();

    const health = service.getHealth();

    expect(HealthResponseSchema.safeParse(health).success).toBe(true);
    expect(health.service).toBe(API_SERVICE_NAME);
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
