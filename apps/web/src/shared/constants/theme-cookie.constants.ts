/**
 * Theme cookie shared by the client (which writes the resolved color scheme
 * whenever the theme changes) and the server root layout (which reads it to
 * render the correct `data-theme` on the very first paint — no flash, no
 * hydration mismatch). It stores the RESOLVED scheme (`light`/`dark`), not the
 * preference, so a `system` user's OS choice is honored server-side too.
 */
export const THEME_COOKIE_NAME = 'twinzy.theme';

/** Lifetime of the theme cookie: one year. */
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
