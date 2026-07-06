import { describe, expect, it } from 'vitest';

import { API_ROUTES, buildGatewayPath } from './api-routes.constants';

describe('API_ROUTES', () => {
  it('exposes the health and gateway-prefix paths', () => {
    expect(API_ROUTES.health).toBe('/api/health');
    expect(API_ROUTES.gatewayPrefix).toBe('/api/gateway');
  });
});

describe('buildGatewayPath', () => {
  it('strips a single leading slash from the upstream path', () => {
    expect(buildGatewayPath('/game/analyze')).toBe('/api/gateway/game/analyze');
  });

  it('accepts an upstream path with no leading slash', () => {
    expect(buildGatewayPath('game/analyze')).toBe('/api/gateway/game/analyze');
  });

  it('collapses multiple leading slashes to one normalized path', () => {
    expect(buildGatewayPath('///health')).toBe('/api/gateway/health');
  });

  it('handles an empty upstream path as the gateway root', () => {
    expect(buildGatewayPath('')).toBe('/api/gateway/');
  });

  it('preserves interior slashes and nested segments', () => {
    expect(buildGatewayPath('/v1/game/analyze/stream')).toBe('/api/gateway/v1/game/analyze/stream');
  });
});
