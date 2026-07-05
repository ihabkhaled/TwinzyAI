import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string().min(1),
  version: z.string().min(1),
  uptimeSeconds: z.number().min(0),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
