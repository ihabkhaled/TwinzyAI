import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { EXCHANGE_RATE_REQUEST_TIMEOUT_MS } from '../../../config/env-bounds.constants';
import { buildIntegrationError, ErrorCode } from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import { ExchangeRateResponseSchema } from '../model/exchange-rate.schemas';
import {
  EXCHANGE_RATE_SUCCESS_RESULT,
  MINOR_UNITS_PER_MAJOR,
  PAYMENT_UNAVAILABLE_MESSAGE,
} from '../model/payment.constants';

const LOG_CONTEXT = 'ExchangeRate';

/**
 * The ONLY file that talks to the USD-base exchange-rate API. Converts the
 * canonical price (e.g. 1.00 USD) into the integer minor units of the Paymob
 * charge currency (EGP piasters). A fetched rate is cached so create-intention
 * and verify-at-consumption compute the SAME amount within the TTL window, and a
 * configured fallback rate keeps payments working through a rate-API outage.
 */
@Injectable()
export class ExchangeRateAdapter {
  private cached: { key: string; rate: number; expiresAtMs: number } | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  /** Convert `baseValue` in `baseCurrency` to integer minor units of `targetCurrency`. */
  public async convertToMinorUnits(
    baseValue: string,
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<number> {
    const rate = await this.getRate(baseCurrency, targetCurrency);
    return Math.round(Number(baseValue) * rate * MINOR_UNITS_PER_MAJOR);
  }

  private async getRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    const key = `${baseCurrency}:${targetCurrency}`;
    const now = Date.now();
    if (this.cached?.key === key && this.cached.expiresAtMs > now) {
      return this.cached.rate;
    }
    const rate = await this.fetchRate(baseCurrency, targetCurrency);
    this.cached = { key, rate, expiresAtMs: now + this.config.exchangeRate.cacheTtlMs };
    return rate;
  }

  private async fetchRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    try {
      const response = await this.boundedFetch(baseCurrency);
      const rate = response.ok ? this.readRate(await response.json(), targetCurrency) : undefined;
      if (rate !== undefined) {
        return rate;
      }
      this.logger.warn(`Rate API gave no usable ${targetCurrency} rate; using fallback`);
    } catch {
      this.logger.warn(
        `Rate API unreachable; using fallback ${baseCurrency}->${targetCurrency} rate`,
      );
    }
    return this.fallbackRate(baseCurrency, targetCurrency);
  }

  private readRate(body: unknown, targetCurrency: string): number | undefined {
    const parsed = ExchangeRateResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.result !== EXCHANGE_RATE_SUCCESS_RESULT) {
      return undefined;
    }
    const rate = parsed.data.rates[targetCurrency];
    return typeof rate === 'number' && rate > 0 ? rate : undefined;
  }

  private fallbackRate(baseCurrency: string, targetCurrency: string): number {
    const fallback = this.config.exchangeRate.usdToEgpFallback;
    const applies = baseCurrency === 'USD' && targetCurrency === this.config.paymob.currency;
    if (!applies || fallback <= 0) {
      throw buildIntegrationError(
        ErrorCode.PaymentProviderUnavailable,
        `${PAYMENT_UNAVAILABLE_MESSAGE} (exchange rate unavailable)`,
      );
    }
    return fallback;
  }

  private async boundedFetch(baseCurrency: string): Promise<Response> {
    const url = `${this.config.exchangeRate.apiBaseUrl}/${encodeURIComponent(baseCurrency)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, EXCHANGE_RATE_REQUEST_TIMEOUT_MS);
    try {
      return await globalThis.fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }
}
