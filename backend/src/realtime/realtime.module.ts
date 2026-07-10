import { Global, Module } from '@nestjs/common';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeService } from './realtime.service';
import { SocketAuthService } from './socket-auth.service';

@Global()
@Module({
  providers: [RealtimeGateway, RealtimeService, SocketAuthService],
  exports: [RealtimeService],
})
export class RealtimeModule {}

