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
  PAYMOB_REFUND_PATH,
  PAYMOB_REQUEST_TIMEOUT_MS,
  PAYMOB_TRANSACTION_INQUIRY_PATH,
} from '../model/payment.constants';
import type { PaymobCaptureRecord, PaymobIntention } from '../model/payment.types';
import {
  PaymobAuthTokenResponseSchema,
  PaymobIntentionApiResponseSchema,
  PaymobTransactionSchema,
} from '../model/paymob.schemas';

import { ExchangeRateAdapter } from './exchange-rate.adapter';

const LOG_CONTEXT = 'Paymob';

/**
 * The ONLY file that talks to Paymob's Accept REST API. Security posture mirrors
 * the PayPal adapter: the amount is priced server-side (USD base → EGP via the
 * exchange-rate service), the intention is bound to the request id via
 * `special_reference`, and a payment is trusted ONLY after a server-side
 * transaction inquiry confirms success + binding + currency + not-refunded.
 * There is no local ledger — Paymob is the source of truth, verified at
 * consumption — and an undelivered paid run is refunded.
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
    return { clientSecret: parsed.data.client_secret, amountCents, currency };
  }

  /** Verify at consumption that the request id was actually paid (Paymob is the ledger). */
  public async verifyPayment(requestId: string): Promise<PaymobCaptureRecord> {
    const token = await this.getAuthToken();
    const body = JSON.stringify({ auth_token: token, merchant_order_id: requestId });
    const response = await this.post(PAYMOB_TRANSACTION_INQUIRY_PATH, body);
    if (!response.ok) {
      throw this.mapFailure(response, 'inquiry');
    }
    const parsed = PaymobTransactionSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.captureRejected('inquiry returned an unexpected body');
    }
    return this.verifyTransaction(parsed.data, requestId);
  }

  /** Best-effort refund of a transaction whose analysis was never delivered. */
  public async refund(record: PaymobCaptureRecord): Promise<void> {
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

  private verifyTransaction(
    tx: ReturnType<typeof PaymobTransactionSchema.parse>,
    requestId: string,
  ): PaymobCaptureRecord {
    const isVerified =
      tx.success &&
      !tx.pending &&
      !tx.is_refunded &&
      !tx.is_voided &&
      tx.currency === this.config.paymob.currency &&
      tx.order.merchant_order_id === requestId &&
      tx.amount_cents > 0;
    if (!isVerified) {
      throw this.captureRejected(this.txnDiagnostics(tx, requestId));
    }
    return { gateway: PaymentGateway.Paymob, transactionId: tx.id, amountCents: tx.amount_cents };
  }

  /**
   * A PII-free one-line reason for a rejected transaction: the status flags plus
   * Paymob's machine decline code + generic message (e.g. AUTHENTICATION_NOT_SUPPORTED).
   * No card data — the schema already strips masked pan / holder / source_data.
   */
  private txnDiagnostics(
    tx: ReturnType<typeof PaymobTransactionSchema.parse>,
    requestId: string,
  ): string {
    return [
      `success=${tx.success}`,
      `pending=${tx.pending}`,
      `refunded=${tx.is_refunded}`,
      `voided=${tx.is_voided}`,
      `error=${tx.error_occured ?? false}`,
      `currency=${tx.currency}`,
      `bound=${tx.order.merchant_order_id === requestId}`,
      `code=${tx.data?.txn_response_code ?? 'n/a'}`,
      `message=${tx.data?.message ?? 'n/a'}`,
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
    });
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
