import { ApplicationStatus } from '@prisma/client';
import { inngest } from '../client';
import { PrismaService } from '../../prisma/prisma.service';
import type { TypedInngestContext } from '../inngest.types';

const REJECTED_APPLICATION_RETENTION = '14d';
const ACCEPTED_APPLICATION_RETENTION = '30d';

async function deleteApplicationIfStillTerminal(
  prisma: PrismaService,
  applicationId: string,
  expectedStatus: ApplicationStatus,
) {
  const application = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    select: { id: true, status: true },
  });

  if (!application || application.status !== expectedStatus) return;

  await prisma.jobApplication.delete({
    where: { id: applicationId },
  });
}

export function createApplicationCleanupFunctions(prisma: PrismaService) {
  const cleanupRejectedApplication = inngest.createFunction(
    { id: 'cleanup-rejected-application', triggers: [{ event: 'application.rejected' }] },
    async ({ event, step }: TypedInngestContext<'application.rejected'>) => {
      await step.sleep('wait-before-delete-rejected-application', REJECTED_APPLICATION_RETENTION);

      await step.run('delete-rejected-application-if-still-rejected', async () => {
        await deleteApplicationIfStillTerminal(prisma, event.data.applicationId, ApplicationStatus.REJECTED);
      });
    },
  );

  const cleanupAcceptedApplication = inngest.createFunction(
    { id: 'cleanup-accepted-application', triggers: [{ event: 'application.accepted' }] },
    async ({ event, step }: TypedInngestContext<'application.accepted'>) => {
      await step.sleep('wait-before-delete-accepted-application', ACCEPTED_APPLICATION_RETENTION);

      await step.run('delete-accepted-application-if-still-accepted', async () => {
        await deleteApplicationIfStillTerminal(prisma, event.data.applicationId, ApplicationStatus.ACCEPTED);
      });
    },
  );

  return [cleanupRejectedApplication, cleanupAcceptedApplication];
}
