import { Injectable } from '@nestjs/common';

import { PaymentGateway } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { PAYMOB_API_BASE_URL } from '../../../config/payment.constants';
import {
  buildIntegrationError,
  buildPaymentError,
  ErrorCode,
  PaymentError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import {
  PAYMENT_ORDER_INVALID_MESSAGE,
  PAYMENT_UNAVAILABLE_MESSAGE,
  PAYMOB_AUTH_TOKEN_PATH,
  PAYMOB_AUTH_TOKEN_TTL_MS,
  PAYMOB_BILLING_PLACEHOLDER,
  PAYMOB_INTENTION_PATH,
  PAYMOB_ITEM_NAME,
  PAYMOB_ORDER_PAID_STATUS,
  PAYMOB_ORDERS_PATH,
  PAYMOB_REFUND_PATH,
  PAYMOB_REQUEST_TIMEOUT_MS,
  PAYMOB_RETURN_PATH,
} from '../model/payment.constants';
import type { PaymobCaptureRecord, PaymobIntention } from '../model/payment.types';
import {
  PaymobAuthTokenResponseSchema,
  PaymobIntentionApiResponseSchema,
  PaymobOrderSchema,
} from '../model/paymob.schemas';

import { ExchangeRateAdapter } from './exchange-rate.adapter';

const LOG_CONTEXT = 'Paymob';

/**
 * The ONLY file that talks to Paymob's Accept REST API. Security posture mirrors
 * the PayPal adapter: the amount is priced server-side (USD base → EGP via the
 * exchange-rate service), the intention is bound to the request id via
 * `special_reference`, and a payment is trusted ONLY after a server-side ORDER
 * retrieve confirms `payment_status === PAID`, the full amount, the currency,
 * and `merchant_order_id === requestId`. There is no local ledger — Paymob is
 * the source of truth, verified at consumption — and an undelivered paid run is
 * refunded (via the transaction id relayed from the checkout redirect).
 */
@Injectable()
export class PaymobAdapter {
  private cachedToken: { value: string; expiresAtMs: number } | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly exchangeRate: ExchangeRateAdapter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  /** Create a server-priced intention bound to the request id; returns the client secret. */
  public async createIntention(requestId: string): Promise<PaymobIntention> {
    const { currency } = this.config.paymob;
    const price = this.config.paymentPrice;
    const amountCents = await this.exchangeRate.convertToMinorUnits(
      price.value,
      price.currencyCode,
      currency,
    );
    const body = this.buildIntentionBody(requestId, amountCents, currency);
    const response = await this.fetchWithToken(
      PAYMOB_INTENTION_PATH,
      body,
      this.config.paymob.secretKey,
    );
    if (!response.ok) {
      throw this.mapFailure(response, 'create-intention');
    }
    const parsed = PaymobIntentionApiResponseSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.unavailable('create-intention returned an unexpected body');
    }
    return {
      clientSecret: parsed.data.client_secret,
      orderId: parsed.data.intention_order_id,
      amountCents,
      currency,
    };
  }

  /**
   * Verify at consumption that the request id was actually paid: retrieve the
   * order and require it to be bound to this request id and fully PAID. Paymob is
   * the ledger — no local state. `transactionId` (relayed from the checkout
   * redirect) is only carried onto the record so an undelivered run can refund.
   */
  public async verifyPayment(
    requestId: string,
    orderId: number,
    transactionId: number | undefined,
  ): Promise<PaymobCaptureRecord> {
    const token = await this.getAuthToken();
    const response = await this.getWithBearer(`${PAYMOB_ORDERS_PATH}/${orderId}`, token);
    if (!response.ok) {
      throw this.mapFailure(response, 'order-retrieve');
    }
    const parsed = PaymobOrderSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.captureRejected('order retrieve returned an unexpected body');
    }
    return this.verifyOrder(parsed.data, requestId, transactionId);
  }

  /** Best-effort refund of a transaction whose analysis was never delivered. */
  public async refund(record: PaymobCaptureRecord): Promise<void> {
    if (record.transactionId === undefined) {
      this.logger.error(
        `Cannot auto-refund order ${record.orderId} (no transaction id captured) — reconcile in the Paymob dashboard`,
      );
      return;
    }
    const token = await this.getAuthToken();
    const body = JSON.stringify({
      auth_token: token,
      transaction_id: record.transactionId,
      amount_cents: record.amountCents,
    });
    const response = await this.post(PAYMOB_REFUND_PATH, body);
    if (!response.ok) {
      throw this.unavailable(`refund failed with HTTP ${response.status}`);
    }
    this.logger.info('Refunded Paymob transaction for an undelivered analysis');
  }

  private verifyOrder(
    order: ReturnType<typeof PaymobOrderSchema.parse>,
    requestId: string,
    transactionId: number | undefined,
  ): PaymobCaptureRecord {
    const isVerified =
      order.merchant_order_id === requestId &&
      order.payment_status === PAYMOB_ORDER_PAID_STATUS &&
      order.currency === this.config.paymob.currency &&
      order.amount_cents > 0 &&
      order.paid_amount_cents >= order.amount_cents &&
      order.is_canceled !== true &&
      order.is_returned !== true;
    if (!isVerified) {
      throw this.captureRejected(this.orderDiagnostics(order, requestId));
    }
    return {
      gateway: PaymentGateway.Paymob,
      orderId: order.id,
      transactionId,
      amountCents: order.amount_cents,
    };
  }

  /** A PII-free one-line reason for a rejected order (no card data is ever read). */
  private orderDiagnostics(
    order: ReturnType<typeof PaymobOrderSchema.parse>,
    requestId: string,
  ): string {
    return [
      `status=${order.payment_status ?? 'n/a'}`,
      `paid=${order.paid_amount_cents}/${order.amount_cents}`,
      `currency=${order.currency}`,
      `bound=${order.merchant_order_id === requestId}`,
      `canceled=${order.is_canceled ?? false}`,
      `returned=${order.is_returned ?? false}`,
    ].join(', ');
  }

  private buildIntentionBody(requestId: string, amountCents: number, currency: string): string {
    return JSON.stringify({
      amount: amountCents,
      currency,
      payment_methods: [Number(this.config.paymob.cardIntegrationId)],
      items: [{ name: PAYMOB_ITEM_NAME, amount: amountCents, quantity: 1 }],
      billing_data: PAYMOB_BILLING_PLACEHOLDER,
      special_reference: requestId,
      // Popup lands here on completion; the page relays the transaction id + closes.
      redirection_url: this.buildReturnUrl(),
    });
  }

  /** The frontend `/paymob/return` URL the checkout popup redirects to on completion. */
  private buildReturnUrl(): string {
    const base = this.config.shareResultPublicBaseUrl;
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    return `${normalizedBase}${PAYMOB_RETURN_PATH}`;
  }

  private async getAuthToken(): Promise<string> {
    if (this.cachedToken !== undefined && this.cachedToken.expiresAtMs > Date.now()) {
      return this.cachedToken.value;
    }
    const response = await this.post(
      PAYMOB_AUTH_TOKEN_PATH,
      JSON.stringify({ api_key: this.config.paymob.apiKey }),
    );
    if (!response.ok) {
      throw this.unavailable('authentication with Paymob failed');
    }
    const parsed = PaymobAuthTokenResponseSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.unavailable('auth returned an unexpected body');
    }
    this.cachedToken = {
      value: parsed.data.token,
      expiresAtMs: Date.now() + PAYMOB_AUTH_TOKEN_TTL_MS,
    };
    return parsed.data.token;
  }

  private fetchWithToken(path: string, body: string, bearerToken: string): Promise<Response> {
    return this.boundedFetch(path, {
      method: 'POST',
      headers: { authorization: `Token ${bearerToken}`, 'content-type': 'application/json' },
      body,
    });
  }

  private post(path: string, body: string): Promise<Response> {
    return this.boundedFetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
  }

  private getWithBearer(path: string, token: string): Promise<Response> {
    return this.boundedFetch(path, {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    });
  }

  private async boundedFetch(path: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, PAYMOB_REQUEST_TIMEOUT_MS);
    try {
      return await globalThis.fetch(`${PAYMOB_API_BASE_URL}${path}`, {
        ...init,
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof PaymentError) {
        throw error;
      }
      this.logger.warn(
        controller.signal.aborted ? 'Paymob call timed out' : 'Paymob transport failure',
      );
      throw this.unavailable('Paymob could not be reached');
    } finally {
      clearTimeout(timer);
    }
  }

  private mapFailure(response: Response, operation: string): Error {
    this.logger.error(`Paymob ${operation} failed with HTTP ${response.status}`);
    return this.unavailable(`${operation} failed at the payment provider`);
  }

  private captureRejected(reason: string): Error {
    this.logger.warn(`Paymob verification failed (${reason})`);
    return buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
  }

  private async readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  private unavailable(message: string): Error {
    return buildIntegrationError(
      ErrorCode.PaymentProviderUnavailable,
      `${PAYMENT_UNAVAILABLE_MESSAGE} (${message})`,
    );
  }
}
