import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatThreadsService } from './chat-threads.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ChatAgentTypeDto, CreateChatThreadDto, GenerateChatThreadTitleDto, UpdateChatThreadDto } from './dto/chat-thread.dto';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@ApiTags('Chat Threads')
@Controller('chat-threads')
export class ChatThreadsController {
    constructor(private readonly service: ChatThreadsService) { }

    @Get()
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Danh sách cuộc trò chuyện của tôi' })
    @ApiQuery({ name: 'agentType', enum: ChatAgentTypeDto })
    findAll(@CurrentUser() user: UserSession, @Query('agentType') agentType: ChatAgentTypeDto) {
        return this.service.findAllByUser(user.user.id, agentType);
    }

    @Post()
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Tạo cuộc trò chuyện mới' })
    create(@CurrentUser() user: UserSession, @Body() dto: CreateChatThreadDto) {
        return this.service.create(user.user.id, dto);
    }

    @Patch(':id')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Đổi tiêu đề cuộc trò chuyện' })
    update(@Param('id') id: string, @CurrentUser() user: UserSession, @Body() dto: UpdateChatThreadDto) {
        return this.service.update(id, user.user.id, dto);
    }

    @Patch(':id/touch')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Cập nhật thời gian hoạt động gần nhất' })
    touch(@Param('id') id: string, @CurrentUser() user: UserSession) {
        return this.service.touch(id, user.user.id);
    }

    @Patch(':id/generate-title')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Tự động đặt tên cuộc trò chuyện bằng AI dựa trên tin nhắn đầu tiên' })
    generateTitle(
        @Param('id') id: string,
        @CurrentUser() user: UserSession,
        @Body() body: GenerateChatThreadTitleDto,
    ) {
        return this.service.generateTitle(id, user.user.id, body.firstMessage);
    }

    @Post(':id/generate-title/stream')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Stream tiêu đề cuộc trò chuyện bằng AI dựa trên tin nhắn đầu tiên' })
    async generateTitleStream(
        @Param('id') id: string,
        @CurrentUser() user: UserSession,
        @Body() body: GenerateChatThreadTitleDto,
        @Res() res: Response,
    ) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        const sendEvent = (event: string, data: unknown) => {
            res.write(`event: ${event}\n`);
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        try {
            const thread = await this.service.generateTitleStream(
                id,
                user.user.id,
                body.firstMessage,
                (title) => sendEvent('partial', { title }),
            );
            sendEvent('final', { thread });
        } catch (error) {
            sendEvent('error', {
                message: error instanceof Error ? error.message : 'Không thể tạo tiêu đề cuộc trò chuyện.',
            });
        } finally {
            res.end();
        }
    }

    @Delete(':id')
    @ApiBearerAuth('better-auth.session_token')
    @ApiOperation({ summary: 'Xóa cuộc trò chuyện' })
    remove(@Param('id') id: string, @CurrentUser() user: UserSession) {
        return this.service.remove(id, user.user.id);
    }
}
