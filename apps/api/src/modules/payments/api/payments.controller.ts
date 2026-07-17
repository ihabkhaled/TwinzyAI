import { Body, Controller, Post, UsePipes } from '@nestjs/common';

import type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResponse,
  PaymobIntentionRequest,
  PaymobIntentionResponse,
} from '@twinzy/shared';
import { CreatePaymentOrderRequestSchema, PaymobIntentionRequestSchema } from '@twinzy/shared';

import { Throttle } from '../../../core/rate-limit';
import { createZodValidationPipe } from '../../../core/validation';
import { PaymentGateService } from '../application/payment-gate.service';
import {
  CREATE_ORDER_THROTTLE,
  PAYMENTS_ROUTE_ORDERS,
  PAYMENTS_ROUTE_PAYMOB_INTENTION,
  PAYMENTS_ROUTE_ROOT,
} from '../model/payment.constants';

/**
 * Paid-analysis order endpoint. Thin transport: validate the request id and
 * delegate to the gate (which owns enablement + server-side pricing + the
 * response shape). The PayPal order id it returns is what the client's
 * checkout buttons approve.
 */
@Controller(PAYMENTS_ROUTE_ROOT)
export class PaymentsController {
  public constructor(private readonly paymentGate: PaymentGateService) {}

  @Post(PAYMENTS_ROUTE_ORDERS)
  @Throttle(CREATE_ORDER_THROTTLE)
  @UsePipes(createZodValidationPipe(CreatePaymentOrderRequestSchema))
  public createOrder(@Body() body: CreatePaymentOrderRequest): Promise<CreatePaymentOrderResponse> {
    return this.paymentGate.createOrderResponse(body.requestId);
  }

  @Post(PAYMENTS_ROUTE_PAYMOB_INTENTION)
  @Throttle(CREATE_ORDER_THROTTLE)
  @UsePipes(createZodValidationPipe(PaymobIntentionRequestSchema))
  public createPaymobIntention(
    @Body() body: PaymobIntentionRequest,
  ): Promise<PaymobIntentionResponse> {
    return this.paymentGate.createPaymobIntention(body.requestId);
  }
}
