import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useJsonLd } from './useJsonLd.hook';

const findBlocks = (): NodeListOf<HTMLScriptElement> =>
  document.head.querySelectorAll('script[type="application/ld+json"]');

describe('useJsonLd', () => {
  it('mounts one JSON-LD data block into head and removes it on unmount', () => {
    const json = '{"@type":"FAQPage"}';

    const { unmount } = renderHook(() => {
      useJsonLd(json);
    });

    const blocks = findBlocks();
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.textContent).toBe(json);

    unmount();

    expect(findBlocks()).toHaveLength(0);
  });

  it('replaces the block when the payload changes instead of stacking blocks', () => {
    const { rerender, unmount } = renderHook(
      ({ json }: { json: string }) => {
        useJsonLd(json);
      },
      { initialProps: { json: '{"a":1}' } },
    );

    rerender({ json: '{"b":2}' });

    const blocks = findBlocks();
    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.textContent).toBe('{"b":2}');

    unmount();
  });
});
