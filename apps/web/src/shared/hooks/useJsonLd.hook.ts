'use client';
// client-boundary-reason: appends the JSON-LD data block to document.head after mount (browser-only DOM API).

import { useEffect } from 'react';

import { getSafeWindow } from '@/packages/browser';

/**
 * Mounts one JSON-LD structured-data block into `<head>` for search engines.
 * The payload is assigned via `textContent` — never parsed as HTML — so no
 * dangerous-HTML API is involved anywhere. Google executes JavaScript when
 * indexing, so a client-injected data block is fully crawlable. The block is
 * removed on unmount so client-side navigation never leaks stale page data.
 */
export const useJsonLd = (json: string): void => {
  useEffect(() => {
    const doc = getSafeWindow()?.document;
    if (doc === undefined) {
      return;
    }
    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = json;
    doc.head.append(script);
    return (): void => {
      script.remove();
    };
  }, [json]);
};
