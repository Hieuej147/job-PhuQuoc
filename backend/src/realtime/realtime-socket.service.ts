import { Injectable } from '@nestjs/common';
import type { Namespace, Server } from 'socket.io';
import { PinoLoggerService } from '../common/logger/pino-logger.service';
import type { RealtimeApplicationMessage } from './realtime.types';

@Injectable()
export class RealtimeSocketService {
  private server?: Server | Namespace;

  constructor(private readonly logger: PinoLoggerService) {}

  bindServer(server: Server | Namespace) {
    this.server = server;
  }

  emitApplicationMessage(applicationId: string, message: RealtimeApplicationMessage) {
    this.emitToRoom(`application:${applicationId}`, 'application.message.created', {
      applicationId,
      message,
    });
  }

  emitApplicationMessagesRead(applicationId: string, payload: { readerId: string; readAt: Date | string }) {
    this.emitToRoom(`application:${applicationId}`, 'application.messages.read', {
      applicationId,
      ...payload,
    });
  }

  private emitToRoom(room: string, event: string, payload: unknown) {
    if (!this.server) {
      this.logger.debug(`Socket.IO server not ready for ${event}`, 'RealtimeSocketService');
      return;
    }
    this.server.to(room).emit(event, payload);
  }
}
