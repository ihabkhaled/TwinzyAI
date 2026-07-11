import { Injectable } from '@nestjs/common';

import type { CreatePaymentOrderResponse } from '@twinzy/shared';

import { AppConfigService } from '../../../config/app-config.service';
import { buildPaymentError, ErrorCode } from '../../../core/errors';
import { AppLogger } from '../../../core/logger';
import { PaypalAdapter } from '../adapters/paypal.adapter';
import { resolvePaymentOrderId } from '../lib/payment-order.util';
import {
  PAYMENT_ORDER_INVALID_MESSAGE,
  PAYMENT_REQUIRED_MESSAGE,
} from '../model/payment.constants';
import type { PaymentCaptureRecord } from '../model/payment.types';

const LOG_CONTEXT = 'PaymentGate';

/**
 * The paid-analysis gate. With the paywall OFF (no PayPal credentials) every
 * method is a no-op and the game behaves exactly as the free product. With it
 * ON, an analysis runs only at the moment its order CAPTURES at PayPal —
 * capture is single-use by PayPal's own semantics, so one payment can never be
 * replayed across runs — and a captured-but-undelivered run is refunded.
 */
@Injectable()
export class PaymentGateService {
  public constructor(
    private readonly config: AppConfigService,
    private readonly paypal: PaypalAdapter,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(LOG_CONTEXT);
  }

  /** Create a server-priced order bound to the caller's pre-minted request id. */
  public async createOrderForRequest(requestId: string): Promise<string> {
    this.assertEnabled();
    return this.paypal.createOrder(requestId);
  }

  /** Transport-shaped wrapper of {@link createOrderForRequest}. */
  public async createOrderResponse(requestId: string): Promise<CreatePaymentOrderResponse> {
    const orderId = await this.createOrderForRequest(requestId);
    return { orderId };
  }

  /**
   * Capture the payment for one analyze request. Returns undefined when the
   * paywall is off; throws a typed 402 when the order id is missing/malformed
   * or PayPal rejects the capture (unapproved, replayed, wrong amount).
   */
  public async captureForAnalysis(
    body: unknown,
    expectedRequestId?: string,
  ): Promise<PaymentCaptureRecord | undefined> {
    if (!this.config.isPaywallEnabled) {
      return undefined;
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

  /**
   * Refund a captured payment whose analysis was never delivered (pipeline
   * error, timeout, or user cancel). Best-effort: a refund failure is logged
   * loudly for operator reconciliation but never masks the original failure.
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
      await this.paypal.refundCapture(capture.captureId);
      this.logger.warn(`Refunded undelivered analysis (cause=${reason})`);
    } catch {
      this.logger.error(
        `REFUND FAILED for capture of an undelivered analysis (cause=${reason}) — reconcile in the PayPal dashboard`,
      );
    }
  }

  private assertEnabled(): void {
    if (!this.config.isPaywallEnabled) {
      throw buildPaymentError(ErrorCode.PaymentOrderInvalid, PAYMENT_ORDER_INVALID_MESSAGE);
    }
  }
}
