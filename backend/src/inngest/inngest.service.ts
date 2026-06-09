import { Injectable } from '@nestjs/common';
import { inngest } from './client';
import { PinoLoggerService } from '../common/logger/pino-logger.service';
import type { EventName, EventData } from './events.types';

export interface InngestEvent<T extends EventName = EventName> {
  name: T;
  data: EventData<T>;
  id?: string;
  ts?: number;
}

@Injectable()
export class InngestService {
  constructor(private readonly logger: PinoLoggerService) {}

  getClient() {
    return inngest;
  }

  async send<T extends EventName>(event: InngestEvent<T>): Promise<void> {
    try {
      await inngest.send({
        name: event.name,
        data: event.data as unknown as Record<string, unknown>,
        id: event.id,
        ts: event.ts,
      });
      this.logger.debug(`Event sent: ${event.name}`, 'InngestService');
    } catch (error) {
      this.logger.error(`Failed to send event ${event.name}: ${(error as Error).message}`, undefined, 'InngestService');
      throw error;
    }
  }

  async sendBatch(events: InngestEvent[]): Promise<void> {
    try {
      await inngest.send(
        events.map((e) => ({
          name: e.name,
          data: e.data as unknown as Record<string, unknown>,
          id: e.id,
          ts: e.ts,
        })),
      );
      this.logger.debug(`Batch sent: ${events.length} events`, 'InngestService');
    } catch (error) {
      this.logger.error(`Failed to send batch: ${(error as Error).message}`, undefined, 'InngestService');
      throw error;
    }
  }
}
