import { describe, expect, it } from 'vitest';

import { JSON_ROUTE_BODY_LIMITS } from './bootstrap.constants';
import { jsonRouteBodyLimitFor } from './json-route-body-limit.util';

describe('jsonRouteBodyLimitFor', () => {
  it('caps the cancel route to its small JSON limit regardless of version prefix', () => {
    expect(jsonRouteBodyLimitFor('/api/v1/game/cancel')).toBe(8192);
  });

  it('caps the translate-result route to its larger JSON limit', () => {
    expect(jsonRouteBodyLimitFor('/api/v1/game/translate-result')).toBe(262_144);
  });

  it('leaves the multipart analyze routes on the global limit', () => {
    expect(jsonRouteBodyLimitFor('/api/v1/game/analyze')).toBeUndefined();
    expect(jsonRouteBodyLimitFor('/api/v1/game/analyze/stream')).toBeUndefined();
  });

  it('never matches a route that merely contains a capped suffix mid-path', () => {
    expect(jsonRouteBodyLimitFor('/api/v1/game/cancel/audit')).toBeUndefined();
  });

  it('exposes each configured cap far below the multipart global limit', () => {
    for (const { limitBytes } of JSON_ROUTE_BODY_LIMITS) {
      expect(limitBytes).toBeGreaterThan(0);
      expect(limitBytes).toBeLessThan(1_048_576);
    }
  });
});
