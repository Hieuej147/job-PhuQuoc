import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TypedInngestContext, CronInngestContext } from '../inngest.types';

export function createJobExpiryFunctions(prisma: PrismaService) {
  const onJobActivated = inngest.createFunction(
    { id: 'schedule-job-expiry', triggers: [{ event: 'job.activated' }] },
    async ({ event, step }: TypedInngestContext<'job.activated'>) => {
      const { jobId, deadline } = event.data;
      if (!deadline) return;
      const deadlineTime = new Date(deadline).getTime();
      const threeDaysBefore = deadlineTime - 3 * 24 * 60 * 60 * 1000;

      if (threeDaysBefore > Date.now()) {
        await step.sendEvent('schedule-expiry-warning', {
          name: 'job.expiring-soon',
          ts: threeDaysBefore,
          data: { jobId },
        });
      }

      await step.sendEvent('schedule-expired', {
        name: 'job.expired',
        ts: deadlineTime,
        data: { jobId },
      });
    },
  );

  const onJobExpiringSoon = inngest.createFunction(
    { id: 'on-job-expiring-soon', triggers: [{ event: 'job.expiring-soon' }] },
    async ({ event }: TypedInngestContext<'job.expiring-soon'>) => {
      const { jobId } = event.data;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, title: true, status: true },
      });

      if (!job || job.status !== 'ACTIVE') return;

      const savedJobs = await prisma.savedJob.findMany({
        where: { jobId },
        select: { userId: true },
      });

      for (const saved of savedJobs) {
        await prisma.notification.create({
          data: {
            userId: saved.userId,
            type: 'JOB_DEADLINE',
            title: 'Job sắp hết hạn',
            content: `Vị trí "${job.title}" sẽ hết hạn sau 3 ngày. Nộp CV ngay!`,
            refId: jobId,
            refType: 'job',
          },
        });
      }
    },
  );

  const onJobExpired = inngest.createFunction(
    { id: 'on-job-expired', triggers: [{ event: 'job.expired' }] },
    async ({ event }: TypedInngestContext<'job.expired'>) => {
      const { jobId } = event.data;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { company: { select: { ownerId: true } } },
      });

      if (!job || job.status !== 'ACTIVE') return;

      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'CLOSED' },
      });

      await prisma.notification.create({
        data: {
          userId: job.company.ownerId,
          type: 'SYSTEM',
          title: 'Tin tuyển dụng đã hết hạn',
          content: `Tin "${job.title}" đã hết hạn và đã đóng.`,
          refId: jobId,
          refType: 'job',
        },
      });
    },
  );

  return [onJobActivated, onJobExpiringSoon, onJobExpired];
}
