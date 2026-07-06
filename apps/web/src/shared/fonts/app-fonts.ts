import { Inter } from 'next/font/google';

/**
 * The one and only owner of `next/font/google` in the app. Exposing a single
 * configured font instance keeps subsetting, the `--font-sans` CSS variable,
 * and `display: swap` centralized; the root layout binds `interFont.variable`.
 */
export const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
