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
 * The locale endonym ("العربية"/"English") is the only header control with
 * variable, font-dependent width — hidden on phones so every control is a
 * fixed-width icon and the 320px header cannot overflow across platforms
 * (the globe icon + aria-label still convey the action).
 */
export const headerLocaleLabelClass = 'hidden sm:inline';
