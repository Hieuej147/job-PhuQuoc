import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';

const READ_NOTIFICATION_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export function createNotificationCleanupFunction(prisma: PrismaService) {
  return inngest.createFunction(
    { id: 'cleanup-notifications', triggers: [{ cron: '0 3 * * *' }] },
    async () => {
      const now = new Date();
      const readCutoff = new Date(now.getTime() - READ_NOTIFICATION_RETENTION_DAYS * DAY_MS);

      await prisma.notification.deleteMany({
        where: {
          OR: [
            { expiresAt: { lte: now } },
            {
              isRead: true,
              readAt: { lte: readCutoff },
            },
          ],
        },
      });
    },
  );
}
