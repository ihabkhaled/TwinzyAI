'use client';
// client-boundary-reason: connects the contact form presentation to its browser submission hook.

import type { ReactElement } from 'react';

import { ContactForm } from './contact-form.component';
import { useContactForm } from './use-contact-form.hook';

export const ContactFormContainer = (): ReactElement => {
  const props = useContactForm();
  return <ContactForm {...props} />;
};
