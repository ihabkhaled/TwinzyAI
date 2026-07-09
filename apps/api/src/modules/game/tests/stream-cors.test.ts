import { describe, expect, it } from 'vitest';

import { buildStreamCorsHeaders } from '../lib/stream-cors';

const ALLOWED = ['http://localhost:3000', 'https://twinzy.app'];

describe('buildStreamCorsHeaders', () => {
  it('echoes an allowed origin (hijacked SSE bypasses the framework CORS hook)', () => {
    expect(buildStreamCorsHeaders('http://localhost:3000', ALLOWED)).toEqual({
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      Vary: 'Origin',
    });
  });

  it('returns no CORS headers for an origin outside the allowlist', () => {
    expect(buildStreamCorsHeaders('https://evil.example', ALLOWED)).toEqual({});
  });

  it('returns no CORS headers when there is no Origin header', () => {
    expect(buildStreamCorsHeaders(undefined, ALLOWED)).toEqual({});
  });
});
