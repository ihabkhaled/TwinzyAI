import { z } from 'zod';

import {
  DEFAULT_EXCHANGE_RATE_API_BASE_URL,
  DEFAULT_EXCHANGE_RATE_CACHE_TTL_MS,
  DEFAULT_PAYMOB_CURRENCY,
  DEFAULT_USD_TO_EGP_FALLBACK,
  MAX_EXCHANGE_RATE_CACHE_TTL_MS,
  MIN_EXCHANGE_RATE_CACHE_TTL_MS,
  PAYMENT_PRICE_CURRENCY_PATTERN,
  PAYMOB_INTEGRATION_ID_PATTERN,
} from './env-bounds.constants';

/**
 * The Paymob (card, EGP) + USD→EGP exchange-rate environment variables, spread
 * into the root EnvSchema. SECRET + PUBLIC + CARD_INTEGRATION_ID all present ⇒
 * the Paymob path is ON; any blank ⇒ it is off and the game stays free of it.
 * Sandbox is selected by using `egy_..._test_` keys — there is no live host
 * toggle, and live keys are not approved.
 */
export const paymobEnvShape = {
  PAYMOB_SECRET_KEY: z.string().default(''),
  PAYMOB_PUBLIC_KEY: z.string().default(''),
  PAYMOB_API_KEY: z.string().default(''),
  PAYMOB_HMAC_SECRET: z.string().default(''),
  PAYMOB_CARD_INTEGRATION_ID: z
    .string()
    .regex(PAYMOB_INTEGRATION_ID_PATTERN)
    .or(z.literal(''))
    .default(''),
  PAYMOB_CURRENCY: z
    .string()
    .regex(PAYMENT_PRICE_CURRENCY_PATTERN)
    .default(DEFAULT_PAYMOB_CURRENCY),
  EXCHANGE_RATE_API_BASE_URL: z.url().default(DEFAULT_EXCHANGE_RATE_API_BASE_URL),
  EXCHANGE_RATE_CACHE_TTL_MS: z.coerce
    .number()
    .int()
    .min(MIN_EXCHANGE_RATE_CACHE_TTL_MS)
    .max(MAX_EXCHANGE_RATE_CACHE_TTL_MS)
    .default(DEFAULT_EXCHANGE_RATE_CACHE_TTL_MS),
  USD_TO_EGP_FALLBACK_RATE: z.coerce.number().positive().default(DEFAULT_USD_TO_EGP_FALLBACK),
};
