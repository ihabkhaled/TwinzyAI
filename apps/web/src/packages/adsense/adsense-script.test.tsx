import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { AdsenseScript } from './adsense-script';

vi.mock('@/packages/env', () => ({
  publicEnv: { adsenseClientId: 'ca-pub-2415314275784926' },
}));

describe('AdsenseScript', () => {
  it('renders exactly one asynchronous global loader with the configured publisher id', () => {
    const script = AdsenseScript({ nonce: 'request-nonce' }) as ReactElement<
      Record<string, unknown>
    >;

    expect(script.type).toBe('script');
    expect(script.props).toMatchObject({
      async: true,
      crossOrigin: 'anonymous',
      nonce: 'request-nonce',
    });
    expect(String(script.props['src'])).toContain('client=ca-pub-2415314275784926');
  });
});
