import { z } from 'zod';

import { MAX_PORT_NUMBER } from './env-bounds.constants';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

export const contactEnvShape = {
  CONTACT_EMAIL_ENABLED: booleanFromString,
  CONTACT_EMAIL_PROVIDER: z.enum(['smtp']).default('smtp'),
  CONTACT_EMAIL_FROM: z.string().default(''),
  CONTACT_EMAIL_TO: z.string().default(''),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(20).default(3),
  CONTACT_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(60_000)
    .max(86_400_000)
    .default(3_600_000),
  CONTACT_SMTP_HOST: z.string().default(''),
  CONTACT_SMTP_PORT: z.coerce.number().int().min(1).max(MAX_PORT_NUMBER).default(587),
  CONTACT_SMTP_SECURE: booleanFromString,
  CONTACT_SMTP_USER: z.string().default(''),
  CONTACT_SMTP_PASS: z.string().default(''),
} as const;

type ContactEnv = z.infer<z.ZodObject<typeof contactEnvShape>>;

export const validateContactEnv = (env: ContactEnv, context: z.RefinementCtx): void => {
  const required = [
    env.CONTACT_EMAIL_FROM,
    env.CONTACT_EMAIL_TO,
    env.CONTACT_SMTP_HOST,
    env.CONTACT_SMTP_USER,
    env.CONTACT_SMTP_PASS,
  ];
  if (env.CONTACT_EMAIL_ENABLED && required.some((value) => value.length === 0)) {
    context.addIssue({
      code: 'custom',
      path: ['CONTACT_EMAIL_ENABLED'],
      message: 'Enabled contact email requires complete SMTP configuration',
      input: env,
    });
  }
};
