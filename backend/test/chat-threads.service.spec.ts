import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatThreadsService } from '../src/modules/chat-threads/chat-threads.service';

const originalOpenAiApiKey = process.env.OPENAI_API_KEY;
const originalOpenAiModel = process.env.OPENAI_MODEL;
const originalChatThreadTitleModel = process.env.CHAT_THREAD_TITLE_MODEL;

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

const defaultThread = {
  id: 'thread-1',
  userId: 'user-1',
  agentType: 'CANDIDATE',
  title: 'Cuộc trò chuyện mới',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('ChatThreadsService', () => {
  let service: ChatThreadsService;
  let prismaMock: any;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.CHAT_THREAD_TITLE_MODEL;

    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    prismaMock = {
      chatThread: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    service = new ChatThreadsService(prismaMock as any);
  });

  afterEach(() => {
    restoreEnv('OPENAI_API_KEY', originalOpenAiApiKey);
    restoreEnv('OPENAI_MODEL', originalOpenAiModel);
    restoreEnv('CHAT_THREAD_TITLE_MODEL', originalChatThreadTitleModel);
    vi.unstubAllGlobals();
  });

  it('uses a fallback title when OpenAI is not configured', async () => {
    prismaMock.chatThread.findUnique.mockResolvedValue(defaultThread);
    prismaMock.chatThread.update.mockResolvedValue({
      ...defaultThread,
      title: 'Tìm việc lễ tân tại resort Phú Quốc',
    });

    const result = await service.generateTitle(
      defaultThread.id,
      defaultThread.userId,
      '  Tìm việc lễ tân tại resort Phú Quốc  ',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prismaMock.chatThread.update).toHaveBeenCalledWith({
      where: { id: defaultThread.id },
      data: { title: 'Tìm việc lễ tân tại resort Phú Quốc' },
    });
    expect(result.title).toBe('Tìm việc lễ tân tại resort Phú Quốc');
  });

  it('generates a title with OpenAI when configured', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.CHAT_THREAD_TITLE_MODEL = 'gpt-test';
    prismaMock.chatThread.findUnique.mockResolvedValue(defaultThread);
    prismaMock.chatThread.update.mockResolvedValue({
      ...defaultThread,
      title: 'Việc lễ tân resort',
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '"Việc lễ tân resort."' } }],
      }),
    });

    await service.generateTitle(defaultThread.id, defaultThread.userId, 'Tôi muốn tìm việc lễ tân tại resort');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"gpt-test"'),
      }),
    );
    expect(prismaMock.chatThread.update).toHaveBeenCalledWith({
      where: { id: defaultThread.id },
      data: { title: 'Việc lễ tân resort' },
    });
  });

  it('streams fallback title without OpenAI when streaming is requested', async () => {
    const partialTitles: string[] = [];
    prismaMock.chatThread.findUnique.mockResolvedValue(defaultThread);
    prismaMock.chatThread.update.mockResolvedValue({
      ...defaultThread,
      title: 'Tạo CV lễ tân khách sạn',
    });

    const result = await service.generateTitleStream(
      defaultThread.id,
      defaultThread.userId,
      'Tạo CV lễ tân khách sạn',
      (title) => partialTitles.push(title),
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(partialTitles).toEqual([]);
    expect(prismaMock.chatThread.update).toHaveBeenCalledWith({
      where: { id: defaultThread.id },
      data: { title: 'Tạo CV lễ tân khách sạn' },
    });
    expect(result.title).toBe('Tạo CV lễ tân khách sạn');
  });

  it('does not overwrite a manually renamed thread title', async () => {
    const renamedThread = { ...defaultThread, title: 'CV cho lễ tân' };
    prismaMock.chatThread.findUnique.mockResolvedValue(renamedThread);

    const result = await service.generateTitle(defaultThread.id, defaultThread.userId, 'Tin nhắn mới');

    expect(result).toEqual(renamedThread);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prismaMock.chatThread.update).not.toHaveBeenCalled();
  });
});
