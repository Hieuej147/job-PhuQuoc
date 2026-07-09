import { Module } from '@nestjs/common';
import { QuotaController } from './quota.controller';
import { QuotaService } from './storage-quota';

@Module({
  controllers: [QuotaController],
  providers: [QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}
