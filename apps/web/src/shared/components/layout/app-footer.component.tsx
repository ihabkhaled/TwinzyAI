import type { ReactElement } from 'react';

import type { AppFooterProps } from '../types/shared-component.types';

import {
  appFooterClass,
  appFooterInnerClass,
  appFooterNavClass,
  appFooterNoteClass,
} from './app-footer.variants';

/**
 * Site-wide footer rendered on every page by the root layout: one labelled nav
 * plus the entertainment-only note. Pure composition — the layout maps the
 * translated routes to {@link FooterNavLink} children.
 */
export function AppFooter({
  navigationLabel,
  note,
  children,
}: Readonly<AppFooterProps>): ReactElement {
  return (
    <footer className={appFooterClass}>
      <div className={appFooterInnerClass}>
        <nav aria-label={navigationLabel} className={appFooterNavClass}>
          {children}
        </nav>
        <p className={appFooterNoteClass}>{note}</p>
      </div>
    </footer>
  );
}
