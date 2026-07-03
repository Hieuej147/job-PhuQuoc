import { Injectable } from '@nestjs/common';
import { InngestService } from '../../../inngest/inngest.service';
import { PinoLoggerService } from '../../../common/logger/pino-logger.service';

interface ApplicationEventPayload {
  applicationId: string;
  jobTitle: string;
  companyName: string;
  employerId?: string;
  candidateId?: string;
}

@Injectable()
export class ApplicationEventsPublisher {
  constructor(
    private readonly inngest: InngestService,
    private readonly logger: PinoLoggerService,
  ) {}

  applicationCreated(payload: ApplicationEventPayload) {
    void this.publish('application.created', payload);
  }

  applicationAccepted(payload: ApplicationEventPayload) {
    void this.publish('application.accepted', payload);
  }

  applicationRejected(payload: ApplicationEventPayload) {
    void this.publish('application.rejected', payload);
  }

  private async publish(
    name: 'application.created' | 'application.accepted' | 'application.rejected',
    data: ApplicationEventPayload,
  ) {
    try {
      await this.inngest.send({ name, data });
    } catch (error) {
      this.logger.warn(
        `Failed to publish ${name}: ${(error as Error).message}`,
        ApplicationEventsPublisher.name,
      );
    }
  }
}
