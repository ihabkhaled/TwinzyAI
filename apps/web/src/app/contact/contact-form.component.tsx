import type { ReactElement } from 'react';

import {
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_MESSAGE_MIN_LENGTH,
  CONTACT_SUBJECT_MAX_LENGTH,
  CONTACT_SUBJECT_MIN_LENGTH,
} from '@twinzy/shared';

import { contactInputClass, contactSubmitClass, contactTextAreaClass } from './contact.variants';
import type { ContactFormProps } from './contact-form.types';
import { CONTACT_ARIA_LIVE, CONTACT_LABELS } from './contact-ui.constants';

export const ContactForm = ({
  isSending,
  statusLabel,
  submitLabel,
  onSubmit,
}: ContactFormProps): ReactElement => (
  <form onSubmit={onSubmit}>
    <label htmlFor="contact-email">
      {CONTACT_LABELS.email}
      <input
        id="contact-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={CONTACT_EMAIL_MAX_LENGTH}
        className={contactInputClass}
      />
    </label>
    <label htmlFor="contact-subject">
      {CONTACT_LABELS.subject}
      <input
        id="contact-subject"
        name="subject"
        required
        minLength={CONTACT_SUBJECT_MIN_LENGTH}
        maxLength={CONTACT_SUBJECT_MAX_LENGTH}
        className={contactInputClass}
      />
    </label>
    <label htmlFor="contact-message">
      {CONTACT_LABELS.message}
      <textarea
        id="contact-message"
        name="message"
        required
        minLength={CONTACT_MESSAGE_MIN_LENGTH}
        maxLength={CONTACT_MESSAGE_MAX_LENGTH}
        rows={8}
        className={contactTextAreaClass}
      />
    </label>
    <button type="submit" disabled={isSending} className={contactSubmitClass}>
      {submitLabel}
    </button>
    <p role="status" aria-live={CONTACT_ARIA_LIVE}>
      {statusLabel}
    </p>
  </form>
);
