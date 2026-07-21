import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChatThreadDto, UpdateChatThreadDto, ChatAgentTypeDto } from './dto/chat-thread.dto';

const DEFAULT_THREAD_TITLE = 'Cuộc trò chuyện mới';
const TITLE_TIMEOUT_MS = 8000;
const TITLE_MAX_LENGTH = 60;
const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

@Injectable()
export class ChatThreadsService {
    private readonly logger = new Logger(ChatThreadsService.name);

    constructor(private readonly prisma: PrismaService) { }

    async create(userId: string, dto: CreateChatThreadDto) {
        return this.prisma.chatThread.create({
            data: {
                userId,
                agentType: dto.agentType as any,
                title: this.normalizeTitle(dto.title) || DEFAULT_THREAD_TITLE,
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
            data: { title: this.normalizeTitle(dto.title) || DEFAULT_THREAD_TITLE },
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
        const thread = await this.findOne(id, userId);

        if (thread.title !== DEFAULT_THREAD_TITLE) {
            return thread;
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const sourceMessage = this.normalizeMessage(firstMessage);
        let title = this.fallbackTitle(sourceMessage);
        this.logger.log(`Generating title for chat thread ${id}`);

        if (apiKey) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), TITLE_TIMEOUT_MS);

            try {
                const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
                    method: 'POST',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: process.env.CHAT_THREAD_TITLE_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
                        messages: [
                            {
                                role: 'system',
                                content: 'Tóm tắt câu sau thành tiêu đề ngắn gọn tối đa 6 từ, tiếng Việt, không dấu chấm câu cuối, không dùng dấu ngoặc kép.',
                            },
                            { role: 'user', content: sourceMessage },
                        ],
                        max_tokens: 20,
                        temperature: 0.3,
                    }),
                });

                if (response.ok) {
                    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
                    title = this.normalizeTitle(data.choices?.[0]?.message?.content) || title;
                } else {
                    this.logger.warn(`Thread title generation failed with status ${response.status}`);
                }
            } catch (error) {
                this.logger.warn(`Thread title generation fallback used: ${error instanceof Error ? error.message : 'unknown error'}`);
            } finally {
                clearTimeout(timeout);
            }
        }

        return this.prisma.chatThread.update({
            where: { id },
            data: { title },
        });
    }

    async generateTitleStream(
        id: string,
        userId: string,
        firstMessage: string,
        onPartialTitle: (title: string) => void,
    ) {
        const thread = await this.findOne(id, userId);

        if (thread.title !== DEFAULT_THREAD_TITLE) {
            onPartialTitle(thread.title);
            return thread;
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const sourceMessage = this.normalizeMessage(firstMessage);
        const fallback = this.fallbackTitle(sourceMessage);

        if (!apiKey) {
            return this.prisma.chatThread.update({
                where: { id },
                data: { title: fallback },
            });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TITLE_TIMEOUT_MS);
        let streamedTitle = '';

        try {
            const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: process.env.CHAT_THREAD_TITLE_MODEL ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
                    messages: this.buildTitlePrompt(sourceMessage),
                    max_tokens: 20,
                    temperature: 0.3,
                    stream: true,
                }),
            });

            if (!response.ok || !response.body) {
                this.logger.warn(`Thread title stream failed with status ${response.status}`);
                return this.prisma.chatThread.update({
                    where: { id },
                    data: { title: fallback },
                });
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed.startsWith('data:')) continue;

                    const data = trimmed.slice(5).trim();
                    if (!data || data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (!delta) continue;

                        streamedTitle += delta;
                        const partialTitle = this.normalizeTitle(streamedTitle);
                        if (partialTitle) onPartialTitle(partialTitle);
                    } catch {
                        this.logger.warn('Skipping malformed OpenAI title stream chunk');
                    }
                }
            }
        } catch (error) {
            this.logger.warn(`Thread title stream fallback used: ${error instanceof Error ? error.message : 'unknown error'}`);
        } finally {
            clearTimeout(timeout);
        }

        const title = this.normalizeTitle(streamedTitle) || fallback;
        return this.prisma.chatThread.update({
            where: { id },
            data: { title },
        });
    }

    private normalizeMessage(value: string) {
        return value.replace(/\s+/g, ' ').trim();
    }

    private normalizeTitle(value?: string) {
        return value
            ?.replace(/^["'“”‘’]+|["'“”‘’.。!?！？]+$/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, TITLE_MAX_LENGTH);
    }

    private fallbackTitle(message: string) {
        return this.normalizeTitle(message) || DEFAULT_THREAD_TITLE;
    }

    private buildTitlePrompt(sourceMessage: string) {
        return [
            {
                role: 'system',
                content: 'Tóm tắt câu sau thành tiêu đề ngắn gọn tối đa 6 từ, tiếng Việt, không dấu chấm câu cuối, không dùng dấu ngoặc kép.',
            },
            { role: 'user', content: sourceMessage },
        ];
    }
}
