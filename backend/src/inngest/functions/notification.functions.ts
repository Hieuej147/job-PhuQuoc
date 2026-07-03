import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TypedInngestContext } from '../inngest.types';
import { createNotificationInboxItem } from './notification-inbox.helper';

export function createNotificationFunctions(prisma: PrismaService) {
  const onApplicationCreated = inngest.createFunction(
    { id: 'on-application-created', triggers: [{ event: 'application.created' }] },
    async ({ event }: TypedInngestContext<'application.created'>) => {
      const { applicationId, jobTitle, companyName, employerId } = event.data;

      await createNotificationInboxItem(prisma, {
        userId: employerId,
        type: 'APPLICATION_RECEIVED',
        title: 'Có ứng viên mới',
        content: `Có ứng viên mới nộp CV cho vị trí ${jobTitle} tại ${companyName}`,
        refId: applicationId,
        refType: 'application',
        dedupeKey: `application.created:${applicationId}:${employerId}`,
      });
    },
  );

  const onApplicationAccepted = inngest.createFunction(
    { id: 'on-application-accepted', triggers: [{ event: 'application.accepted' }] },
    async ({ event }: TypedInngestContext<'application.accepted'>) => {
      const { applicationId, jobTitle, companyName, candidateId } = event.data;

      await createNotificationInboxItem(prisma, {
        userId: candidateId,
        type: 'APPLICATION_ACCEPTED',
        title: 'CV đã được chấp nhận',
        content: `CV của bạn đã được chấp nhận cho vị trí ${jobTitle} tại ${companyName}`,
        refId: applicationId,
        refType: 'application',
        dedupeKey: `application.accepted:${applicationId}:${candidateId}`,
      });
    },
  );

  const onApplicationRejected = inngest.createFunction(
    { id: 'on-application-rejected', triggers: [{ event: 'application.rejected' }] },
    async ({ event }: TypedInngestContext<'application.rejected'>) => {
      const { applicationId, jobTitle, companyName, candidateId } = event.data;

      await createNotificationInboxItem(prisma, {
        userId: candidateId,
        type: 'APPLICATION_REJECTED',
        title: 'CV đã bị từ chối',
        content: `CV của bạn đã bị từ chối cho vị trí ${jobTitle} tại ${companyName}`,
        refId: applicationId,
        refType: 'application',
        dedupeKey: `application.rejected:${applicationId}:${candidateId}`,
      });
    },
  );

  const onJobActivated = inngest.createFunction(
    { id: 'on-job-activated', triggers: [{ event: 'job.activated' }] },
    async ({ event }: TypedInngestContext<'job.activated'>) => {
      const { jobId, deadline } = event.data;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true },
      });

      if (!job) return;

      await createNotificationInboxItem(prisma, {
        userId: job.company.ownerId,
        type: 'JOB_APPROVED',
        title: 'Tin tuyển dụng đã được kích hoạt',
        content: `Tin "${job.title}" đã được đăng tuyển thành công. Hạn nộp: ${deadline ? new Date(deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}`,
        refId: jobId,
        refType: 'job',
        dedupeKey: `job.activated:${jobId}:${job.company.ownerId}`,
        expiresInDays: 180,
      });
    },
  );

  return [onApplicationCreated, onApplicationAccepted, onApplicationRejected, onJobActivated];
}
