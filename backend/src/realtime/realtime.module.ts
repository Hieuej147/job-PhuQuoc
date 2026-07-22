import { Global, Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeSocketService } from './realtime-socket.service';
import { RealtimeSseService } from './realtime-sse.service';
import { RealtimeService } from './realtime.service';
import { SocketAuthService } from './socket-auth.service';

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [RealtimeGateway, RealtimeSocketService, RealtimeSseService, RealtimeService, SocketAuthService],
  exports: [RealtimeService],
})
export class RealtimeModule {}
