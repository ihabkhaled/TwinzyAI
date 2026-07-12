import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/app-config.service';
import { PAYPAL_BASE_URL_BY_ENV } from '../../../config/payment.constants';
import {
  buildIntegrationError,
  buildPaymentError,
  ErrorCode,
  PaymentError,
} from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import {
  HTTP_STATUS_NOT_FOUND,
  MILLISECONDS_PER_SECOND,
  PAYMENT_ORDER_INVALID_MESSAGE,
  PAYMENT_UNAVAILABLE_MESSAGE,
  PAYPAL_CAPTURES_PATH,
  PAYPAL_OAUTH_TOKEN_PATH,
  PAYPAL_ORDERS_PATH,
  PAYPAL_PAYMENT_FAILED_ISSUES,
  PAYPAL_REQUEST_TIMEOUT_MS,
  PAYPAL_STATUS_COMPLETED,
  PAYPAL_TOKEN_EXPIRY_MARGIN_SECONDS,
} from '../model/payment.constants';
import type { PaymentCaptureRecord } from '../model/payment.types';
import {
  PaypalCaptureOrderResponseSchema,
  PaypalCreateOrderResponseSchema,
  type PaypalErrorResponse,
  PaypalErrorResponseSchema,
  PaypalTokenResponseSchema,
} from '../model/paypal.schemas';

const LOG_CONTEXT = 'PayPal';

/**
 * Compact, PII-free diagnostics line from a PayPal error body: the error name,
 * the first issue code + description, and the debug_id to quote to PayPal
 * support. Everything here is machine metadata, never payer data.
 */
const buildPaypalDiagnostics = (body: PaypalErrorResponse | undefined): string => {
  if (body === undefined) {
    return '(unparsed error body)';
  }
  const detail = body.details?.[0];
  const parts = [
    `name=${body.name ?? 'n/a'}`,
    `issue=${detail?.issue ?? 'n/a'}`,
    `debug_id=${body.debug_id ?? 'n/a'}`,
  ];
  if (detail?.description !== undefined) {
    parts.push(`description=${detail.description}`);
  }
  return `(${parts.join(', ')})`;
};

/**
 * The ONLY file that talks to PayPal's REST API (Orders v2 + Refunds).
 * Security posture:
 * - the price/currency sent to PayPal come exclusively from validated config;
 * - captures are verified field-by-field (status COMPLETED, exact amount and
 *   currency, custom_id binding) before a request is treated as paid;
 * - an order captures exactly once at PayPal's side, so a replayed order id
 *   fails with ORDER_ALREADY_CAPTURED — no local ledger is needed;
 * - request/response bodies are never logged; failures log status codes only;
 * - every call is bounded by a timeout so a payment outage cannot hang runs.
 */
@Injectable()
export class PaypalAdapter {
  private cachedToken: { value: string; expiresAtMs: number } | undefined;

