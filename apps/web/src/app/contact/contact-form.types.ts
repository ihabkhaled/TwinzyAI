import type { SyntheticEvent } from 'react';

export type ContactStatus = 'idle' | 'sending' | 'sent' | 'error';
export type ContactSubmitEvent = SyntheticEvent<HTMLFormElement, SubmitEvent>;

export interface ContactFormProps {
  isSending: boolean;
  statusLabel: string;
  submitLabel: string;
  onSubmit: (event: ContactSubmitEvent) => void;
}
