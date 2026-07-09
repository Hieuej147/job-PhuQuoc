import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { MockGateway } from './gateways/mock.gateway';
import { PaymentCompletionService } from './application/payment-completion.service';
import { QuotaModule } from '../../common/quota/quota.module';

@Module({
  imports: [QuotaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentCompletionService, StripeGateway, MockGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
