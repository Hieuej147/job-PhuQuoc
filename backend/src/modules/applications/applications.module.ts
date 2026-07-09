import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { UploadModule } from '../upload/upload.module';
import { ApplicationEventsPublisher } from './infrastructure/application-events.publisher';
import { QuotaModule } from '../../common/quota/quota.module';

@Module({
  imports: [UploadModule, QuotaModule],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, ApplicationEventsPublisher],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
