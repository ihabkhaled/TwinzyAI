/** Class bundles for the app top bar. */
export const appHeaderClass =
  'sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur';

export const appHeaderInnerClass =
  'mx-auto flex w-full max-w-xl items-center justify-between gap-4 px-4 py-3';

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
