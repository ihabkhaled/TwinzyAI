import { APP_NAME } from '@twinzy/shared';

const TITLE_SEPARATOR = ' · ';

/**
 * Compose a document title for a section as `Section · Twinzy`. Centralizing
 * the separator and brand suffix keeps every page's `<title>` consistent.
 */
export function buildPageTitle(sectionTitle: string): string {
  return `${sectionTitle}${TITLE_SEPARATOR}${APP_NAME}`;
}
