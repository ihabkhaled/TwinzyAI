import { z } from 'zod';

import {
  CONTACT_EMAIL_MAX_LENGTH,
  CONTACT_MESSAGE_MAX_LENGTH,
  CONTACT_MESSAGE_MIN_LENGTH,
  CONTACT_SUBJECT_MAX_LENGTH,
  CONTACT_SUBJECT_MIN_LENGTH,
} from '../constants/contact.constants';

export const ContactRequestSchema = z
  .object({
    email: z.email().max(CONTACT_EMAIL_MAX_LENGTH),
    subject: z.string().trim().min(CONTACT_SUBJECT_MIN_LENGTH).max(CONTACT_SUBJECT_MAX_LENGTH),
    message: z.string().trim().min(CONTACT_MESSAGE_MIN_LENGTH).max(CONTACT_MESSAGE_MAX_LENGTH),
  })
  .strict();

export const ContactResponseSchema = z.object({ sent: z.literal(true) }).strict();
