import type { CSSProperties } from 'react';

import { THEME_PALETTE } from './theme-palette.constants';

/** Canonical Open Graph image dimensions honoured by every major scraper. */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export const OG_IMAGE_CONTENT_TYPE = 'image/png';

/**
 * English-only copy baked into the generated social preview. The card is a
 * single cached asset shared by every locale and every scraper, so it cannot
 * resolve i18n per request; English is the canonical brand copy here, mirroring
 * the `manifest.webmanifest` strings.
 */
export const OG_IMAGE_COPY = {
  tagline: 'Find your public vibe match',
  subtitle: 'A playful style/vibe game from written visible traits. No face recognition.',
  alt: 'Twinzy — Find your public vibe match',
} as const;

const BRAND_PURPLE = '#6d28d9';

/**
 * Geometry and colours of the Twinzy mark, drawn inline on the card. Satori
 * (the `next/og` renderer) cannot load the app's `public/icons/icon.svg` the
 * way a browser does, so the shapes are declared here — keep them in sync with
 * that file, which stays the source of truth for the favicon and manifest.
 */
export const OG_IMAGE_LOGO = {
  size: 168,
  viewBox: '0 0 128 128',
  cornerRadius: 28,
  background: BRAND_PURPLE,
  eyeRadius: 18,
  leftEye: { cx: 46, cy: 52, stroke: '#ffffff' },
  rightEye: { cx: 82, cy: 52, stroke: '#f472b6' },
  smilePath: 'M34 92c8 10 22 14 30 14s22-4 30-14',
  smileStroke: '#ffffff',
  strokeWidth: 7,
} as const;

/**
 * Inline styles for the generated card. `next/og` renders through Satori, which
 * supports neither Tailwind classes from our pipeline nor a stylesheet, so the
 * card's presentation lives here rather than inline in the route file.
 */
export const OG_IMAGE_STYLES = {
  root: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 28,
    padding: 80,
    backgroundColor: THEME_PALETTE.surfaceDark,
    backgroundImage: `radial-gradient(circle at 88% 12%, ${BRAND_PURPLE} 0%, transparent 55%)`,
    color: THEME_PALETTE.textOnDark,
    fontFamily: 'sans-serif',
  },
  name: {
    display: 'flex',
    fontSize: 88,
    fontWeight: 700,
    letterSpacing: -2,
  },
  tagline: {
    display: 'flex',
    fontSize: 52,
    color: THEME_PALETTE.accent,
  },
  subtitle: {
    display: 'flex',
    maxWidth: 900,
    fontSize: 30,
    lineHeight: 1.4,
    opacity: 0.78,
  },
} as const satisfies Record<string, CSSProperties>;