  public constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  /** Create a CAPTURE-intent order for one analysis, bound to the request id. */
  public async createOrder(requestId: string): Promise<string> {
    const price = this.config.paymentPrice;
    const body = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: price.currencyCode, value: price.value },
          custom_id: requestId,
        },
      ],
    };
    const response = await this.post(PAYPAL_ORDERS_PATH, JSON.stringify(body), requestId);
    if (!response.ok) {
      throw await this.mapPaypalFailure(response, 'create-order');
    }
    const parsed = PaypalCreateOrderResponseSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.unavailable('create-order returned an unexpected body');
    }
    return parsed.data.id;
  }

  /**
   * Capture the approved order — the moment money moves and the single-use
   * proof of payment. Verifies amount, currency, terminal status, and (when
   * given) the custom_id binding to this request before accepting it.
   */
  public async captureOrder(
    orderId: string,
    expectedRequestId?: string,
  ): Promise<PaymentCaptureRecord> {
    const path = `${PAYPAL_ORDERS_PATH}/${encodeURIComponent(orderId)}/capture`;
    const response = await this.post(path, '{}', orderId);
    if (!response.ok) {
      throw await this.mapPaypalFailure(response, 'capture');
    }
    const parsed = PaypalCaptureOrderResponseSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.unavailable('capture returned an unexpected body');
    }
    return this.verifyCapture(parsed.data, orderId, expectedRequestId);
  }

  /** Best-effort refund of a capture whose analysis was never delivered. */
  public async refundCapture(captureId: string): Promise<void> {
    const path = `${PAYPAL_CAPTURES_PATH}/${encodeURIComponent(captureId)}/refund`;
    const response = await this.post(path, '{}', captureId);
    if (!response.ok) {
      throw this.unavailable(`refund failed with HTTP ${response.status}`);
    }
    this.logger.info('Refunded capture for an undelivered analysis');
  }

  private verifyCapture(
    payload: ReturnType<typeof PaypalCaptureOrderResponseSchema.parse>,
    orderId: string,
    expectedRequestId?: string,
  ): PaymentCaptureRecord {
    const price = this.config.paymentPrice;
    const capture = payload.purchase_units[0]?.payments?.captures?.[0];
    if (capture === undefined) {
      throw this.captureRejected('no capture present on the order');
    }
    const isVerified =
      payload.status === PAYPAL_STATUS_COMPLETED &&
      capture.status === PAYPAL_STATUS_COMPLETED &&
      capture.amount.value === price.value &&
      capture.amount.currency_code === price.currencyCode &&
      (expectedRequestId === undefined || capture.custom_id === expectedRequestId);
    if (!isVerified) {
      throw this.captureRejected('status/amount/binding mismatch');
    }
    return { orderId, captureId: capture.id };
  }

  private captureRejected(reason: string): Error {
    this.logger.warn(`Capture verification failed (${reason})`);
    return buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
  }

  private async post(path: string, body: string, idempotencyKey: string): Promise<Response> {
    const token = await this.getAccessToken();
    return this.boundedFetch(path, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        // PayPal replays the SAME result for a repeated key instead of acting twice.
        'paypal-request-id': idempotencyKey,
      },
      body,
    });
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken !== undefined && this.cachedToken.expiresAtMs > Date.now()) {
      return this.cachedToken.value;
    }
    const basic = Buffer.from(
      `${this.config.paypalClientId}:${this.config.paypalClientSecret}`,
    ).toString('base64');
    const response = await this.boundedFetch(PAYPAL_OAUTH_TOKEN_PATH, {
      method: 'POST',
      headers: {
        authorization: `Basic ${basic}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!response.ok) {
      this.logger.error(
        `PayPal OAuth failed with HTTP ${response.status} against the ${this.config.paypalEnv} endpoint. ` +
          `A 401 almost always means PAYPAL_CLIENT_ID/SECRET do not match PAYPAL_ENV — ` +
          `sandbox credentials are rejected by the live endpoint and vice versa. ` +
          `Verify the credentials belong to a ${this.config.paypalEnv} PayPal REST app.`,
      );
      throw this.unavailable('authentication with the payment provider failed');
    }
    const parsed = PaypalTokenResponseSchema.safeParse(await this.readJson(response));
    if (!parsed.success) {
      throw this.unavailable('OAuth returned an unexpected body');
    }
    const marginMs = PAYPAL_TOKEN_EXPIRY_MARGIN_SECONDS * MILLISECONDS_PER_SECOND;
    this.cachedToken = {
      value: parsed.data.access_token,
      expiresAtMs: Date.now() + parsed.data.expires_in * MILLISECONDS_PER_SECOND - marginMs,
    };
    return parsed.data.access_token;
  }

  private async boundedFetch(path: string, init: RequestInit): Promise<Response> {
    const baseUrl = PAYPAL_BASE_URL_BY_ENV[this.config.paypalEnv];
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, PAYPAL_REQUEST_TIMEOUT_MS);
    try {
      return await globalThis.fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    } catch (error: unknown) {
      if (error instanceof PaymentError) {
        throw error;
      }
      this.logger.warn(
        controller.signal.aborted ? 'PayPal call timed out' : 'PayPal transport failure',
      );
      throw this.unavailable('the payment provider could not be reached');
    } finally {
      clearTimeout(timer);
    }
  }

  /** Map PayPal's machine-readable issue codes onto the typed gate errors. */
  private async mapPaypalFailure(response: Response, operation: string): Promise<Error> {
    const parsed = PaypalErrorResponseSchema.safeParse(await this.readJson(response));
    const body: PaypalErrorResponse | undefined = parsed.success ? parsed.data : undefined;
    const issue = body?.details?.[0]?.issue;
    // Full machine-readable diagnostics (no payer PII): issue code, description,
    // PayPal's error name, and the debug_id to quote to PayPal support.
    this.logger.error(
      `PayPal ${operation} failed with HTTP ${response.status} ${buildPaypalDiagnostics(body)}`,
    );
    const isPaymentFailure = issue !== undefined && PAYPAL_PAYMENT_FAILED_ISSUES.includes(issue);
    if (isPaymentFailure || response.status === HTTP_STATUS_NOT_FOUND) {
      // No money moved; the buyer can simply try again with the same or another method.
      return buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    return this.unavailable(`${operation} failed at the payment provider`);
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
