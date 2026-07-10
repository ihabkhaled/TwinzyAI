/**
 * English-only fallback copy for the top-level `global-error` boundary, where a
 * render crash has torn down the React tree and the i18n runtime is no longer
 * available. Every other surface resolves copy through i18n; this is the one
 * place a hardcoded string is correct because nothing else can run.
 */
export const FALLBACK_ERROR_COPY = {
  title: 'Something went wrong',
  description:
    'Twinzy ran into an unexpected error. Your photo was never stored, and nothing was saved. Please reload and try again.',
  retry: 'Reload Twinzy',
} as const;
