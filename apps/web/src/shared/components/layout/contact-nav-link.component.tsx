import type { ReactElement } from 'react';

import { MailIcon } from '@/packages/icons';
import { AppLink } from '@/packages/link';

import type { ContactNavLinkProps } from '../types/shared-component.types';

import { headerContactLabelClass, headerContactLinkClass } from './app-header.variants';

/** Always-visible header entry for the contact form. */
export const ContactNavLink = ({ href, label }: ContactNavLinkProps): ReactElement => (
  <AppLink href={href} aria-label={label} className={headerContactLinkClass}>
    <MailIcon aria-hidden size={18} />
    <span className={headerContactLabelClass}>{label}</span>
  </AppLink>
);
