import { Module } from '@nestjs/common';

import { ExchangeRateAdapter } from './adapters/exchange-rate.adapter';
import { PaymobAdapter } from './adapters/paymob.adapter';
import { PaypalAdapter } from './adapters/paypal.adapter';
import { PaymentsController } from './api/payments.controller';
import { PaymentGateService } from './application/payment-gate.service';

/**
 * Paid-analysis payments across PayPal (Orders v2) and Paymob (card, EGP).
 * Enabled purely by configuration: without a provider's credentials that path
 * no-ops and the game stays free. Exports the gate so the game module can
 * verify-at-consumption inside analyze runs.
 */
@Module({
  controllers: [PaymentsController],
  providers: [PaypalAdapter, PaymobAdapter, ExchangeRateAdapter, PaymentGateService],
  exports: [PaymentGateService],
})
export class PaymentsModule {}
