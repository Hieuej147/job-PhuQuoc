import { Global, Module } from '@nestjs/common';
import { JobContractService } from './contracts/job.contract';
import { CompanyContractService } from './contracts/company.contract';
import { PricingContractService } from './contracts/pricing.contract';
import { PaymentContractService } from './contracts/payment.contract';
import { UserContractService } from './contracts/user.contract';
import { AuditWriteContractService } from './contracts/audit.contract';

@Global()
@Module({
  providers: [
    JobContractService,
    CompanyContractService,
    PricingContractService,
    PaymentContractService,
    UserContractService,
    AuditWriteContractService,
  ],
  exports: [
    JobContractService,
    CompanyContractService,
    PricingContractService,
    PaymentContractService,
    UserContractService,
    AuditWriteContractService,
  ],
})
export class SharedModule {}
