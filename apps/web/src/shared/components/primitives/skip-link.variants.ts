/**
 * Class bundle for the accessibility skip link. Visually hidden until it
 * receives keyboard focus, at which point it appears as a fixed, high-contrast
 * chip at the block-start/inline-start edge so it stays RTL-safe.
 */
export const skipLinkClassName =
  'sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:shadow-lg focus:outline focus:outline-2 dark:focus:bg-black dark:focus:text-white';
