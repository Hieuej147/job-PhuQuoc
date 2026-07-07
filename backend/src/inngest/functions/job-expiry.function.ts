import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import type { TypedInngestContext, CronInngestContext } from '../inngest.types';
import { createNotificationInboxItem } from './notification-inbox.helper';

const SAVED_CLOSED_JOB_RETENTION_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

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
        await createNotificationInboxItem(prisma, {
          userId: saved.userId,
          type: 'JOB_DEADLINE',
          title: 'Job sắp hết hạn',
          content: `Vị trí "${job.title}" sẽ hết hạn sau 3 ngày. Nộp CV ngay!`,
          refId: jobId,
          refType: 'job',
          dedupeKey: `job.expiring-soon:${jobId}:${saved.userId}`,
          expiresInDays: 180,
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
        data: { status: JobStatus.CLOSED },
      });

      await createNotificationInboxItem(prisma, {
        userId: job.company.ownerId,
        type: 'SYSTEM',
        title: 'Tin tuyển dụng đã hết hạn',
        content: `Tin "${job.title}" đã hết hạn và đã đóng.`,
        refId: jobId,
        refType: 'job',
        dedupeKey: `job.expired:${jobId}:${job.company.ownerId}`,
        expiresInDays: 180,
      });
    },
  );

  const closeExpiredActiveJobs = inngest.createFunction(
    { id: 'close-expired-active-jobs', triggers: [{ cron: '0 * * * *' }] },
    async ({ step }: CronInngestContext) => {
      const now = new Date();

      const expiredJobs = await step.run('find-expired-active-jobs', async () => {
        return prisma.job.findMany({
          where: {
            status: JobStatus.ACTIVE,
            deadline: { lte: now },
          },
          select: {
            id: true,
            title: true,
            company: { select: { ownerId: true } },
          },
          take: 200,
          orderBy: { deadline: 'asc' },
        });
      });

      for (const job of expiredJobs) {
        const updated = await step.run(`close-expired-job-${job.id}`, async () => {
          return prisma.job.updateMany({
            where: {
              id: job.id,
              status: JobStatus.ACTIVE,
            },
            data: { status: JobStatus.CLOSED },
          });
        });

        if (updated.count === 0) continue;

        await step.run(`notify-expired-job-owner-${job.id}`, async () => {
          await createNotificationInboxItem(prisma, {
            userId: job.company.ownerId,
            type: 'SYSTEM',
            title: 'Tin tuyển dụng đã hết hạn',
            content: `Tin "${job.title}" đã hết hạn và đã đóng.`,
            refId: job.id,
            refType: 'job',
            dedupeKey: `job.expired:${job.id}:${job.company.ownerId}`,
            expiresInDays: 180,
          });
        });
      }

      return { closed: expiredJobs.length };
    },
  );

  const cleanupSavedClosedJobs = inngest.createFunction(
    { id: 'cleanup-saved-closed-jobs', triggers: [{ cron: '0 3 * * *' }] },
    async ({ step }: CronInngestContext) => {
      const cutoff = new Date(Date.now() - SAVED_CLOSED_JOB_RETENTION_DAYS * DAY_MS);

      return step.run('delete-old-saved-closed-jobs', async () => {
        const result = await prisma.savedJob.deleteMany({
          where: {
            job: {
              status: JobStatus.CLOSED,
              deadline: { lte: cutoff },
            },
          },
        });

        return { deleted: result.count, cutoff };
      });
    },
  );

  return [onJobActivated, onJobExpiringSoon, onJobExpired, closeExpiredActiveJobs, cleanupSavedClosedJobs];
}
