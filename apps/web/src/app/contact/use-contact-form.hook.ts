'use client';
// client-boundary-reason: owns browser form state and submits validated contact data to the API.

import { useState } from 'react';

import { CONTACT_PATH, ContactResponseSchema } from '@twinzy/shared';

import { httpClient, postJson } from '@/packages/axios';

import type { ContactFormProps, ContactStatus, ContactSubmitEvent } from './contact-form.types';
import { getContactStatusView } from './contact-status.helper';

export const useContactForm = (): ContactFormProps => {
  const [status, setStatus] = useState<ContactStatus>('idle');

  const onSubmit = (event: ContactSubmitEvent): void => {
    event.preventDefault();
    const target = event.currentTarget;
    const form = new FormData(target);
    setStatus('sending');
    void postJson(
      httpClient,
      CONTACT_PATH,
      {
        email: form.get('email'),
        subject: form.get('subject'),
        message: form.get('message'),
      },
      ContactResponseSchema,
    )
      .then(() => {
        target.reset();
        setStatus('sent');
        return true;
      })
      .catch(() => {
        setStatus('error');
      });
  };

  return { ...getContactStatusView(status), onSubmit };
};
