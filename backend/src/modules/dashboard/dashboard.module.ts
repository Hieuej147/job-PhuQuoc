import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { QuotaModule } from '../../common/quota/quota.module';

@Module({
  imports: [QuotaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
