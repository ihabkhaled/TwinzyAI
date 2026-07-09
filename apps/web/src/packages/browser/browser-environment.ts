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

/** Whether the platform exposes the Web Share API (mobile browsers mostly). */
export function canUseWebShare(): boolean {
  const safeWindow = getSafeWindow();
  return safeWindow !== null && typeof safeWindow.navigator.share === 'function';
}

/**
 * Shares via the native Web Share sheet. Returns true when the share completed,
 * false when it is unsupported or the user dismissed it — callers fall back to
 * the copy-link / platform buttons. Only a safe URL (+ text/title) is shared;
 * never an image.
 */
export async function shareViaWebShare(data: {
  title?: string;
  text?: string;
  url: string;
}): Promise<boolean> {
  const safeWindow = getSafeWindow();

  if (safeWindow === null || typeof safeWindow.navigator.share !== 'function') {
    return false;
  }

  try {
    await safeWindow.navigator.share(data);

    return true;
  } catch {
    return false;
  }
}

/** Mint an object URL for an in-memory Blob/File (image preview; browser-only). */
export const createObjectUrl = (blob: Blob): string => URL.createObjectURL(blob);

/** Release an object URL minted by {@link createObjectUrl}. */
export const revokeObjectUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
