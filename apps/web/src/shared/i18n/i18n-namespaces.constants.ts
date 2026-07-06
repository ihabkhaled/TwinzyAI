/**
 * The message namespaces this app ships. The i18n package reads the message
 * dictionaries; this file owns the canonical namespace identifiers so message
 * loading, typing, and lookups all agree on one list.
 */
export const I18N_NAMESPACES = {
  app: 'app',
  nav: 'nav',
  home: 'home',
  game: 'game',
  upload: 'upload',
  result: 'result',
  privacy: 'privacy',
  terms: 'terms',
  help: 'help',
  errors: 'errors',
  notFound: 'notFound',
  errorPage: 'errorPage',
} as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[keyof typeof I18N_NAMESPACES];
