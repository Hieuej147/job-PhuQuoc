import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeGateway } from './gateways/stripe.gateway';
import { MockGateway } from './gateways/mock.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeGateway, MockGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
