/** Class bundles for the app top bar. */
export const appHeaderClass =
  'sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur';

// Gap + horizontal padding tighten on phones so the four controls (home,
// donate, language, theme) clear a 320px header with margin across platforms;
// roomier from sm up.
export const appHeaderInnerClass =
  'mx-auto flex w-full max-w-xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4';

export const appHeaderBrandClass =
  'inline-flex items-center gap-2 text-base font-semibold text-foreground';

export const appHeaderControlsClass = 'inline-flex items-center gap-0.5 sm:gap-1';

// Padding tightens on phones so all four controls (home, donate, language,
// theme) fit a 320px header without horizontal scroll; roomier from sm up.
export const headerIconLinkClass =
  'inline-flex h-9 cursor-pointer items-center justify-center rounded-xl px-2 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3';

/** Donate nav link: the icon link recipe plus a small gap for its label. */
export const headerDonateLinkClass = `${headerIconLinkClass} gap-1.5`;

/** Donate label is icon-only on phones to protect the 320px header layout. */
export const headerDonateLabelClass = 'hidden sm:inline';

/**
 * The language dropdown: styled to sit among the icon controls. Width is
 * bounded on phones so twelve endonyms of very different lengths can never
 * overflow the 320px header; the full name is visible in the opened list.
 */
export const headerLocaleSelectClass =
  'h-9 max-w-24 cursor-pointer rounded-xl border border-border bg-background px-1.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-32 sm:px-2';
