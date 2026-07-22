'use client';
// client-boundary-reason: mounts the JSON-LD data block into document.head via the useJsonLd hook (browser-only).

import { useJsonLd } from '@/shared/hooks/useJsonLd.hook';

import type { JsonLdScriptProps } from '../types/shared-component.types';

/**
 * Embeds a JSON-LD structured-data block for search engines. The payload is
 * serialized (and `<`-escaped) upstream by `serializeJsonLd` and mounted via
 * `textContent`, so nothing is ever parsed as HTML. Renders no visible output.
 */
export function JsonLdScript({ json }: Readonly<JsonLdScriptProps>): null {
  useJsonLd(json);

  return null;
}
