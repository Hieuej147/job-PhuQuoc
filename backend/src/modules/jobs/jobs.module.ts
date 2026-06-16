import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { EmbeddingService } from './services/embedding.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, EmbeddingService],
  exports: [JobsService],
})
export class JobsModule {}
