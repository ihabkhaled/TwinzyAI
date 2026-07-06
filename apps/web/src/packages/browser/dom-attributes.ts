import { getSafeDocument } from './browser-environment';

/**
 * Reads and writes attributes on the document root element (`<html>`), the
 * canonical home for theme/scheme flags. SSR-safe: no-ops (or returns `null`)
 * when there is no document.
 */
export function setRootAttribute(name: string, value: string): void {
  const safeDocument = getSafeDocument();

  if (safeDocument === null) {
    return;
  }

  safeDocument.documentElement.setAttribute(name, value);
}

export function getRootAttribute(name: string): string | null {
  const safeDocument = getSafeDocument();

  if (safeDocument === null) {
    return null;
  }

  return safeDocument.documentElement.getAttribute(name);
}
