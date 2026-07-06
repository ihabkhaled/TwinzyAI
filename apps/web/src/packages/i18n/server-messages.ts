/**
 * Server-side i18n facade. Server Components and server actions resolve
 * translations and the active locale through these re-exports so next-intl's
 * server entry is imported in exactly one place.
 */

export {
  getLocale as getServerLocale,
  getTranslations as getServerTranslations,
} from 'next-intl/server';
