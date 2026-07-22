import type { ReactElement } from 'react';

import { AppLink } from '@/packages/link';

import type { FooterNavLinkProps } from '../types/shared-component.types';

import { appFooterLinkClass } from './app-footer.variants';

/** One footer navigation entry: a typed internal route with its translated label. */
export function FooterNavLink({ href, label }: Readonly<FooterNavLinkProps>): ReactElement {
  return (
    <AppLink href={href} className={appFooterLinkClass}>
      {label}
    </AppLink>
  );
}
