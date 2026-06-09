import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TypedInngestContext } from '../inngest.types';

export function createUserFunctions(prisma: PrismaService) {
  const onUserRegistered = inngest.createFunction(
    { id: 'on-user-registered', triggers: [{ event: 'user.registered' }] },
    async ({ event, step }: TypedInngestContext<'user.registered'>) => {
      const { userId, email, name } = event.data;

      await step.run('log-welcome', async () => {
        console.log(`[Inngest] New user registered: ${name} (${email})`);
        return { userId, email, name };
      });

      await step.run('create-welcome-notification', async () => {
        await prisma.notification.create({
          data: {
            userId,
            type: 'SYSTEM',
            title: 'Chào mừng bạn đến với Phú Quốc Jobs!',
            content: `Xin chào ${name}, cảm ơn bạn đã đăng ký tài khoản. Hãy hoàn thiện hồ sơ để bắt đầu.`,
          },
        });
      });
    },
  );

  return [onUserRegistered];
}
