import type { ReactElement } from 'react';

import type { JsonLdScriptProps } from '../types/shared-component.types';

/**
 * Embeds a JSON-LD structured-data block for search engines. The payload is
 * serialized (and `<`-escaped) upstream by `serializeJsonLd`, so this stays
 * pure composition. Data blocks are inert — browsers never execute them — so
 * the strict CSP applies only to real scripts, not to this element.
 */
export function JsonLdScript({ json }: Readonly<JsonLdScriptProps>): ReactElement {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
