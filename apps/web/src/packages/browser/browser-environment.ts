/**
 * The only sanctioned access point for browser globals (`window`, `document`,
 * `navigator`, `matchMedia`). Every helper is SSR-safe: on the server, where
 * these globals do not exist, the read-style helpers return `null`/`false`
 * instead of throwing. App code consumes these facades so availability is
 * handled once, in one reviewed place.
 */
export function isBrowser(): boolean {
  return 'window' in globalThis && 'document' in globalThis;
}

export function getSafeWindow(): Window | null {
  if (!('window' in globalThis)) {
    return null;
  }

  return globalThis.window;
}

export function getSafeDocument(): Document | null {
  if (!('document' in globalThis)) {
    return null;
  }

  return globalThis.document;
}

export function matchesMediaQuery(query: string): boolean {
  const safeWindow = getSafeWindow();

  if (safeWindow === null) {
    return false;
  }

  return safeWindow.matchMedia(query).matches;
}

export function prefersReducedMotion(): boolean {
  return matchesMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Centralized access to the platform crypto UUID generator (WHATWG `crypto`,
 * available on `globalThis` in browsers and the Node/edge runtime). Kept here so
 * the one sanctioned globals facade owns it rather than scattering `crypto` reads.
 */
export function randomUuid(): string {
  return globalThis.crypto.randomUUID();
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const safeWindow = getSafeWindow();

  if (safeWindow === null) {
    return false;
  }

  try {
    await safeWindow.navigator.clipboard.writeText(text);

    return true;
  } catch {
    return false;
  }
}
