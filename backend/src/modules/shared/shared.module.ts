import { Global, Module } from '@nestjs/common';
import { JobContractService } from './contracts/job.contract';
import { CompanyContractService } from './contracts/company.contract';
import { PricingContractService } from './contracts/pricing.contract';
import { PaymentContractService } from './contracts/payment.contract';
import { UserContractService } from './contracts/user.contract';

@Global()
@Module({
  providers: [
    JobContractService,
    CompanyContractService,
    PricingContractService,
    PaymentContractService,
    UserContractService,
  ],
  exports: [
    JobContractService,
    CompanyContractService,
    PricingContractService,
    PaymentContractService,
    UserContractService,
  ],
})
export class SharedModule {}
