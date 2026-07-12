import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TypedInngestContext } from '../inngest.types';
import { createNotificationInboxItem } from './notification-inbox.helper';
import type { RealtimeService } from '../../realtime/realtime.service';

export function createUserFunctions(prisma: PrismaService, realtime?: RealtimeService) {
  const onUserRegistered = inngest.createFunction(
    { id: 'on-user-registered', triggers: [{ event: 'user.registered' }] },
    async ({ event, step }: TypedInngestContext<'user.registered'>) => {
      const { userId, email, name } = event.data;

      await step.run('log-welcome', async () => {
        console.log(`[Inngest] New user registered: ${name} (${email})`);
        return { userId, email, name };
      });

      await step.run('create-welcome-notification', async () => {
        await createNotificationInboxItem(prisma, {
          userId,
          type: 'SYSTEM',
          title: 'Chào mừng bạn đến với Phú Quốc Jobs!',
          content: `Xin chào ${name}, cảm ơn bạn đã đăng ký tài khoản. Hãy hoàn thiện hồ sơ để bắt đầu.`,
          dedupeKey: `user.registered:${userId}`,
        }, realtime);
      });
    },
  );

  return [onUserRegistered];
}
