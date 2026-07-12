import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../../../common/logger/pino-logger.service';
import { EmbeddingService } from '../services/embedding.service';

@Injectable()
export class JobBackgroundService {
  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly logger: PinoLoggerService,
  ) {}

  syncEmbedding(job: {
    id: string;
    title: string;
    description: string;
    requirements?: string | null;
    benefits?: string | null;
  }) {
    const supportingText = [job.requirements, job.benefits].filter(Boolean).join('\n\n');
    void this.embeddingService
      .syncJobEmbedding(job.id, job.title, job.description, supportingText || undefined)
      .catch((error: Error) => {
        this.logger.warn(
          `Failed to sync job embedding ${job.id}: ${error.message}`,
          JobBackgroundService.name,
        );
      });
  }
}
