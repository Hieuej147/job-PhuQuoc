import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PinoLoggerService } from '../common/logger/pino-logger.service';
import { RealtimeSocketService } from './realtime-socket.service';
import { SocketAuthService } from './socket-auth.service';
import type { RealtimeUser } from './realtime.types';

type AuthedSocket = Socket & { data: { user?: RealtimeUser } };
type GatewaySocketServer = Server | Namespace;

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: GatewaySocketServer;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: PinoLoggerService,
    private readonly realtimeSocket: RealtimeSocketService,
    private readonly socketAuth: SocketAuthService,
  ) {}

  async afterInit(server: GatewaySocketServer) {
    this.realtimeSocket.bindServer(server);
    await this.tryUseRedisAdapter(server);
    this.logger.log('Realtime gateway initialized at /realtime', 'RealtimeGateway');
  }

  async handleConnection(socket: AuthedSocket) {
    try {
      const user = await this.socketAuth.getUserFromCookie(socket.handshake.headers.cookie);
      socket.data.user = user;
      await socket.join(`user:${user.id}`);
      if (user.role === 'EMPLOYER') await socket.join(`employer:${user.id}`);
      if (user.role === 'CANDIDATE') await socket.join(`candidate:${user.id}`);
      this.logger.debug(`Realtime client connected: ${user.id}`, 'RealtimeGateway');
    } catch (error) {
      this.logger.warn(`Realtime auth failed: ${(error as Error).message}`, 'RealtimeGateway');
      socket.disconnect(true);
    }
  }

  @SubscribeMessage('application.join')
  async joinApplication(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { applicationId?: string },
  ) {
    const user = socket.data.user;
    const applicationId = body?.applicationId;
    if (!user || !applicationId) return { ok: false };

    const allowed = await this.socketAuth.canAccessApplication(applicationId, user.id);
    if (!allowed) return { ok: false };

    await socket.join(`application:${applicationId}`);
    return { ok: true };
  }

  @SubscribeMessage('application.leave')
  async leaveApplication(
    @ConnectedSocket() socket: AuthedSocket,
    @MessageBody() body: { applicationId?: string },
  ) {
    if (body?.applicationId) await socket.leave(`application:${body.applicationId}`);
    return { ok: true };
  }

  private async tryUseRedisAdapter(server: GatewaySocketServer) {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) return;

    try {
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();
      const ioServer = this.resolveRootServer(server);
      ioServer.adapter(createAdapter(pubClient as never, subClient as never));
      this.logger.log('Realtime Redis adapter enabled', 'RealtimeGateway');
    } catch (error) {
      this.logger.warn(`Realtime Redis adapter disabled: ${(error as Error).message}`, 'RealtimeGateway');
    }
  }

  private resolveRootServer(server: GatewaySocketServer): Server {
    if (typeof (server as Server).adapter === 'function') {
      return server as Server;
    }

    const namespace = server as Namespace;
    if (namespace.server && typeof namespace.server.adapter === 'function') {
      return namespace.server;
    }

    throw new Error('Socket.IO root server adapter API is unavailable');
  }
}
