import { Module } from '@nestjs/common';
import { ChatThreadsController } from './chat-threads.controller';
import { ChatThreadsService } from './chat-threads.service';

@Module({
    controllers: [ChatThreadsController],
    providers: [ChatThreadsService],
})
export class ChatThreadsModule { }