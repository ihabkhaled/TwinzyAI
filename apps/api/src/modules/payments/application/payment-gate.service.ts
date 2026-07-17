import { Injectable } from '@nestjs/common';

import type { CreatePaymentOrderResponse, PaymobIntentionResponse } from '@twinzy/shared';
import { PaymentGateway, PaymobIntentionResponseSchema } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { buildPaymentError, ErrorCode } from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import { PaymobAdapter } from '../adapters/paymob.adapter';
import { PaypalAdapter } from '../adapters/paypal.adapter';
import { resolvePaymentGateway, resolvePaymentOrderId } from '../lib/payment-order.util';
import {
  PAYMENT_ORDER_INVALID_MESSAGE,
  PAYMENT_REQUIRED_MESSAGE,
} from '../model/payment.constants';
import type { PaymentCaptureRecord } from '../model/payment.types';

const LOG_CONTEXT = 'PaymentGate';

/**
 * The paid-analysis gate across both providers. With the paywall OFF (no
 * credentials) every method is a no-op and the game behaves exactly as the free
 * product. With it ON, an analysis runs only once the payment is proven at the
 * provider — PayPal by capturing the approved order, Paymob by a server-side
 * transaction inquiry bound to the request id — and a paid-but-undelivered run
 * is refunded at the provider it was charged on. No local ledger is kept.
 */
@Injectable()
export class PaymentGateService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly paypal: PaypalAdapter,
    private readonly paymob: PaymobAdapter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  /** Create a server-priced PayPal order bound to the caller's request id. */
  public async createOrderForRequest(requestId: string): Promise<string> {
    if (!this.config.isPaypalEnabled) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    return this.paypal.createOrder(requestId);
  }

  /** Transport-shaped wrapper of {@link createOrderForRequest}. */
  public async createOrderResponse(requestId: string): Promise<CreatePaymentOrderResponse> {
    const orderId = await this.createOrderForRequest(requestId);
    return { orderId };
  }

  /** Create a server-priced Paymob intention (EGP) for the caller's request id. */
  public async createPaymobIntention(requestId: string): Promise<PaymobIntentionResponse> {
    if (!this.config.isPaymobEnabled) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    const intention = await this.paymob.createIntention(requestId);
    const price = this.config.paymentPrice;
    // Validate the server's own response against the shared contract before it
    // leaves the boundary — a config/price drift fails loudly here, not on the client.
    return PaymobIntentionResponseSchema.parse({
      clientSecret: intention.clientSecret,
      publicKey: this.config.paymob.publicKey,
      amountCents: intention.amountCents,
      currency: intention.currency,
      usdBaseValue: price.value,
      usdBaseCurrency: price.currencyCode,
    });
  }

  /**
   * Prove payment for one analyze request. Returns undefined when the paywall is
   * off; otherwise routes to the gateway the client used and throws a typed 402
   * when payment is missing or the provider rejects it.
   */
  public async captureForAnalysis(
    body: unknown,
    expectedRequestId?: string,
  ): Promise<PaymentCaptureRecord | undefined> {
    if (!this.config.isPaywallEnabled) {
      return undefined;
    }
    return resolvePaymentGateway(body) === PaymentGateway.Paymob
      ? this.capturePaymob(expectedRequestId)
      : this.capturePaypal(body, expectedRequestId);
  }

  /**
   * Refund a captured payment whose analysis was never delivered, on the gateway
   * it was charged. Best-effort: a refund failure is logged loudly for operator
   * reconciliation but never masks the original failure.
   */
  public async refundOnFailure(
    capture: PaymentCaptureRecord | undefined,
    cause: unknown,
  ): Promise<void> {
    if (capture === undefined) {
      return;
    }
    const reason = cause instanceof Error ? cause.name : 'unknown';
    try {
      await this.refundCapture(capture);
      this.logger.warn(
        `Refunded undelivered analysis (gateway=${capture.gateway}, cause=${reason})`,
      );
    } catch {
      this.logger.error(
        `REFUND FAILED for an undelivered analysis (gateway=${capture.gateway}, cause=${reason}) — reconcile in the ${capture.gateway} dashboard`,
      );
    }
  }

  private async capturePaymob(expectedRequestId?: string): Promise<PaymentCaptureRecord> {
    if (!this.config.isPaymobEnabled) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    if (expectedRequestId === undefined) {
      throw buildPaymentError(ErrorCode.PaymentRequired, PAYMENT_REQUIRED_MESSAGE);
    }
    return this.paymob.verifyPayment(expectedRequestId);
  }

  private async capturePaypal(
    body: unknown,
    expectedRequestId?: string,
  ): Promise<PaymentCaptureRecord> {
    if (!this.config.isPaypalEnabled) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    const orderId = resolvePaymentOrderId(body);
    if (orderId === undefined) {
      throw buildPaymentError(ErrorCode.PaymentRequired, PAYMENT_REQUIRED_MESSAGE);
    }
    if (orderId === null) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
    return this.paypal.captureOrder(orderId, expectedRequestId);
  }

  private refundCapture(capture: PaymentCaptureRecord): Promise<void> {
    return capture.gateway === PaymentGateway.Paymob
      ? this.paymob.refund(capture)
      : this.paypal.refundCapture(capture.captureId);
  }
}
