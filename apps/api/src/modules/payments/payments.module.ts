import { Module } from '@nestjs/common';

import { PaypalAdapter } from './adapters/paypal.adapter';
import { PaymentsController } from './api/payments.controller';
import { PaymentGateService } from './application/payment-gate.service';

/**
 * Paid-analysis payments (PayPal Orders v2). Enabled purely by configuration:
 * without PayPal credentials the gate no-ops and the game stays free. Exports
 * the gate so the game module can capture-at-consumption inside analyze runs.
 */
@Module({
  controllers: [PaymentsController],
  providers: [PaypalAdapter, PaymentGateService],
  exports: [PaymentGateService],
})
export class PaymentsModule {}
