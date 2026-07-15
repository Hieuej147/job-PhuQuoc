import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatThreadDto, UpdateChatThreadDto, ChatAgentTypeDto } from './dto/chat-thread.dto';

@Injectable()
export class ChatThreadsService {
    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateChatThreadDto) {
        return this.prisma.chatThread.create({
            data: {
                userId,
                agentType: dto.agentType as any,
                title: dto.title || 'Cuộc trò chuyện mới',
            },
        });
    }

    async findAllByUser(userId: string, agentType: ChatAgentTypeDto) {
        return this.prisma.chatThread.findMany({
            where: { userId, agentType: agentType as any },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async findOne(id: string, userId: string) {
        const thread = await this.prisma.chatThread.findUnique({ where: { id } });
        if (!thread) throw new NotFoundException('Thread not found');
        if (thread.userId !== userId) throw new ForbiddenException('Not your thread');
        return thread;
    }

    async update(id: string, userId: string, dto: UpdateChatThreadDto) {
        await this.findOne(id, userId);
        return this.prisma.chatThread.update({
            where: { id },
            data: { title: dto.title },
        });
    }

    async touch(id: string, userId: string) {
        await this.findOne(id, userId);
        return this.prisma.chatThread.update({
            where: { id },
            data: { updatedAt: new Date() },
        });
    }

    async remove(id: string, userId: string) {
        await this.findOne(id, userId);
        await this.prisma.chatThread.delete({ where: { id } });
        return { message: 'Thread deleted' };
    }

    async generateTitle(id: string, userId: string, firstMessage: string) {
        await this.findOne(id, userId);

        const apiKey = process.env.OPENAI_API_KEY;
        let title = firstMessage.slice(0, 40).trim() || 'Cuộc trò chuyện mới';

        if (apiKey) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'Tóm tắt câu sau thành tiêu đề ngắn gọn tối đa 6 từ, tiếng Việt, không dấu chấm câu cuối, không dùng dấu ngoặc kép.',
                            },
                            { role: 'user', content: firstMessage },
                        ],
                        max_tokens: 20,
                        temperature: 0.3,
                    }),
                });
                const data = await response.json();
                const generated = data?.choices?.[0]?.message?.content?.trim();
                if (generated) title = generated;
            } catch {
                // Giữ nguyên fallback title nếu gọi LLM lỗi
            }
        }

        return this.prisma.chatThread.update({
            where: { id },
            data: { title },
        });
    }
}