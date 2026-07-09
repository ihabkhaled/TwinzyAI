/**
 * Brand palette values needed OUTSIDE the Tailwind pipeline: the
 * `<meta name="theme-color">` viewport entries and the CSS-less root error
 * boundary (which renders after the app bundle/styles crashed). Keep these in
 * sync with the Tailwind theme in `app/globals.css`.
 */
export const THEME_PALETTE = {
  surfaceLight: '#f8f7fc',
  surfaceDark: '#13111c',
  textOnDark: '#f2f0fa',
  accent: '#a78bfa',
  textOnAccent: '#1c1927',
} as const;
