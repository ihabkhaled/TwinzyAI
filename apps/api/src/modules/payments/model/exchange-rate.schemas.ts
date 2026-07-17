import { z } from 'zod';

/**
 * The subset of the USD-base rates endpoint we rely on. `result` must be
 * `success` and `rates` maps ISO currency → multiplier. Everything else in the
 * provider payload is ignored so a provider adding fields never breaks parsing.
 */
export const ExchangeRateResponseSchema = z.object({
  result: z.string(),
  rates: z.record(z.string(), z.number()),
});
