import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';

export function createWeeklySummaryFunction(prisma: PrismaService) {
  return inngest.createFunction(
    { id: 'weekly-employer-summary', triggers: [{ cron: '0 9 * * 4,6' }] },
    async () => {
      const employers = await prisma.user.findMany({
        where: {
          role: 'EMPLOYER',
          companies: {
            some: {
              jobs: {
                some: { status: 'ACTIVE' },
              },
            },
          },
        },
        include: {
          companies: {
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
        const jobs = employer.companies.flatMap((c) => c.jobs);
        if (jobs.length === 0) continue;

        const summary = jobs
          .map((j) => `${j.title}: ${j._count.applications} CV`)
          .join('\n');

        await prisma.notification.create({
          data: {
            userId: employer.id,
            type: 'SYSTEM',
            title: 'Báo cáo tuần',
            content: `Tổng hợp ứng viên tuần này:\n${summary}`,
            refId: null,
            refType: null,
          },
        });
      }
    },
  );
}
