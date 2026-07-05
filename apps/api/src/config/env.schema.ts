import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

const booleanFromString = z
  .string()
  .optional()
  .transform((value) => value === 'true');

/**
 * Single source of truth for every environment variable the API reads.
 * Nothing outside the config module may touch process.env.
 */
export const EnvSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default(''),
  GEMINI_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120_000).default(30_000),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().min(1024).default(5_242_880),
  ENABLE_CLAMAV: booleanFromString,
  CLAMAV_HOST: z.string().default('clamav'),
  CLAMAV_PORT: z.coerce.number().int().min(1).max(65_535).default(3310),
});

export type ParsedEnv = z.infer<typeof EnvSchema>;
