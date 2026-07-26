import type { ContactFormProps, ContactStatus } from './contact-form.types';
import { CONTACT_LABELS } from './contact-ui.constants';

export const getContactStatusView = (
  status: ContactStatus,
): Pick<ContactFormProps, 'isSending' | 'statusLabel' | 'submitLabel'> => {
  if (status === 'sending') {
    return { isSending: true, submitLabel: CONTACT_LABELS.sending, statusLabel: '' };
  }
  if (status === 'sent') {
    return { isSending: false, submitLabel: CONTACT_LABELS.send, statusLabel: CONTACT_LABELS.sent };
  }
  if (status === 'error') {
    return {
      isSending: false,
      submitLabel: CONTACT_LABELS.send,
      statusLabel: CONTACT_LABELS.error,
    };
  }
  return { isSending: false, submitLabel: CONTACT_LABELS.send, statusLabel: '' };
};
