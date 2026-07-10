import { describe, expect, it } from 'vitest';

import {
  GAME_ANALYZE_PATH,
  GAME_ANALYZE_STREAM_PATH,
  GAME_CANCEL_PATH,
  GAME_TRANSLATE_RESULT_PATH,
} from '@twinzy/shared';

import { JSON_ROUTE_BODY_LIMITS } from './bootstrap.constants';
import { jsonRouteBodyLimitFor } from './json-route-body-limit.util';

describe('jsonRouteBodyLimitFor', () => {
  it('caps the cancel route to its small JSON limit regardless of version prefix', () => {
    expect(jsonRouteBodyLimitFor(GAME_CANCEL_PATH)).toBe(8192);
  });

  it('caps the translate-result route to its larger JSON limit', () => {
    expect(jsonRouteBodyLimitFor(GAME_TRANSLATE_RESULT_PATH)).toBe(262_144);
  });

  it('leaves the multipart analyze routes on the global limit', () => {
    expect(jsonRouteBodyLimitFor(GAME_ANALYZE_PATH)).toBeUndefined();
    expect(jsonRouteBodyLimitFor(GAME_ANALYZE_STREAM_PATH)).toBeUndefined();
  });

  it('never matches a route that merely contains a capped suffix mid-path', () => {
    expect(jsonRouteBodyLimitFor(`${GAME_CANCEL_PATH}/audit`)).toBeUndefined();
  });

  it('exposes each configured cap far below the multipart global limit', () => {
    for (const { limitBytes } of JSON_ROUTE_BODY_LIMITS) {
      expect(limitBytes).toBeGreaterThan(0);
      expect(limitBytes).toBeLessThan(1_048_576);
    }
  });
});
