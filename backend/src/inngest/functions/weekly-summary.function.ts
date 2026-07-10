import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import { createNotificationInboxItem } from './notification-inbox.helper';
import type { RealtimeService } from '../../realtime/realtime.service';

export function createWeeklySummaryFunction(prisma: PrismaService, realtime?: RealtimeService) {
  return inngest.createFunction(
    { id: 'weekly-employer-summary', triggers: [{ cron: '0 9 * * 4,6' }] },
    async () => {
      const employers = await prisma.user.findMany({
        where: {
          role: 'EMPLOYER',
          company: {
            is: {
              jobs: {
                some: { status: 'ACTIVE' },
              },
            },
          },
        },
        include: {
          company: {
            include: {
              jobs: {
                where: { status: 'ACTIVE' },
                include: {
                  _count: { select: { applications: true } },
                },
              },
            },
          },
        },
      });

      for (const employer of employers) {
        const jobs = employer.company?.jobs ?? [];
        if (jobs.length === 0) continue;

        const summary = jobs
          .map((j) => `${j.title}: ${j._count.applications} CV`)
          .join('\n');

        const week = new Date().toISOString().slice(0, 10);
        await createNotificationInboxItem(prisma, {
          userId: employer.id,
          type: 'SYSTEM',
          title: 'Báo cáo tuần',
          content: `Tổng hợp ứng viên tuần này:\n${summary}`,
          refId: null,
          refType: null,
          dedupeKey: `weekly-employer-summary:${week}:${employer.id}`,
          expiresInDays: 90,
        }, realtime);
      }
    },
  );
}
