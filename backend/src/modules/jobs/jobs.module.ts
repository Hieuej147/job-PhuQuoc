import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { EmbeddingService } from './services/embedding.service';
import { JobBackgroundService } from './background/job-background.service';
import { QuotaModule } from '../../common/quota/quota.module';

@Module({
  imports: [QuotaModule],
  controllers: [JobsController],
  providers: [JobsService, EmbeddingService, JobBackgroundService],
  exports: [JobsService, JobBackgroundService],
})
export class JobsModule {}
