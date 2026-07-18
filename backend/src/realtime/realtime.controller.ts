import { Controller, Sse } from '@nestjs/common';
import type { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RealtimeSseService } from './realtime-sse.service';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeSse: RealtimeSseService) {}

  @Sse('events')
  streamEvents(@CurrentUser() user: UserSession): Observable<MessageEvent> {
    return this.realtimeSse.streamUserEvents(user.user.id);
  }
}
