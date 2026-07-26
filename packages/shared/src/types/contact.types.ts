import type { z } from 'zod';

import type { ContactRequestSchema, ContactResponseSchema } from '../schemas/contact.schemas';

export type ContactRequest = z.infer<typeof ContactRequestSchema>;
export type ContactResponse = z.infer<typeof ContactResponseSchema>;
